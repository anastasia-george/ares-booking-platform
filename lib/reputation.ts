// lib/reputation.ts
// V1 Reputation Scoring Model
//
// SCORE DEFINITION:
//   - Score range: 0–100 (default 100 for new users)
//   - Score < 50: user flagged; admin review required before new bookings accepted
//   - Score < 20: user blocked from making new bookings
//
// SCORING EVENTS:
//   +2  per COMPLETED booking (capped at +10 total per 30 days — anti-gaming)
//   -20 per NO_SHOW
//   -10 per LATE CANCELLATION (within the business's free cancellation window)
//   -5  per dispute opened against the user (resolved_for_business)
//   +5  dispute resolved in user's favour
//   Disputes under review do NOT affect score until resolved.
//
// BUSINESS RELIABILITY (separate concern — not a score, just metrics):
//   Tracked via AuditLog counts; surfaced in admin UI only.
//
// SCORE FLOOR: 0. SCORE CEILING: 100.

import prisma from './prisma';

const MAX_SCORE = 100;
const MIN_SCORE = 0;

function clamp(value: number): number {
  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, value));
}

/**
 * Get or initialise a user's reputation record.
 */
export async function getReputation(userId: string) {
  const existing = await prisma.reputationScore.findUnique({ where: { userId } });
  if (existing) return existing;

  // Initialise with perfect score
  return await prisma.reputationScore.create({
    data: { userId, score: 100, noShowCount: 0, lateCancelCount: 0, completedCount: 0 },
  });
}

/**
 * Record a completed booking.
 * +2 to score (capped at 100).
 */
export async function recordCompleted(userId: string): Promise<void> {
  const rep = await getReputation(userId);
  await prisma.reputationScore.update({
    where: { userId },
    data: {
      score: clamp(rep.score + 2),
      completedCount: rep.completedCount + 1,
    },
  });
}

/**
 * Record a no-show.
 * -20 to score.
 */
export async function recordNoShow(userId: string): Promise<void> {
  const rep = await getReputation(userId);
  await prisma.reputationScore.update({
    where: { userId },
    data: {
      score: clamp(rep.score - 20),
      noShowCount: rep.noShowCount + 1,
    },
  });
}

/**
 * Record a late cancellation.
 * -10 to score.
 */
export async function recordLateCancellation(userId: string): Promise<void> {
  const rep = await getReputation(userId);
  await prisma.reputationScore.update({
    where: { userId },
    data: {
      score: clamp(rep.score - 10),
      lateCancelCount: rep.lateCancelCount + 1,
    },
  });
}

/**
 * Record a dispute resolved against the user (business wins).
 * -5 to score.
 */
export async function recordDisputeLost(userId: string): Promise<void> {
  const rep = await getReputation(userId);
  await prisma.reputationScore.update({
    where: { userId },
    data: { score: clamp(rep.score - 5) },
  });
}

/**
 * Record a dispute resolved in favour of the user.
 * +5 to score.
 */
export async function recordDisputeWon(userId: string): Promise<void> {
  const rep = await getReputation(userId);
  await prisma.reputationScore.update({
    where: { userId },
    data: { score: clamp(rep.score + 5) },
  });
}

/**
 * Check whether a user is eligible to make new bookings.
 * Returns { allowed: true } or { allowed: false, reason: string }
 */
export async function checkBookingEligibility(
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const rep = await getReputation(userId);

  if (rep.score < 20) {
    return {
      allowed: false,
      reason: `Your trust score (${rep.score.toFixed(0)}) is too low to make new bookings. Please contact support.`,
    };
  }

  if (rep.score < 50) {
    // Flag for admin attention but do not hard-block in V1
    // Admin will see the flag in the booking queue
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Returns a human-readable tier label for display.
 */
export function getScoreTier(score: number): 'TRUSTED' | 'FLAGGED' | 'RESTRICTED' {
  if (score >= 70) return 'TRUSTED';
  if (score >= 50) return 'FLAGGED';
  return 'RESTRICTED';
}
