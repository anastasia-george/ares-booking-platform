# Ares Booking Platform — Architecture

## Current MVP (Live Now)

A single-tenant appointment booking system. One verified business, one storefront, multi-customer.

### High-Level Components

```
Browser (React/Next.js)
  │
  ├── / (index)           → BookingCalendar + Stripe Elements
  ├── /dashboard          → BusinessDashboard (owner view)
  ├── /business/setup     → Services / Availability / Policy management
  ├── /admin              → Platform stats + disputes
  └── /admin/disputes     → Dispute resolution
        │
        ▼ HTTPS
Next.js API Routes (Node.js / Vercel Serverless)
  │
  ├── /api/auth/[...nextauth]   ← NextAuth (Email magic-link)
  ├── /api/bookings             ← Core booking CRUD
  ├── /api/availability         ← Slot generation
  ├── /api/business/[id]/*      ← Business management
  ├── /api/admin/*              ← Admin panel APIs
  ├── /api/chat                 ← OpenAI assistant
  ├── /api/webhooks/stripe      ← Stripe event handler
  └── /api/payments/intent      ← Stripe PaymentIntent retry
        │
        ├── Prisma ORM ──────→ PostgreSQL (Supabase)
        ├── Stripe SDK ──────→ Stripe API
        ├── OpenAI SDK ──────→ OpenAI API
        └── Resend SDK ──────→ Resend API (optional)
```

### Data Flow: Booking Creation

```mermaid
sequenceDiagram
    participant C as Customer Browser
    participant API as Next.js API
    participant DB as PostgreSQL
    participant S as Stripe
    participant WH as Webhook Handler

    C->>API: POST /api/bookings {serviceId, startTime}
    API->>DB: Check eligibility + overlap
    API->>DB: CREATE booking (PENDING_PAYMENT)
    API->>S: Create PaymentIntent (deposit amount)
    S-->>API: clientSecret
    API-->>C: {booking, clientSecret}

    C->>S: stripe.confirmPayment(clientSecret)
    S-->>C: Payment authorised

    S->>WH: payment_intent.succeeded
    WH->>DB: UPDATE booking → CONFIRMED
    WH->>C: Email confirmation (via Resend)
```

### Data Flow: Booking Completion

```mermaid
sequenceDiagram
    participant B as Business Owner
    participant API as Next.js API
    participant DB as PostgreSQL
    participant S as Stripe

    B->>API: PATCH /api/bookings/:id {status: COMPLETED}
    API->>DB: UPDATE booking → COMPLETED
    API->>S: Capture PaymentIntent (capture full amount)
    API->>DB: UPDATE reputation (+2 to customer score)
    API-->>B: 200 OK
```

### Database Schema (Key Models)

```
User ──────────┬── Business ──┬── Service
               │              ├── Availability
               │              ├── AvailabilityOverride
               │              └── BusinessPolicy
               │
               └── Booking ───┬── Review
                              ├── Dispute
                              └── (paymentId → Stripe)

ReputationScore (1:1 with User)
NotificationLog
AuditLog
```

### Booking Status State Machine

```
PENDING_PAYMENT
     │
     ├─(payment succeeds, AUTO_CONFIRM)──→ CONFIRMED
     ├─(payment succeeds, MANUAL)─────→ PENDING ──→ CONFIRMED
     ├─(payment fails)────────────────→ (deleted / left in PENDING_PAYMENT)
     └─(cancelled before payment)─────→ CANCELLED_BY_USER

CONFIRMED
     ├─(customer cancels)──→ CANCELLED_BY_USER  (→ refund)
     ├─(business cancels)──→ CANCELLED_BY_BUSINESS (→ full refund)
     ├─(service delivered)─→ COMPLETED           (→ capture deposit)
     ├─(no-show)───────────→ NO_SHOW             (→ charge no-show fee)
     └─(dispute raised)────→ DISPUTED

DISPUTED
     ├─(resolved for customer)──→ REFUNDED
     └─(resolved for business)──→ COMPLETED
```

### Trust & Reputation

Reputation scores range 0–100 (default: 100).

| Event | Score Delta |
|---|---|
| Booking completed | +2 |
| No-show | -20 |
| Late cancellation | -10 |
| Dispute lost (user) | -5 |
| Dispute won (user) | +5 |

- Score < 20: hard block from new bookings
- Score 20–49: flagged for admin review
- Score ≥ 50: unrestricted

---

## Target Architecture (Future Marketplace)

Multi-tenant marketplace where many businesses onboard independently.

### Key Additions

- **Business onboarding flow**: self-serve registration, verification queue, Stripe Connect for payouts
- **Multi-staff scheduling**: staff profiles, per-staff availability, assignment at booking time
- **SMS notifications**: Twilio integration wired to the `phone` field already in the User model
- **Calendar sync**: Google Calendar / iCal export for both customers and businesses
- **Search & discovery**: business directory with categories, location filtering, reviews aggregation
- **Subscription billing**: recurring appointments with Stripe Subscriptions
- **Mobile apps**: React Native sharing the same API layer

```mermaid
graph TB
    subgraph Frontend
        Web[Next.js Web App]
        Mobile[React Native App]
    end

    subgraph API["API Layer (Next.js)"]
        BookingAPI[Booking Engine]
        AuthAPI[Auth Service]
        BusinessAPI[Business Service]
        SearchAPI[Search & Discovery]
        AIChat[AI Assistant]
    end

    subgraph Data
        PG[(PostgreSQL)]
        Redis[(Redis Cache)]
        S3[(Object Storage)]
    end

    subgraph External
        StripeConnect[Stripe Connect]
        Twilio[Twilio SMS]
        Resend[Resend Email]
        OpenAI[OpenAI]
        GCal[Google Calendar]
    end

    Web --> API
    Mobile --> API
    API --> Data
    BookingAPI --> StripeConnect
    AuthAPI --> Resend
    BookingAPI --> Twilio
    BookingAPI --> GCal
    AIChat --> OpenAI
```

### Stripe Connect Flow (Future)

Each business connects their Stripe account. Deposits are split:
- Platform fee (e.g. 2%) retained
- Remainder transferred to business on completion
- Refunds issued from platform reserve on cancellation

### Database Additions Required

- `StaffMember` — belongs to Business, has own Availability
- `BusinessVerification` — KYC queue for admin
- `StripeConnectAccount` — per-business connected account ID
- `Subscription` — recurring booking config
- `Category` — business taxonomy for search
