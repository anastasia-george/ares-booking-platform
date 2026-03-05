# PROJECT MANIFEST: Service Marketplace MVP

A comprehensive inventory of the codebase generated for the Ares Booking Platform.

## 1. Core Backend (The Engine)
*   **`schema.prisma`**: The database source of truth. Defines Users, Businesses, Services, Bookings, and Audit Logs.
*   **`booking-engine.ts`**: The critical logic for creating bookings atomically, handling cancellations, and managing the state machine (Pending -> Confirmed -> No-Show).
*   **`business-availability.ts`**: Handles weekly schedules and overrides to determine if a business is open.
*   **`business-policy.ts`**: Defines business rules like cancellation windows, deposit requirements, and auto-confirm settings.
*   **`trust-safety.ts`**: Manages business verification, dispute flagging, and rate limiting.

## 2. API Layer (Next.js Routes)
*   **`pages/api/bookings/index.ts`**: `POST` endpoint to create new bookings. checks availability, rate limits, and auth.
*   **`pages/api/bookings/[id].ts`**: `PATCH` endpoint to update booking status (Complete, Cancel, No-Show). Handles payment capture/refunds.
*   **`pages/api/availability/index.ts`**: `GET` endpoint to fetch available time slots for a specific date/service.
*   **`pages/api/auth/[...nextauth].ts`**: Authentication configuration using NextAuth.js (Email Magic Links + Google).

## 3. AI Integration (The Brain)
*   **`ai-contract.ts`**: TypeScript interfaces defining the strict JSON input/output format for the AI model.
*   **`pages/api/chat.ts`**: The backend handler for the AI chat. Fetches real context, prompts the LLM, and verifies availability before replying.

## 4. Frontend Components (React)
*   **`components/BookingCalendar.tsx`**: A calendar widget for users to view slots and book appointments.
*   **`components/BusinessDashboard.tsx`**: An admin table for businesses to view upcoming bookings and mark them as Completed/No-Show.

## 5. Infrastructure & Services
*   **`stripe-payments.ts`**: Handles payment intents (Holds), captures (Charges), and refunds.
*   **`notification-manager.ts`**: Service for sending email/SMS confirmations and reminders.
*   **`system-diagram.md`**: Mermaid.js visualization of the system architecture.
*   **`ROADMAP.md`**: The master plan tracking progress across all phases.

---

## How to Run (Next Steps)
1.  **Initialize DB:** Run `npx prisma generate` and `npx prisma db push`.
2.  **Env Vars:** Set up `.env` with `DATABASE_URL`, `STRIPE_SECRET_KEY`, `OPENAI_API_KEY`, etc.
3.  **Start Server:** Run `npm run dev`.
4.  **Test:** Visit `/api/availability` or use the `BookingCalendar` component.
