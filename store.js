// Dependency-free JSON-file data store.
// No native modules, so `npm install` works on Windows with no build tools.
// All tables live in memory and are written to one JSON file (data/store.db by default).
// Writes are atomic: the data goes to a temp file first, then is renamed over the real file.
// Node runs one thread and every operation here is synchronous, so writes cannot interleave.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const clone = (v) => JSON.parse(JSON.stringify(v));

export class JsonStore {
  // tables: { tableName: { unique: ['field', ...] } }
  constructor(file, tables) {
    this.file = file;
    this.tableDefs = tables;
    this.depth = 0; // > 0 while inside transaction(): writes are deferred to the end
    this.state = {};
    for (const name of Object.keys(tables)) this.state[name] = { seq: 0, rows: [] };
    this.load();
  }

  load() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    if (!fs.existsSync(this.file)) return this.save();
    const raw = fs.readFileSync(this.file, 'utf8');
    if (raw.startsWith('SQLite format 3')) {
      throw new Error(`${this.file} is an old SQLite database. Move it aside, then start again.`);
    }
    const data = raw.trim() ? JSON.parse(raw) : {};
    for (const name of Object.keys(this.tableDefs)) {
      const t = data[name];
      this.state[name] = t && Array.isArray(t.rows) ? { seq: Number(t.seq) || 0, rows: t.rows } : { seq: 0, rows: [] };
    }
  }

  // Atomic write: temp file in the same folder, then rename over the real file.
  save() {
    if (this.depth > 0) return;
    const dir = path.dirname(this.file);
    fs.mkdirSync(dir, { recursive: true });
    const tmp = path.join(dir, `.${path.basename(this.file)}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`);
    try {
      // fsync the temp file before rename so the new contents are on disk before they replace the old file.
      const fd = fs.openSync(tmp, 'w');
      try {
        fs.writeFileSync(fd, JSON.stringify(this.state), 'utf8');
        fs.fsyncSync(fd);
      } finally {
        fs.closeSync(fd);
      }
      try {
        fs.renameSync(tmp, this.file);
      } catch (e) {
        // Windows can refuse to replace a file that another program has open. Remove the target and try once more.
        if (!['EPERM', 'EEXIST', 'EACCES'].includes(e.code)) throw e;
        try { fs.unlinkSync(this.file); } catch { /* ignore */ }
        fs.renameSync(tmp, this.file);
      }
    } finally {
      if (fs.existsSync(tmp)) { try { fs.unlinkSync(tmp); } catch { /* ignore */ } }
    }
  }

  // Runs fn as one unit. If fn throws, memory is restored and nothing is written.
  transaction(fn) {
    const snapshot = clone(this.state);
    this.depth++;
    let result;
    try {
      result = fn();
    } catch (e) {
      this.state = snapshot;
      this.depth--;
      throw e;
    }
    this.depth--;
    this.save();
    return result;
  }

  rows(name) {
    return this.state[name].rows;
  }

  all(name, pred = () => true) {
    return this.rows(name).filter(pred).map((r) => ({ ...r }));
  }

  find(name, pred) {
    const r = this.rows(name).find(pred);
    return r ? { ...r } : undefined;
  }

  count(name, pred = () => true) {
    return this.rows(name).filter(pred).length;
  }

  checkUnique(name, row, self = null) {
    for (const field of this.tableDefs[name].unique || []) {
      if (row[field] === undefined || row[field] === null) continue;
      if (this.rows(name).some((r) => r !== self && r[field] === row[field])) {
        throw new Error(`UNIQUE constraint failed: ${name}.${field}`);
      }
    }
  }

  // Inserts a row and returns its numeric id. Throws "UNIQUE constraint failed" on duplicates.
  insert(name, row) {
    this.checkUnique(name, row);
    const t = this.state[name];
    const id = ++t.seq;
    t.rows.push({ id, ...row });
    this.save();
    return id;
  }

  // Updates matching rows with patch. Returns the number of changed rows.
  update(name, pred, patch) {
    const matches = this.rows(name).filter(pred);
    for (const r of matches) this.checkUnique(name, { ...r, ...patch }, r);
    for (const r of matches) Object.assign(r, patch);
    if (matches.length) this.save();
    return matches.length;
  }

  remove(name, pred) {
    const t = this.state[name];
    const before = t.rows.length;
    t.rows = t.rows.filter((r) => !pred(r));
    const changed = before - t.rows.length;
    if (changed) this.save();
    return changed;
  }
}

// Postgres-backed variant. Used only when DATABASE_URL is set (see server.js).
// Same public API as JsonStore: reads come from memory, and every save writes the changed tables to Postgres.
// Saves are queued in order, so the database always ends up matching memory.
// Schema: one row per table in brainwav_tables (name, seq, rows as JSONB). Created with CREATE TABLE IF NOT EXISTS.
// Set DATABASE_SSL=false only for a local Postgres without TLS. Hosted databases (Render, Neon, Supabase) need TLS.
export class PgStore extends JsonStore {
  constructor(connectionString, tables) {
    // Skip JsonStore's file load (it is synchronous); PgStore.open() loads from Postgres instead.
    super(null, tables);
    this.connectionString = connectionString;
    this.pool = null;
    this.chain = Promise.resolve();
    this.saveError = null;
  }

  load() {}

  static async open(connectionString, tables) {
    const store = new PgStore(connectionString, tables);
    await store.init();
    return store;
  }

  async init() {
    const { default: pg } = await import('pg');
    const ssl = process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false };
    this.pool = new pg.Pool({ connectionString: this.connectionString, ssl, max: 4 });
    await this.pool.query(`CREATE TABLE IF NOT EXISTS brainwav_tables (
      name TEXT PRIMARY KEY,
      seq BIGINT NOT NULL DEFAULT 0,
      rows JSONB NOT NULL DEFAULT '[]'::jsonb
    )`);
    const res = await this.pool.query('SELECT name, seq, rows FROM brainwav_tables');
    const found = new Map(res.rows.map((r) => [r.name, r]));
    for (const name of Object.keys(this.tableDefs)) {
      const r = found.get(name);
      this.state[name] = r && Array.isArray(r.rows) ? { seq: Number(r.seq) || 0, rows: r.rows } : { seq: 0, rows: [] };
    }
    // Create missing table rows right away so a fresh database is initialised.
    await this.writeAll();
  }

  writeAll() {
    const snapshot = clone(this.state);
    const job = this.chain.then(async () => {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        for (const [name, t] of Object.entries(snapshot)) {
          await client.query(
            `INSERT INTO brainwav_tables (name, seq, rows) VALUES ($1, $2, $3::jsonb)
             ON CONFLICT (name) DO UPDATE SET seq = EXCLUDED.seq, rows = EXCLUDED.rows`,
            [name, t.seq, JSON.stringify(t.rows)],
          );
        }
        await client.query('COMMIT');
        this.saveError = null;
      } catch (e) {
        await client.query('ROLLBACK').catch(() => {});
        this.saveError = e;
        console.error('Postgres save failed:', e.message);
      } finally {
        client.release();
      }
    });
    this.chain = job;
    return job;
  }

  save() {
    if (this.depth > 0) return;
    this.writeAll();
  }

  // Resolves once every queued write has finished. Call before exit if you need it.
  async flush() {
    await this.chain;
  }
}
