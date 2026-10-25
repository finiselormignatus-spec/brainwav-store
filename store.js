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
      fs.writeFileSync(tmp, JSON.stringify(this.state), 'utf8');
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
