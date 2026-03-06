// tests/reputation.test.ts
// Unit tests for lib/reputation.ts — prisma is fully mocked.

// ---------------------------------------------------------------------------
// Mock prisma before importing the module under test
// ---------------------------------------------------------------------------
const mockReputationScore = {
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    reputationScore: mockReputationScore,
  },
}));

import {
  recordCompleted,
  recordNoShow,
  recordLateCancellation,
  recordDisputeLost,
  recordDisputeWon,
  checkBookingEligibility,
  getScoreTier,
} from '../lib/reputation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function mockRep(score: number) {
  const rep = {
    id: 'rep-1',
    userId: 'user-1',
    score,
    noShowCount: 0,
    lateCancelCount: 0,
    completedCount: 0,
    updatedAt: new Date(),
  };
  mockReputationScore.findUnique.mockResolvedValue(rep);
  mockReputationScore.update.mockResolvedValue({ ...rep, score });
  return rep;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getScoreTier (pure — no DB)
// ---------------------------------------------------------------------------
describe('getScoreTier', () => {
  it('returns TRUSTED for score >= 70', () => {
    expect(getScoreTier(100)).toBe('TRUSTED');
    expect(getScoreTier(70)).toBe('TRUSTED');
  });

  it('returns FLAGGED for score 50–69', () => {
    expect(getScoreTier(69)).toBe('FLAGGED');
    expect(getScoreTier(50)).toBe('FLAGGED');
  });

  it('returns RESTRICTED for score < 50', () => {
    expect(getScoreTier(49)).toBe('RESTRICTED');
    expect(getScoreTier(0)).toBe('RESTRICTED');
  });
});

// ---------------------------------------------------------------------------
// recordCompleted
// ---------------------------------------------------------------------------
describe('recordCompleted', () => {
  it('increases score by 2', async () => {
    mockRep(80);
    await recordCompleted('user-1');

    expect(mockReputationScore.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        data: expect.objectContaining({ score: 82 }),
      })
    );
  });

  it('does not exceed 100', async () => {
    mockRep(99);
    await recordCompleted('user-1');

    expect(mockReputationScore.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ score: 100 }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// recordNoShow
// ---------------------------------------------------------------------------
describe('recordNoShow', () => {
  it('decreases score by 20', async () => {
    mockRep(80);
    await recordNoShow('user-1');

    expect(mockReputationScore.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ score: 60 }),
      })
    );
  });

  it('does not go below 0', async () => {
    mockRep(10);
    await recordNoShow('user-1');

    expect(mockReputationScore.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ score: 0 }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// recordLateCancellation
// ---------------------------------------------------------------------------
describe('recordLateCancellation', () => {
  it('decreases score by 10', async () => {
    mockRep(80);
    await recordLateCancellation('user-1');

    expect(mockReputationScore.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ score: 70 }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// recordDisputeLost / recordDisputeWon
// ---------------------------------------------------------------------------
describe('recordDisputeLost', () => {
  it('decreases score by 5', async () => {
    mockRep(80);
    await recordDisputeLost('user-1');
    expect(mockReputationScore.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ score: 75 }),
      })
    );
  });
});

describe('recordDisputeWon', () => {
  it('increases score by 5', async () => {
    mockRep(80);
    await recordDisputeWon('user-1');
    expect(mockReputationScore.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ score: 85 }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// checkBookingEligibility
// ---------------------------------------------------------------------------
describe('checkBookingEligibility', () => {
  it('blocks users with score < 20', async () => {
    mockRep(15);
    const result = await checkBookingEligibility('user-1');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('15');
  });

  it('allows users with score between 20 and 49 (flagged but not blocked)', async () => {
    mockRep(35);
    const result = await checkBookingEligibility('user-1');
    expect(result.allowed).toBe(true);
  });

  it('allows users with score >= 50', async () => {
    mockRep(75);
    const result = await checkBookingEligibility('user-1');
    expect(result.allowed).toBe(true);
  });

  it('initialises a new reputation record if one does not exist', async () => {
    mockReputationScore.findUnique.mockResolvedValue(null);
    mockReputationScore.create.mockResolvedValue({
      id: 'rep-new',
      userId: 'user-new',
      score: 100,
      noShowCount: 0,
      lateCancelCount: 0,
      completedCount: 0,
      updatedAt: new Date(),
    });

    const result = await checkBookingEligibility('user-new');
    expect(mockReputationScore.create).toHaveBeenCalled();
    expect(result.allowed).toBe(true);
  });
});
