# SYSTEM DIAGRAM: Service Marketplace MVP

```mermaid
graph TD
    %% --- USER FLOW ---
    User((User)) -->|1. Browse & Ask| Frontend[Next.js App\n(Web + PWA)]
    Frontend -->|2. Get Availability| API[Next.js API Routes]
    Frontend -->|3. Chat Request| AIC[AI Controller\n(Vercel Function)]
    
    %% --- AI LAYER ---
    AIC -->|4. Fetch Context| DB[(Postgres DB\nPrisma ORM)]
    AIC -->|5. Structured Prompt| LLM[LLM Provider\n(OpenAI/Anthropic)]
    LLM -->|6. JSON Intent| AIC
    
    AIC -->|7. Action: Check Rules| Rules[Business Rules Engine]
    Rules -->|8. Validate Policy| DB
    
    %% --- BOOKING CORE ---
    AIC -->|9. Action: Create Booking| Booking[Booking Engine\n(Atomic Transaction)]
    Booking -->|10. Lock Slot| DB
    Booking -->|11. Payment Hold| Stripe[Stripe API]
    
    %% --- NOTIFICATIONS ---
    Booking -->|12. Success Event| Queue[Job Queue\n(Inngest/BullMQ)]
    Queue -->|13. Send Email/SMS| Notify[Email/SMS Provider\n(Resend/Twilio)]
    
    %% --- ADMIN / BIZ ---
    Business((Business)) -->|Set Avail| Frontend
    Admin((Admin)) -->|View Logs| Dashboard[Admin Dashboard]
    Dashboard -->|Audit| DB
```

## Component Breakdown

1.  **Frontend (Next.js):**
    *   Unified app for Users, Businesses, and Admin.
    *   Renders the "Chat" interface for AI booking.
    *   Displays availability calendar.

2.  **AI Controller (Backend):**
    *   Receives user message.
    *   Fetches *real* business context (services, policy) from DB.
    *   Calls LLM with strict `JSON Mode`.
    *   Parses intent -> Calls Booking Engine.

3.  **Booking Engine (Core Logic):**
    *   The "source of truth" for availability.
    *   Prevents double bookings via DB locks.
    *   Manages state: `PENDING` -> `CONFIRMED` -> `COMPLETED`.

4.  **Database (Postgres):**
    *   Stores Users, Businesses, Services, Bookings, Audit Logs.
    *   Single source of truth.

5.  **External Services:**
    *   **Stripe:** Payments & Holds.
    *   **LLM:** Intelligence (Text -> Intent).
    *   **Email/SMS:** Notifications.
