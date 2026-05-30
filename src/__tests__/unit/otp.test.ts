import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateOtp, MAX_FAILED_ATTEMPTS, OTP_DIGITS, RATE } from "@/lib/otp";
import { fmtWait } from "@/lib/fmt";

// ── generateOtp ───────────────────────────────────────────────────────────────

describe("generateOtp", () => {
  it(`always produces a ${OTP_DIGITS}-digit string`, () => {
    for (let i = 0; i < 50; i++) {
      const otp = generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
    }
  });

  it("always produces a zero-padded 6-character string", () => {
    // Run a large sample to catch any value that might be produced without
    // padding (e.g. if the implementation returned a raw number < 100000).
    for (let i = 0; i < 500; i++) {
      const otp = generateOtp();
      expect(otp.length).toBe(6);
      expect(otp).toMatch(/^[0-9]{6}$/);
    }
  });

  it("produces values in the range 000000–999999", () => {
    const otps = Array.from({ length: 200 }, () => Number(generateOtp()));
    expect(otps.every((n) => n >= 0 && n <= 999999)).toBe(true);
  });
});

// ── fmtWait ───────────────────────────────────────────────────────────────────

describe("fmtWait", () => {
  it("formats seconds for values ≤ 60", () => {
    expect(fmtWait(1)).toBe("1 second");
    expect(fmtWait(30)).toBe("30 seconds");
    expect(fmtWait(60)).toBe("60 seconds");
  });

  it("formats minutes for values > 60", () => {
    expect(fmtWait(61)).toBe("2 minutes");
    expect(fmtWait(120)).toBe("2 minutes");
    expect(fmtWait(3600)).toBe("60 minutes");
  });

  it("uses singular for exactly 1 second / 1 minute", () => {
    expect(fmtWait(1)).toBe("1 second");
    expect(fmtWait(60)).toBe("60 seconds"); // 60 <= 60 → seconds path
  });
});

// ── Security constants ────────────────────────────────────────────────────────

describe("security constants", () => {
  it("OTP_DIGITS is 6", () => expect(OTP_DIGITS).toBe(6));

  it("RATE.cooldownSeconds is at least 30", () =>
    expect(RATE.cooldownSeconds).toBeGreaterThanOrEqual(30));

  it("MAX_FAILED_ATTEMPTS is between 3 and 10", () => {
    expect(MAX_FAILED_ATTEMPTS).toBeGreaterThanOrEqual(3);
    expect(MAX_FAILED_ATTEMPTS).toBeLessThanOrEqual(10);
  });
});

// ── validateOtp — unit tests with mocked DB ───────────────────────────────────
// We mock @/lib/db so these tests run without a real database.

vi.mock("@/lib/db", () => ({
  db: {},
}));

vi.mock("@/lib/logger", () => ({
  logOtp: vi.fn(),
}));

// Helper to build a fake OtpToken record.
function makeRecord(overrides: Partial<{
  id: string;
  email: string;
  code: string;
  expiresAt: Date;
  usedAt: Date | null;
  failedAttempts: number;
}> = {}) {
  return {
    id: "token-1",
    email: "test@eagleeyedigital.io",
    code: "123456",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min from now
    usedAt: null,
    failedAttempts: 0,
    ...overrides,
  };
}

describe("validateOtp", () => {
  let validateOtp: typeof import("@/lib/otp").validateOtp;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;

  beforeEach(async () => {
    vi.resetModules();
    // Re-import after reset so module-level db reference is refreshed.
    const dbModule = await import("@/lib/db");
    mockDb = dbModule.db as unknown as Record<string, unknown>;
    mockDb.otpToken = {
      findFirst: vi.fn(),
      update: vi.fn(),
    };
    const otpModule = await import("@/lib/otp");
    validateOtp = otpModule.validateOtp;
  });

  it("returns not_found when no active token exists", async () => {
    mockDb.otpToken.findFirst.mockResolvedValue(null);
    const result = await validateOtp("user@eagleeyedigital.io", "123456");
    expect(result).toEqual({ ok: false, reason: "not_found" });
  });

  it("returns expired when the token's expiresAt is in the past", async () => {
    mockDb.otpToken.findFirst.mockResolvedValue(
      makeRecord({ expiresAt: new Date(Date.now() - 1000) }),
    );
    const result = await validateOtp("user@eagleeyedigital.io", "123456");
    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("returns max_attempts when failedAttempts already equals the limit", async () => {
    mockDb.otpToken.findFirst.mockResolvedValue(
      makeRecord({ failedAttempts: MAX_FAILED_ATTEMPTS }),
    );
    const result = await validateOtp("user@eagleeyedigital.io", "999999");
    expect(result).toEqual({ ok: false, reason: "max_attempts" });
  });

  it("returns wrong_code and attemptsLeft on a wrong code", async () => {
    mockDb.otpToken.findFirst.mockResolvedValue(makeRecord({ failedAttempts: 0 }));
    mockDb.otpToken.update.mockResolvedValue({});
    const result = await validateOtp("user@eagleeyedigital.io", "000000");
    expect(result).toEqual({
      ok: false,
      reason: "wrong_code",
      attemptsLeft: MAX_FAILED_ATTEMPTS - 1,
    });
  });

  it("invalidates token and returns max_attempts on the final wrong attempt", async () => {
    mockDb.otpToken.findFirst.mockResolvedValue(
      makeRecord({ failedAttempts: MAX_FAILED_ATTEMPTS - 1 }),
    );
    mockDb.otpToken.update.mockResolvedValue({});
    const result = await validateOtp("user@eagleeyedigital.io", "000000");
    expect(result).toEqual({ ok: false, reason: "max_attempts" });
    // usedAt must be set to invalidate the token.
    expect(mockDb.otpToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ usedAt: expect.any(Date) }),
      }),
    );
  });

  it("returns ok with tokenId when code is correct", async () => {
    mockDb.otpToken.findFirst.mockResolvedValue(makeRecord({ code: "654321" }));
    const result = await validateOtp("user@eagleeyedigital.io", "654321");
    expect(result).toEqual({ ok: true, tokenId: "token-1" });
  });

  it("does not call update on a correct code", async () => {
    mockDb.otpToken.findFirst.mockResolvedValue(makeRecord({ code: "654321" }));
    mockDb.otpToken.update.mockResolvedValue({});
    await validateOtp("user@eagleeyedigital.io", "654321");
    expect(mockDb.otpToken.update).not.toHaveBeenCalled();
  });
});

// ── checkEmailRateLimit — unit tests ─────────────────────────────────────────

describe("checkEmailRateLimit", () => {
  let checkEmailRateLimit: typeof import("@/lib/otp").checkEmailRateLimit;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;

  beforeEach(async () => {
    vi.resetModules();
    const dbModule = await import("@/lib/db");
    mockDb = dbModule.db as unknown as Record<string, unknown>;
    mockDb.otpToken = {
      findFirst: vi.fn(),
      count: vi.fn(),
    };
    const otpModule = await import("@/lib/otp");
    checkEmailRateLimit = otpModule.checkEmailRateLimit;
  });

  it("allows a request when no previous tokens exist", async () => {
    mockDb.otpToken.findFirst.mockResolvedValue(null);
    mockDb.otpToken.count.mockResolvedValue(0);
    const result = await checkEmailRateLimit("user@eagleeyedigital.io");
    expect(result).toEqual({ allowed: true });
  });

  it("blocks a request within the cooldown window", async () => {
    mockDb.otpToken.findFirst.mockResolvedValue({
      createdAt: new Date(Date.now() - 10_000), // 10 seconds ago
    });
    const result = await checkEmailRateLimit("user@eagleeyedigital.io");
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.waitSeconds).toBeGreaterThan(0);
      expect(result.waitSeconds).toBeLessThanOrEqual(RATE.cooldownSeconds);
    }
  });

  it("blocks when the hourly limit is reached", async () => {
    // Most recent token is outside the cooldown window.
    mockDb.otpToken.findFirst
      .mockResolvedValueOnce({
        createdAt: new Date(Date.now() - (RATE.cooldownSeconds + 1) * 1000),
      })
      // Second call (oldest in window for wait time calculation).
      .mockResolvedValueOnce({
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
      });
    mockDb.otpToken.count.mockResolvedValue(RATE.maxPerHour);
    const result = await checkEmailRateLimit("user@eagleeyedigital.io");
    expect(result.allowed).toBe(false);
  });

  it("allows a request once cooldown has passed", async () => {
    mockDb.otpToken.findFirst.mockResolvedValue({
      createdAt: new Date(Date.now() - (RATE.cooldownSeconds + 5) * 1000),
    });
    mockDb.otpToken.count.mockResolvedValue(0);
    const result = await checkEmailRateLimit("user@eagleeyedigital.io");
    expect(result).toEqual({ allowed: true });
  });
});
