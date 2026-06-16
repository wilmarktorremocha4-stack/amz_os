# AMZ OS

Business operating system for Amazon wholesale sellers: profit calculators,
supplier/brand CRM, manual product research log, and a progress tracker
based on business activity (not video consumption).

Built with Next.js (App Router, TypeScript, Tailwind) and Prisma/Postgres.

## Getting started

```bash
npm install
cp .env.example .env   # set DATABASE_URL
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Status

- **Calculators** — ROI calculator is live and fully client-side; other
  calculators (margin, break-even, inventory cost, multi-pack, bundle,
  sales tax, prep center, reorder) are scaffolded in
  `src/app/calculators/page.tsx` pending implementation.
- **Supplier CRM**, **Product Research**, **Progress Tracker** — schema is
  defined in `prisma/schema.prisma` (`Supplier`, `Brand`, `FollowUp`,
  `Product`, `ActivityLog`, `CalculatorRun`); pages are scaffolded but need
  a live database connection to read/write data.
- No external Amazon data API is connected. Product Research is designed
  for manually entered data until a provider (e.g. Keepa, SP-API) is wired
  in.
- No Skool, email, or Dify integrations are wired in yet — `User.skoolId`
  exists in the schema as the join point for Skool-based identity/activity
  sync once API/webhook access is available.

## Deploy

Deploys cleanly to Netlify or Vercel. Needs a Postgres connection string
(e.g. Supabase, Neon, Railway) set as `DATABASE_URL`.
