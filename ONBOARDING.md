# Onboarding

## Checklist

- [ ] `npm install`
- [ ] Copy `.env.example` → `.env`
- [ ] Fill `DATABASE_URL` (Supabase direct), `NEXTAUTH_SECRET`, `NEXT_PUBLIC_APP_URL`
- [ ] `npx prisma db push`
- [ ] `npm run dev` → login

## Tech stack

- Next.js 16 / React 19 / TypeScript
- Prisma + PostgreSQL (Supabase)
- NextAuth (Credentials)
- Tailwind CSS
- Recharts

## Key paths

- Dashboard: `app/dashboard/page.tsx`
- Auth: `app/api/auth/[...nextauth]/route.ts`
- DB: `prisma/schema.prisma`
- Actions: `app/dashboard/*/actions.ts`

## Vercel deploy

1. Push to GitHub
2. Import in Vercel
3. Set env vars
4. Deploy
