// tests/booking-engine.test.ts
// Unit tests for BookingEngine — prisma is fully mocked.
// Focus: lead-time validation, conflict detection, state transitions.

// ---------------------------------------------------------------------------
// Mock prisma and business-policy before importing BookingEngine
// ---------------------------------------------------------------------------
const mockTxBooking = { findFirst: jest.fn(), create: jest.fn() };
const mockTxAudit = { create: jest.fn() };

const mockPrismaBooking = { findUnique: jest.fn(), update: jest.fn() };
const mockPrismaService = { findUnique: jest.fn() };
const mockPrismaAudit = { create: jest.fn() };

const mockTransaction = jest.fn();

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    service: mockPrismaService,
    booking: mockPrismaBooking,
    auditLog: mockPrismaAudit,
    $transaction: mockTransaction,
  },
}));

jest.mock('../business-policy', () => ({
  getPolicy: jest.fn(),
}));

import { BookingEngine } from '../booking-engine';
import { getPolicy } from '../business-policy';
import { BookingStatus } from '@prisma/client';

const mockGetPolicy = getPolicy as jest.MockedFunction<typeof getPolicy>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const DEFAULT_POLICY = {
  cancellationWindowHours: 24,
  lateCancellationRefundPercent: 0,
  noShowFeePercent: 100,
  approvalMode: 'AUTO_CONFIRM' as const,
  minLeadTimeHours: 2,
  maxLeadTimeDays: 60,
  depositRequired: true,
  depositPercent: 50,
};

const MOCK_SERVICE = {
  id: 'svc-1',
  businessId: 'biz-1',
  name: 'Haircut',
  durationMin: 30,
  bufferMin: 15,
  price: 5000,
  isActive: true,
};

const MOCK_BOOKING = {
  id: 'booking-1',
  userId: 'user-1',
  businessId: 'biz-1',
  serviceId: 'svc-1',
  startTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
  endTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
  status: BookingStatus.CONFIRMED,
  price: 5000,
  paymentId: 'pi_test',
  paymentStatus: 'authorized',
  depositAmount: 2500,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

let engine: BookingEngine;

beforeEach(() => {
  jest.clearAllMocks();
  engine = new BookingEngine();

  // Default: service exists, policy is default
  mockPrismaService.findUnique.mockResolvedValue(MOCK_SERVICE);
  mockGetPolicy.mockResolvedValue(DEFAULT_POLICY);

  // Default transaction: no conflict, successful create
  mockTransaction.mockImplementation(async (cb: any) => {
    return cb({
      booking: mockTxBooking,
      auditLog: mockTxAudit,
    });
  });
  mockTxBooking.findFirst.mockResolvedValue(null); // no conflict
  mockTxBooking.create.mockResolvedValue({ ...MOCK_BOOKING, status: BookingStatus.PENDING_PAYMENT });
  mockTxAudit.create.mockResolvedValue({});
});

// ---------------------------------------------------------------------------
// createBooking — validation
// ---------------------------------------------------------------------------
describe('BookingEngine.createBooking', () => {
  it('rejects booking when service does not exist', async () => {
    mockPrismaService.findUnique.mockResolvedValue(null);
    await expect(
      engine.createBooking('user-1', 'biz-1', 'svc-1', new Date(Date.now() + 5 * 3600 * 1000))
    ).rejects.toThrow('SERVICE_NOT_FOUND');
  });

  it('rejects booking when service is inactive', async () => {
    mockPrismaService.findUnique.mockResolvedValue({ ...MOCK_SERVICE, isActive: false });
    await expect(
      engine.createBooking('user-1', 'biz-1', 'svc-1', new Date(Date.now() + 5 * 3600 * 1000))
    ).rejects.toThrow('SERVICE_INACTIVE');
  });

  it('rejects booking when service belongs to a different business', async () => {
    mockPrismaService.findUnique.mockResolvedValue({ ...MOCK_SERVICE, businessId: 'biz-other' });
    await expect(
      engine.createBooking('user-1', 'biz-1', 'svc-1', new Date(Date.now() + 5 * 3600 * 1000))
    ).rejects.toThrow('SERVICE_MISMATCH');
  });

  it('rejects booking when startTime violates minimum lead time', async () => {
    // Policy requires 2h lead time — book 30 min from now
    const startTime = new Date(Date.now() + 30 * 60 * 1000);
    await expect(
      engine.createBooking('user-1', 'biz-1', 'svc-1', startTime)
    ).rejects.toThrow('LEAD_TIME_VIOLATION');
  });

  it('rejects booking when startTime exceeds maximum advance limit', async () => {
    // Policy allows max 60 days — book 90 days from now
    const startTime = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    await expect(
      engine.createBooking('user-1', 'biz-1', 'svc-1', startTime)
    ).rejects.toThrow('ADVANCE_LIMIT_VIOLATION');
  });

  it('rejects booking when slot is already taken', async () => {
    // Transaction finds a conflicting booking
    mockTxBooking.findFirst.mockResolvedValue(MOCK_BOOKING);
    const startTime = new Date(Date.now() + 5 * 3600 * 1000);
    await expect(
      engine.createBooking('user-1', 'biz-1', 'svc-1', startTime)
    ).rejects.toThrow('SLOT_UNAVAILABLE');
  });

  it('creates a booking with PENDING_PAYMENT status and the correct price', async () => {
    const startTime = new Date(Date.now() + 5 * 3600 * 1000);
    const booking = await engine.createBooking('user-1', 'biz-1', 'svc-1', startTime);

    expect(mockTxBooking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: BookingStatus.PENDING_PAYMENT,
          price: 5000,
          userId: 'user-1',
          businessId: 'biz-1',
        }),
      })
    );
    expect(booking.status).toBe(BookingStatus.PENDING_PAYMENT);
  });
});

// ---------------------------------------------------------------------------
// cancelBooking — state validation
// ---------------------------------------------------------------------------
describe('BookingEngine.cancelBooking', () => {
  beforeEach(() => {
    mockPrismaBooking.findUnique.mockResolvedValue({ ...MOCK_BOOKING, status: BookingStatus.CONFIRMED });
    mockTransaction.mockImplementation(async (cb: any) => {
      return cb({ booking: mockPrismaBooking, auditLog: mockPrismaAudit });
    });
    mockPrismaBooking.update.mockResolvedValue({
      ...MOCK_BOOKING,
      status: BookingStatus.CANCELLED_BY_USER,
    });
    mockPrismaAudit.create.mockResolvedValue({});
  });

  it('cancels a CONFIRMED booking successfully', async () => {
    const result = await engine.cancelBooking('booking-1', 'Changed mind', 'user-1', false);
    expect(result.status).toBe(BookingStatus.CANCELLED_BY_USER);
  });

  it('throws when trying to cancel a COMPLETED booking', async () => {
    mockPrismaBooking.findUnique.mockResolvedValue({
      ...MOCK_BOOKING,
      status: BookingStatus.COMPLETED,
    });
    await expect(
      engine.cancelBooking('booking-1', 'Changed mind', 'user-1', false)
    ).rejects.toThrow('INVALID_STATE');
  });

  it('throws when trying to cancel a NO_SHOW booking', async () => {
    mockPrismaBooking.findUnique.mockResolvedValue({
      ...MOCK_BOOKING,
      status: BookingStatus.NO_SHOW,
    });
    await expect(
      engine.cancelBooking('booking-1', 'Changed mind', 'user-1', false)
    ).rejects.toThrow('INVALID_STATE');
  });
});

// ---------------------------------------------------------------------------
// completeBooking — state validation
// ---------------------------------------------------------------------------
describe('BookingEngine.completeBooking', () => {
  beforeEach(() => {
    mockTransaction.mockImplementation(async (cb: any) => {
      return cb({ booking: mockPrismaBooking, auditLog: mockPrismaAudit });
    });
    mockPrismaBooking.update.mockResolvedValue({
      ...MOCK_BOOKING,
      status: BookingStatus.COMPLETED,
    });
    mockPrismaAudit.create.mockResolvedValue({});
  });

  it('completes a CONFIRMED booking', async () => {
    mockPrismaBooking.findUnique.mockResolvedValue({
      ...MOCK_BOOKING,
      status: BookingStatus.CONFIRMED,
    });
    const result = await engine.completeBooking('booking-1', 'owner-1');
    expect(result.status).toBe(BookingStatus.COMPLETED);
  });

  it('throws when trying to complete a PENDING booking', async () => {
    mockPrismaBooking.findUnique.mockResolvedValue({
      ...MOCK_BOOKING,
      status: BookingStatus.PENDING,
    });
    await expect(engine.completeBooking('booking-1', 'owner-1')).rejects.toThrow('INVALID_STATE');
  });
});

// ---------------------------------------------------------------------------
// markNoShow — time gate
// ---------------------------------------------------------------------------
describe('BookingEngine.markNoShow', () => {
  it('throws when the booking has not ended yet', async () => {
    mockPrismaBooking.findUnique.mockResolvedValue({
      ...MOCK_BOOKING,
      status: BookingStatus.CONFIRMED,
      // endTime is in the future (default mock booking)
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    });
    await expect(engine.markNoShow('booking-1', 'owner-1')).rejects.toThrow('CANNOT_MARK_NOSHOW');
  });

  it('marks as NO_SHOW when the booking end time has passed', async () => {
    mockPrismaBooking.findUnique.mockResolvedValue({
      ...MOCK_BOOKING,
      status: BookingStatus.CONFIRMED,
      endTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    });

    mockTransaction.mockImplementation(async (cb: any) => {
      return cb({ booking: mockPrismaBooking, auditLog: mockPrismaAudit });
    });
    mockPrismaBooking.update.mockResolvedValue({
      ...MOCK_BOOKING,
      status: BookingStatus.NO_SHOW,
    });
    mockPrismaAudit.create.mockResolvedValue({});

    const result = await engine.markNoShow('booking-1', 'owner-1');
    expect(result.status).toBe(BookingStatus.NO_SHOW);
  });
});
