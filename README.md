# Mahalla Cinema

Telegram Mini App for booking a cinema/football-screening venue (poufs & tapchans), with an
in-process Telegram bot (long polling), admin panel, QR check-in, notifications and promo codes.

## Stack

- Next.js (App Router) + React, served under `basePath: /cinema`
- PostgreSQL via Prisma (`@prisma/adapter-pg`)
- `grammy` Telegram bot, started from [src/instrumentation.ts](src/instrumentation.ts) in the same
  Node process as the web server — **do not run more than one instance**, it would double-poll
  the bot token.

## Local development

```bash
npm install
npx prisma migrate deploy   # or `prisma migrate dev` when changing the schema
npm run dev
```

Copy `.env.production` → `.env` (or create your own) and fill in `DATABASE_URL`, `BOT_TOKEN`,
`ADMIN_TELEGRAM_IDS`, `SESSION_SECRET`, `APP_URL`.

## Production deploy (systemd)

1. Copy the project to the server (e.g. `/home/MahallaCinema`) and put a production `.env` there.
2. Build once (and after every update):
   ```bash
   npm ci
   npx prisma generate
   npx prisma migrate deploy
   npm run build
   ```
3. Register and start the service straight from the repo — no copying into `/etc/systemd/system`:
   ```bash
   systemctl link /home/MahallaCinema/mahalla-cinema.service
   systemctl daemon-reload
   systemctl enable --now mahalla-cinema.service
   ```
4. Point nginx at `127.0.0.1:3000` (proxy_pass) and serve `/cinema/_next/static/` and
   `/cinema/uploads/` directly from `.next/static/` and `public/uploads/` for caching.

Check status/logs with `systemctl status mahalla-cinema` / `journalctl -u mahalla-cinema -f`.
