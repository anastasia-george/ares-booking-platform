// business-policy.ts
import prisma from './lib/prisma';

export enum ApprovalMode {
  MANUAL = 'MANUAL',
  AUTO_CONFIRM = 'AUTO_CONFIRM',
}

/**
 * Canonical policy shape used throughout the codebase.
 * Matches the BusinessPolicy Prisma model fields.
 */
export interface BusinessPolicy {
  /** Hours before the appointment a customer can cancel for free */
  cancellationWindowHours: number;
  /** % of deposit refunded on late cancellation (0 = no refund) */
  lateCancellationRefundPercent: number;
  /** % of deposit charged when customer no-shows (100 = full deposit kept) */
  noShowFeePercent: number;
  /** AUTO_CONFIRM: booking confirmed immediately on payment.
   *  MANUAL: business must manually approve each booking. */
  approvalMode: ApprovalMode;
  /** Minimum hours in advance a booking must be made */
  minLeadTimeHours: number;
  /** Maximum days in advance a booking can be made */
  maxLeadTimeDays: number;
  /** Whether a deposit is required to hold the slot */
  depositRequired: boolean;
  /** % of full price charged as deposit */
  depositPercent: number;
}

/** Safe defaults applied to any business that has no saved policy */
export const DEFAULT_POLICY: BusinessPolicy = {
  cancellationWindowHours: 24,
  lateCancellationRefundPercent: 0,
  noShowFeePercent: 100,
  approvalMode: ApprovalMode.AUTO_CONFIRM,
  minLeadTimeHours: 2,
  maxLeadTimeDays: 60,
  depositRequired: true,
  depositPercent: 50,
};

/**
 * Fetch the persisted policy for a business.
 * Falls back to DEFAULT_POLICY if none has been saved.
 */
export async function getPolicy(businessId: string): Promise<BusinessPolicy> {
  const row = await prisma.businessPolicy.findUnique({ where: { businessId } });
  if (!row) return { ...DEFAULT_POLICY };
  return {
    cancellationWindowHours: row.cancellationWindowHours,
    lateCancellationRefundPercent: row.lateCancellationRefundPct,
    noShowFeePercent: row.noShowFeePercent,
    approvalMode: row.approvalMode as ApprovalMode,
    minLeadTimeHours: row.minLeadTimeHours,
    maxLeadTimeDays: row.maxLeadTimeDays,
    depositRequired: row.depositRequired,
    depositPercent: row.depositPercent,
  };
}

/**
 * Save (create or update) the policy for a business.
 */
export async function upsertPolicy(
  businessId: string,
  policy: Partial<BusinessPolicy>
): Promise<BusinessPolicy> {
  const current = await getPolicy(businessId);
  const merged = { ...current, ...policy };

  await prisma.businessPolicy.upsert({
    where: { businessId },
    create: {
      businessId,
      cancellationWindowHours: merged.cancellationWindowHours,
      lateCancellationRefundPct: merged.lateCancellationRefundPercent,
      noShowFeePercent: merged.noShowFeePercent,
      approvalMode: merged.approvalMode,
      minLeadTimeHours: merged.minLeadTimeHours,
      maxLeadTimeDays: merged.maxLeadTimeDays,
      depositRequired: merged.depositRequired,
      depositPercent: merged.depositPercent,
    },
    update: {
      cancellationWindowHours: merged.cancellationWindowHours,
      lateCancellationRefundPct: merged.lateCancellationRefundPercent,
      noShowFeePercent: merged.noShowFeePercent,
      approvalMode: merged.approvalMode,
      minLeadTimeHours: merged.minLeadTimeHours,
      maxLeadTimeDays: merged.maxLeadTimeDays,
      depositRequired: merged.depositRequired,
      depositPercent: merged.depositPercent,
    },
  });

  return merged;
}

/**
 * Pure helper: given a policy and booking startTime, determine whether
 * a cancellation is "late" (i.e. inside the free cancellation window).
 * Returns true if the cancel is within the penalty window.
 */
export function isLateCancellation(policy: BusinessPolicy, bookingStartTime: Date): boolean {
  const hoursUntilStart = (bookingStartTime.getTime() - Date.now()) / (1000 * 60 * 60);
  return hoursUntilStart < policy.cancellationWindowHours;
}

/**
 * Calculate refund amount in cents for a given cancellation.
 * Returns 0 if late and no refund policy, otherwise returns partial/full deposit.
 */
export function calculateCancellationRefund(
  policy: BusinessPolicy,
  depositAmountCents: number,
  bookingStartTime: Date
): number {
  const late = isLateCancellation(policy, bookingStartTime);
  if (!late) return depositAmountCents; // Full refund for timely cancel
  // Late: apply refund percent
  return Math.round(depositAmountCents * (policy.lateCancellationRefundPercent / 100));
}
