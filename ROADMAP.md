# PROJECT ROADMAP: Service Marketplace MVP

## 0) Model Call Job (The "Brain")
- [x] Define Model Contract (Inputs/Outputs JSON) `ai-contract.ts`
- [ ] Define Guardrails & Refusal Rules
- [ ] Define Cost/Latency Targets

## 1) Product Foundation (MVP Scope)
- [x] Define Customer Flows (Browse, Book, Pay) `BookingCalendar.tsx` + `pages/api/bookings`
- [ ] Define Business Flows (Post, Approve, View) `BusinessDashboard.tsx`
- [ ] MVP Feature List & Non-Goals

## 2) Architecture (Minimum Viable)
- [x] Select Stack (Next.js, Postgres, Stripe, etc.)
- [x] System Diagram `system-diagram.md`
- [x] Tech Stack Decision
- [x] Auth Setup (NextAuth) `pages/api/auth/[...nextauth].ts`
- [x] Notifications (Email/SMS Manager) `notification-manager.ts`

## 3) Database + Domain Model (The Foundation)
- [x] Design Users (Roles) `schema.prisma`
- [x] Design Businesses / Schools `schema.prisma`
- [x] Design Services `schema.prisma`
- [x] Design Availability / Slots `schema.prisma`
- [x] Design Bookings `schema.prisma`
- [x] Design Payments `schema.prisma`
- [x] Design Policies `business-policy.ts`
- [x] Design Audit Logs `schema.prisma`
- [x] **Deliverable:** Schema & Key Constraints

## 4) Booking Engine (The "Hard Part")
- [x] Slot Generation Rules `business-availability.ts`
- [x] Booking Creation (Atomic) `booking-engine.ts`
- [x] Cancellation Rules `booking-engine.ts`
- [x] No-Show State Machine `booking-engine.ts`
- [x] Timezone Handling (UTC in DB)
- [x] Payment Holds & Captures `stripe-payments.ts`
- [x] Integration with Notifications (Conceptual)

## 5) Model Call Integration (AI Layer)
- [x] "Support Agent" Integration `pages/api/chat.ts`
- [ ] "Booking Assistant" Integration
- [x] AI Endpoints & Schemas `ai-contract.ts`

## 6) Trust & Safety Basics
- [x] Business Verification `trust-safety.ts`
- [x] Dispute Flow `trust-safety.ts`
- [x] Rate Limiting `trust-safety.ts`
- [x] Policy Rules & Admin Capabilities `business-policy.ts`

## 7) Admin + Operations
- [x] User/Business Views `BusinessDashboard.tsx`
- [x] Booking/Payment Status Views `BusinessDashboard.tsx`
- [ ] Dispute Resolution
- [ ] Refund Triggers

## 8) Testing + Launch
- [ ] Unit Tests (Booking Logic)
- [ ] Integration Tests (Payments/Notions)
- [ ] Staging Environment
- [ ] Launch Checklist
