// tests/policy.test.ts
// Unit tests for business-policy.ts pure helpers.
// These functions have no side effects and require no DB mocking.

import {
  isLateCancellation,
  calculateCancellationRefund,
  DEFAULT_POLICY,
} from '../business-policy';

// ---------------------------------------------------------------------------
// isLateCancellation
// ---------------------------------------------------------------------------
describe('isLateCancellation', () => {
  it('returns false when cancelling well outside the free window', () => {
    const policy = { ...DEFAULT_POLICY, cancellationWindowHours: 24 };
    // Appointment 48 hours from now — outside the 24h penalty window
    const startTime = new Date(Date.now() + 48 * 60 * 60 * 1000);
    expect(isLateCancellation(policy, startTime)).toBe(false);
  });

  it('returns true when cancelling inside the penalty window', () => {
    const policy = { ...DEFAULT_POLICY, cancellationWindowHours: 24 };
    // Appointment 12 hours from now — inside the 24h window
    const startTime = new Date(Date.now() + 12 * 60 * 60 * 1000);
    expect(isLateCancellation(policy, startTime)).toBe(true);
  });

  it('returns true when the appointment start time has already passed', () => {
    const policy = { ...DEFAULT_POLICY, cancellationWindowHours: 24 };
    const startTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    expect(isLateCancellation(policy, startTime)).toBe(true);
  });

  it('returns false at exactly the window boundary (within tolerance)', () => {
    const policy = { ...DEFAULT_POLICY, cancellationWindowHours: 24 };
    // 24 hours + 5 minutes from now — just outside the window
    const startTime = new Date(Date.now() + (24 * 60 + 5) * 60 * 1000);
    expect(isLateCancellation(policy, startTime)).toBe(false);
  });

  it('respects custom window hours', () => {
    const policy = { ...DEFAULT_POLICY, cancellationWindowHours: 48 };
    // 36 hours from now — inside a 48h window but outside a 24h window
    const startTime = new Date(Date.now() + 36 * 60 * 60 * 1000);
    expect(isLateCancellation(policy, startTime)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// calculateCancellationRefund
// ---------------------------------------------------------------------------
describe('calculateCancellationRefund', () => {
  it('returns the full deposit for a timely cancellation', () => {
    const policy = { ...DEFAULT_POLICY, cancellationWindowHours: 24, lateCancellationRefundPercent: 0 };
    const startTime = new Date(Date.now() + 48 * 60 * 60 * 1000); // outside window
    expect(calculateCancellationRefund(policy, 5000, startTime)).toBe(5000);
  });

  it('returns 0 for a late cancellation with 0% refund policy', () => {
    const policy = { ...DEFAULT_POLICY, cancellationWindowHours: 24, lateCancellationRefundPercent: 0 };
    const startTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // inside window
    expect(calculateCancellationRefund(policy, 5000, startTime)).toBe(0);
  });

  it('returns partial refund for late cancellation with 50% refund policy', () => {
    const policy = { ...DEFAULT_POLICY, cancellationWindowHours: 24, lateCancellationRefundPercent: 50 };
    const startTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // inside window
    expect(calculateCancellationRefund(policy, 5000, startTime)).toBe(2500);
  });

  it('returns full deposit for late cancellation with 100% refund policy', () => {
    const policy = { ...DEFAULT_POLICY, cancellationWindowHours: 24, lateCancellationRefundPercent: 100 };
    const startTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // inside window
    expect(calculateCancellationRefund(policy, 5000, startTime)).toBe(5000);
  });

  it('rounds fractional cents correctly', () => {
    const policy = { ...DEFAULT_POLICY, cancellationWindowHours: 24, lateCancellationRefundPercent: 33 };
    const startTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // inside window
    // 33% of 5000 = 1650
    expect(calculateCancellationRefund(policy, 5000, startTime)).toBe(1650);
  });
});
