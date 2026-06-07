# Mori Management

Pilates studio management: customers, packages, check-in, revenue, reports.

## Setup

```bash
cp .env.example .env
# DATABASE_URL, NEXTAUTH_SECRET, NEXT_PUBLIC_APP_URL
npx prisma db push
```

## Login

- Admin: `admin` / `admin123`
- Staff: `staff` / `staff123`

## Run

```bash
npm install
npm run dev
```

## Notes

- Env vars required: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_APP_URL`
- Prisma provider is PostgreSQL (Supabase)
