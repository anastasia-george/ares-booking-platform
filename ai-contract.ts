// ai-contract.ts

/**
 * 1. INPUT: What the AI receives
 * Context about the user and business to inform its decision.
 */
export interface ModelInput {
  user: {
    id: string;
    name: string;
    isReturning: boolean;
  };
  business: {
    id: string;
    name: string;
    timezone: string; // e.g. "Australia/Melbourne"
    policy: {
      cancellationHours: number; // e.g. 24
      depositRequired: boolean;
    };
  };
  availableServices: {
    id: string;
    name: string;
    durationMin: number;
    priceCents: number;
  }[];
  conversationHistory: {
    role: "user" | "assistant";
    content: string;
  }[];
  currentMessage: string;
}

/**
 * 2. OUTPUT: What the AI must return
 * Strictly structured JSON. No chatter outside 'replyToUser'.
 */
export interface ModelOutput {
  /**
   * The reasoning trace (hidden from user, for audit/debug).
   * <think> style internal monologue.
   */
  reasoning: string;

  /**
   * The classified intent of the user.
   */
  intent: "BOOKING_REQUEST" | "CANCELLATION_REQUEST" | "QUERY" | "COMPLAINT" | "OTHER";

  /**
   * If intent is BOOKING_REQUEST, fill this.
   * AI must extract or infer these from conversation.
   */
  bookingDetails?: {
    serviceId: string | null; // Null if ambiguous
    suggestedDate: string | null; // ISO Date "2023-10-27"
    suggestedTime: string | null; // 24hr "14:00"
  };

  /**
   * If the request violates policy (e.g. cancelling 1hr before), set this.
   */
  refusal?: {
    code: "POLICY_VIOLATION" | "NO_AVAILABILITY" | "MISSING_INFO";
    reason: string;
  };

  /**
   * The final text to show the user.
   * - If success: "I've drafted a booking for..."
   * - If needs info: "Which service would you like?"
   */
  replyToUser: string;
  
  /**
   * Suggested actions for the UI to render buttons/cards.
   */
  suggestedActions?: {
    type: "CONFIRM_BOOKING" | "VIEW_SERVICES" | "CONTACT_SUPPORT";
    payload?: any;
  }[];
}
