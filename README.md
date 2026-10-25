# Marc Brainwav Premium Deals

One self-contained app: a Node/Express server (`server.js`) serves the built storefront from `dist/` and the JSON API from `/api`, both on one port. Data is a single SQLite file, so there is no external database or hosting dependency.

## Requirements
- Node.js 18.18 or newer (20 or 22 LTS recommended)
- npm

## Run it

```
npm install
npm run build
npm start
```

Then open http://localhost:3000 (set `PORT=8080 npm start` to change the port).

## First-time setup
1. On first start the server creates `data/store.db` and seeds the catalog from `src/data/catalog.json` (only when the products table is empty).
2. Open `/admin` and set the admin password (first open only). After that, log in with it.
3. Edit products, prices, stock and payment handles from the admin dashboard.

Customers create an account at `/register` before checkout. Admin and customer logins are stored in the SQLite file, so they work the same on your laptop or on any server.

## Hosting on your own server
- Copy the project folder to the server, run the three commands above, then keep `npm start` running with a process manager (pm2, systemd, or a Docker container).
- Put a reverse proxy (Caddy, nginx) in front for HTTPS, pointing at the app port.
- Back up `data/store.db` (and the `data/` folder). That single file holds all products, customers, orders and settings.
- Set `DATA_DIR=/some/path` to keep the database outside the project folder.

## Email notifications (optional)
The server emails customers a welcome message on registration and an order confirmation (with the order reference, items and totals) when an order is placed. Mail is sent in the background, so it never slows checkout, and failures are logged without stopping the order.

1. Copy `.env.example` to `.env` in the project folder.
2. Fill in the lines:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM="Marc Brainwav Premium Deals <you@gmail.com>"
```
- Gmail: create an app password (Google Account, Security, App passwords). Use it as `SMTP_PASS`, not your normal password.
- Any other SMTP provider works the same way: set its host, port, user and password.
- Leave `SMTP_USER` empty and email is off. The store still works and orders still save.

## Payments
- Default: manual payment. Customers see your CashApp, Zelle, PayPal and Venmo handles and place an order marked pending.
- Paystack is stubbed behind a flag in the admin Settings. Turn it on there when you have your Paystack key.

## Contact
WhatsApp +233595484295, call 0501994337, Snapchat keli_brainwav21.

## Project layout
- `server.js`: API and static server (Express + JSON-file store, no native build tools)
- `uploads/`: product photos uploaded from the admin dashboard (Products > Add/Edit > Product photo). Served at `/uploads/<file>`. Only JPG, PNG and WebP are accepted, checked by the file's contents (not its name), max 5MB, saved under random filenames. Upload needs the admin login. Set `UPLOAD_DIR` to store them somewhere else (for example a persistent disk on Render). Back this folder up with the database, because the photos are not in git.
- `src/`: React storefront and admin (Vite)
- `mailer.js`: email notifications (nodemailer, SMTP from `.env`)
- `src/data/catalog.json`: seed products (edit or replace freely; the seed runs only on an empty database)
- `data/store.db`: created at runtime, not in the zip
