# TRANSFER MARKET - Football Franchise Auction System

Production-ready event control room for a college football franchise auction.

## Stack

- Next.js 15 App Router + TypeScript
- TailwindCSS with shadcn-style owned UI primitives
- PostgreSQL + Prisma ORM
- NextAuth credentials authentication for admins
- Realtime audience updates through polling + BroadcastChannel fan-out, with database persistence for production
- Vercel-ready deployment

## Event Rules Implemented

- 7 database-driven teams, not hardcoded in UI
- 9-player squad limit
- Base capital: ₹100 Cr
- Quiz capital quick entries: Easy ₹10 Cr, Medium ₹25 Cr, Hard ₹50 Cr
- Capital formula: base capital + quiz/event effects - purchases
- Positional validation: 1 GK, 2 DEF, 1 MID, 1 ATT, 4 FLEX
- OVR-based leaderboard and winner ranking
- Event card engine with default and custom cards
- One-click global undo for purchases, cards, and team edits
- CSV/XLSX player upload with column auto-mapping
- Bulk team import using spreadsheet-style columns
- Results exports: PDF print, Excel, CSV, JSON backup/restore

## Local Setup

```bash
npm install
cp .env.example .env
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Open:

- Public leaderboard: `http://localhost:3000`
- Admin panel: `http://localhost:3000/admin`
- Results: `http://localhost:3000/results`

If `DATABASE_URL` is not configured, the app uses an in-memory/local offline fallback so the UI can still be tested quickly.

## Environment Variables

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/transfer_market?schema=public"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_EMAIL="admin@transfermarket.local"
ADMIN_PASSWORD="change-me-before-event"
```

Default local admin credentials are `admin@transfermarket.local` / `admin123` when env vars are absent. Change them before production.

## Spreadsheet Formats

Player upload accepts CSV/XLSX columns:

- `Player Name`
- `Position`
- `OVR`
- `Base Price`

Team bulk import accepts:

- `Team Name`
- `Color`
- `Base Capital`
- `Quiz Capital`

Column aliases such as `Name`, `Player`, `Rating`, `Price`, `Team`, and `Capital` are also recognized.

## Vercel Deployment

1. Create a PostgreSQL database such as Vercel Postgres, Neon, Supabase, or Railway.
2. Add all environment variables in Vercel Project Settings.
3. Deploy the repository.
4. Run Prisma migration once from a trusted machine:

```bash
npm install
npx prisma migrate deploy
npx prisma db seed
```

The build command is:

```bash
npm run build
```

## Operations

- `Enter` confirms the current sale in the auction tab.
- `Ctrl+Z` triggers global undo.
- `/` focuses player search.
- Projector contrast and fullscreen controls are in the header.
- Every mutation is persisted as `AuctionHistory`; event cards also write `EventCardHistory`.
- Use `Backup JSON` before the event and between rounds for offline recovery.
