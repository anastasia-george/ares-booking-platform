// business-policy.ts

export enum ApprovalMode {
  MANUAL = "MANUAL",
  AUTO_CONFIRM = "AUTO_CONFIRM"
}

export interface BusinessPolicy {
  // 1. CANCELLATION RULES
  // How many hours before the appt can a user cancel without penalty?
  cancellationWindowHours: number; // e.g. 24
  
  // Refund policy for late cancellations (e.g., 0% refund, 50% refund)
  lateCancellationRefundPercent: number; // e.g. 0

  // 2. NO-SHOW RULES
  // Fee for no-show (flat fee or %)
  noShowFeePercent: number; // e.g. 100

  // 3. BOOKING RULES
  // Does the business manually approve every request?
  approvalMode: ApprovalMode; // MANUAL or AUTO_CONFIRM

  // Minimum lead time (e.g., can't book 1 hour before, must be 24h)
  minLeadTimeHours: number; // e.g. 24

  // Maximum lead time (e.g., can't book 6 months in advance)
  maxLeadTimeDays: number; // e.g. 90

  // 4. DEPOSIT RULES
  // Is a deposit required?
  depositRequired: boolean;
  depositPercent: number; // e.g. 50
}

/**
 * DEFAULT POLICY
 * A safe default for new businesses.
 */
export const DEFAULT_POLICY: BusinessPolicy = {
  cancellationWindowHours: 24,
  lateCancellationRefundPercent: 0,
  noShowFeePercent: 100,
  approvalMode: ApprovalMode.AUTO_CONFIRM,
  minLeadTimeHours: 2,
  maxLeadTimeDays: 60,
  depositRequired: true,
  depositPercent: 50
};
