# Ares Booking Platform

A production-ready appointment booking platform with Stripe deposit payments, reputation scoring, AI chat assistance, and a full admin panel.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (Pages Router) |
| Auth | NextAuth.js v4 (Email magic-link) |
| Database | PostgreSQL via Prisma ORM (Supabase) |
| Payments | Stripe (PaymentIntents, deposit hold + capture) |
| Email | Resend (optional) / nodemailer fallback |
| AI | OpenAI GPT-4o (support + booking assistant) |
| Hosting | Vercel |

## Local Setup

### 1. Prerequisites

- Node.js 18+
- A PostgreSQL database (Supabase free tier works)
- Stripe account (test mode)
- OpenAI API key

### 2. Clone and install

```bash
git clone https://github.com/anastasia-george/ares-booking-platform
cd ares-booking-platform
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values. Required variables:

- `DATABASE_URL` + `DIRECT_URL` — Supabase connection strings
- `NEXTAUTH_URL` — `http://localhost:3000` for local dev
- `NEXTAUTH_SECRET` — run `openssl rand -base64 32`
- `EMAIL_SERVER_*` + `EMAIL_FROM` — SMTP credentials for magic-link auth
- `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — from Stripe dashboard
- `STRIPE_WEBHOOK_SECRET` — from Stripe CLI or dashboard
- `OPENAI_API_KEY`

### 4. Set up the database

```bash
# Push schema to your database
npx prisma db push

# Seed with a demo business, service, and admin account
npm run seed
```

The seed script prints the generated IDs — keep the Business ID and Service ID handy.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Set up Stripe webhooks (local)

In a separate terminal:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the printed webhook secret and set it as `STRIPE_WEBHOOK_SECRET` in `.env.local`.

## Routes

| Route | Description | Auth |
|---|---|---|
| `/` | Customer booking page | Public (must sign in to book) |
| `/dashboard` | Business owner dashboard | `BUSINESS_OWNER` or `ADMIN` |
| `/business/setup` | Manage services, availability, policy | `BUSINESS_OWNER` or `ADMIN` |
| `/admin` | Platform stats + open disputes | `ADMIN` |
| `/admin/disputes` | Dispute management | `ADMIN` |
| `/my-bookings` | Customer's own bookings | Any authenticated user |

## API Reference

### Booking Flow

```
POST /api/bookings               Create booking + return Stripe clientSecret
PATCH /api/bookings/:id          Cancel / complete / mark no-show
GET  /api/availability           Get available time slots
POST /api/webhooks/stripe        Stripe event handler (raw body, sig-verified)
```

### Business Management

```
GET  /api/business/:id/bookings
GET|PUT  /api/business/:id/policy
GET|POST|PATCH  /api/business/:id/services
GET|PUT  /api/business/:id/availability
```

### Admin

```
GET  /api/admin/stats
GET  /api/admin/users
GET|PATCH  /api/admin/disputes
GET  /api/admin/bookings
```

### AI

```
POST /api/chat       Booking assistant or support agent
```

## Booking Payment Flow

1. Customer selects a slot → `POST /api/bookings` → creates `PENDING_PAYMENT` booking + Stripe PaymentIntent
2. Frontend shows Stripe Elements (deposit amount, e.g. 50%)
3. Customer confirms card → Stripe processes
4. Stripe fires `payment_intent.succeeded` webhook → `/api/webhooks/stripe` confirms booking (`CONFIRMED` or `PENDING` depending on approval mode)
5. On service delivery → business marks `COMPLETED` → deposit captured
6. On no-show → business marks `NO_SHOW` → no-show fee charged from deposit

## Running Tests

```bash
npm test
# or
npm run test:watch
```

Tests cover:
- `booking-engine` — state machine, conflict detection, lead-time validation
- `reputation` — scoring deltas, eligibility gating
- `policy` — cancellation window logic, refund calculation

## Deploying to Vercel

1. Push to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Set all environment variables in the Vercel dashboard
4. Add your Vercel deployment URL to Stripe webhook endpoints
5. Run `npx prisma db push` against your production database
6. Run `npm run seed` (once only) against production

## Go-Live Checklist

- [ ] All `.env.example` variables set in Vercel dashboard
- [ ] `NEXTAUTH_URL` set to production domain
- [ ] Stripe webhook endpoint registered with production URL
- [ ] `STRIPE_WEBHOOK_SECRET` updated to live endpoint secret
- [ ] Switch `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to live keys
- [ ] Database migrated (`prisma db push`) on production DB
- [ ] Seed run once on production DB
- [ ] Admin user email confirmed (sign in via magic link)
- [ ] Test end-to-end booking with a real card in live mode
- [ ] `RESEND_API_KEY` set if transactional emails are required
- [ ] Custom domain configured in Vercel

## Non-Goals (MVP)

- Multi-location businesses
- SMS notifications (phone field is in DB, but not wired)
- Recurring bookings / subscriptions
- Native mobile app
- Calendar sync (Google Calendar, iCal)
- Multi-staff scheduling
