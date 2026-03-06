// ai-contract.ts
// Typed contracts for the Ares AI layer.
//
// TWO AGENTS:
//   1. Support Agent  — answers questions about services, policies, hours, etc.
//      Route: POST /api/chat  (agentType: "SUPPORT")
//
//   2. Booking Assistant — guides the user through selecting and drafting a booking.
//      It does NOT create bookings on its own; it returns structured bookingDetails
//      which the frontend confirms with the user before calling POST /api/bookings.
//      Route: POST /api/chat  (agentType: "BOOKING_ASSISTANT")
//
// GUARDRAILS (enforced in system prompt + server-side validation):
//   - AI may only reference services from the availableServices list.
//   - AI must never claim a slot is "booked" — it can only "draft" or "suggest".
//   - AI must refuse requests outside allowed intents.
//   - AI must apply business policy (e.g. cancellation window, deposit info).
//   - Invalid JSON responses are caught and replaced with a safe fallback.
//   - AI calls have a 10-second timeout; failure returns FALLBACK_REPLY.
//
// COST TARGETS (V1):
//   - Model: gpt-4o-mini (low cost, fast)
//   - Max tokens output: 500
//   - Max tokens context: last 10 messages
//
// LATENCY TARGETS (V1):
//   - p50: < 2s
//   - p95: < 5s
//   - Timeout: 10s (returns fallback)

/**
 * Agent type selector.
 */
export type AgentType = 'SUPPORT' | 'BOOKING_ASSISTANT';

/**
 * Allowed intents the AI may classify.
 * AI must use REFUSED for anything outside scope.
 */
export type Intent =
  | 'BOOKING_REQUEST'     // User wants to book a service
  | 'CANCELLATION_REQUEST'// User wants to cancel a booking
  | 'AVAILABILITY_QUERY'  // User asks about available times
  | 'SERVICE_QUERY'       // User asks about services, prices, duration
  | 'POLICY_QUERY'        // User asks about cancellation/refund/deposit policy
  | 'GENERAL_QUERY'       // Other question we can answer
  | 'COMPLAINT'           // User is expressing a complaint
  | 'REFUSED'             // Request is outside scope (see refusal.code)
  | 'OTHER';

/**
 * Refusal codes — AI must use one of these when it cannot fulfil a request.
 */
export type RefusalCode =
  | 'POLICY_VIOLATION'    // e.g. cancel within lockout window
  | 'NO_AVAILABILITY'     // Slot not available
  | 'MISSING_INFO'        // Cannot proceed without more info
  | 'OUT_OF_SCOPE'        // Request is not related to this business/booking
  | 'UNSAFE_REQUEST'      // Request contains harmful/inappropriate content
  | 'SERVICE_NOT_FOUND';  // Requested service does not exist

/**
 * Input context provided to the AI on every request.
 */
export interface ModelInput {
  agentType: AgentType;
  user: {
    id: string;
    name: string;
    isReturning: boolean;
    reputationScore?: number; // surfaced so AI can tailor messaging
  };
  business: {
    id: string;
    name: string;
    timezone: string; // e.g. "Australia/Melbourne"
    policy: {
      cancellationWindowHours: number;
      depositRequired: boolean;
      depositPercent: number;
      minLeadTimeHours: number;
    };
  };
  availableServices: {
    id: string;
    name: string;
    durationMin: number;
    priceCents: number;
  }[];
  conversationHistory: {
    role: 'user' | 'assistant';
    content: string;
  }[]; // Last 10 messages only (cost control)
  currentMessage: string;
}

/**
 * Structured output the AI must return.
 * All fields must be present; nullable fields must be explicitly null.
 * Any response that fails JSON.parse is replaced with FALLBACK_REPLY.
 */
export interface ModelOutput {
  /**
   * Internal reasoning trace (hidden from user; stored in AI request log for audit).
   */
  reasoning: string;

  /**
   * Classified user intent.
   */
  intent: Intent;

  /**
   * Filled only when intent === 'BOOKING_REQUEST' and AI has enough info.
   * Frontend must confirm with user before calling POST /api/bookings.
   */
  bookingDetails?: {
    serviceId: string | null;      // From availableServices.id
    suggestedDate: string | null;  // ISO date "YYYY-MM-DD"
    suggestedTime: string | null;  // 24hr "HH:MM"
  } | null;

  /**
   * Filled when the AI cannot or should not fulfil the request.
   */
  refusal?: {
    code: RefusalCode;
    reason: string; // Human-readable; will be shown to user via replyToUser
  } | null;

  /**
   * The message shown to the user.
   */
  replyToUser: string;

  /**
   * UI action hints (buttons/cards the frontend may render).
   */
  suggestedActions?: {
    type: 'CONFIRM_BOOKING' | 'VIEW_SERVICES' | 'CONTACT_SUPPORT' | 'CANCEL_BOOKING';
    label: string;
    payload?: Record<string, unknown>;
  }[] | null;
}

/**
 * Safe fallback reply returned when AI call fails (timeout, invalid JSON, etc.).
 */
export const FALLBACK_REPLY: ModelOutput = {
  reasoning: 'AI service unavailable — returning fallback.',
  intent: 'OTHER',
  bookingDetails: null,
  refusal: null,
  replyToUser:
    "I'm having trouble right now. Please try again in a moment, or contact us directly to make a booking.",
  suggestedActions: [{ type: 'CONTACT_SUPPORT', label: 'Contact Support' }],
};

/**
 * AI request log entry — stored in DB/logs for cost and latency observability.
 */
export interface AIRequestLog {
  userId: string;
  agentType: AgentType;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  intent: Intent;
  success: boolean;
  error?: string;
  createdAt: string; // ISO timestamp
}
