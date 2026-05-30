import crypto from "crypto";
import { db } from "@/lib/db";
import { logOtp } from "@/lib/logger";

// ── Security constants ────────────────────────────────────────────────────────

export const OTP_DIGITS = 6;
export const OTP_TTL_MINUTES = 10;
const OTP_TTL_MS = OTP_TTL_MINUTES * 60 * 1000;

/** Rate-limit thresholds (DB-backed, no external cache required). */
export const RATE = {
  /** Minimum seconds between OTP requests for the same email address. */
  cooldownSeconds: 60,
  /** Maximum OTP requests per email address in a rolling one-hour window. */
  maxPerHour: 5,
} as const;

/** Invalidate the active OTP after this many consecutive wrong-code attempts. */
export const MAX_FAILED_ATTEMPTS = 5;

// ── Public result types ───────────────────────────────────────────────────────

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; waitSeconds: number };

export type OtpValidationResult =
  | { ok: true; tokenId: string }
  | { ok: false; reason: "not_found" | "expired" | "max_attempts" }
  | { ok: false; reason: "wrong_code"; attemptsLeft: number };

// ── Core functions ────────────────────────────────────────────────────────────

export function generateOtp(): string {
  return crypto.randomInt(0, 10 ** OTP_DIGITS).toString().padStart(OTP_DIGITS, "0");
}

/**
 * Check whether the email address is within its OTP request rate limit.
 * - Rejects if a token was created within the last RATE.cooldownSeconds.
 * - Rejects if ≥ RATE.maxPerHour tokens were issued in the last 60 minutes.
 */
export async function checkEmailRateLimit(email: string): Promise<RateLimitResult> {
  // 1. Per-request cooldown.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const latest = await (db as any).otpToken.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (latest) {
    const elapsedSeconds =
      (Date.now() - new Date(latest.createdAt as Date).getTime()) / 1000;
    if (elapsedSeconds < RATE.cooldownSeconds) {
      return {
        allowed: false,
        waitSeconds: Math.ceil(RATE.cooldownSeconds - elapsedSeconds),
      };
    }
  }

  // 2. Rolling hourly window.
  const windowStart = new Date(Date.now() - 60 * 60 * 1000);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const count = await (db as any).otpToken.count({
    where: { email, createdAt: { gte: windowStart } },
  });

  if (count >= RATE.maxPerHour) {
    // Tell the user exactly when the oldest token in the window expires out.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oldest = await (db as any).otpToken.findFirst({
      where: { email, createdAt: { gte: windowStart } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    const waitSeconds = oldest
      ? Math.ceil(
          (new Date(oldest.createdAt as Date).getTime() + 60 * 60 * 1000 - Date.now()) / 1000,
        )
      : 60 * 60;
    return { allowed: false, waitSeconds: Math.max(waitSeconds, 60) };
  }

  return { allowed: true };
}

/** Invalidate all unused OTPs for the address, then persist the new code. */
export async function storeOtp(email: string, code: string): Promise<void> {
  const now = new Date();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any).otpToken.updateMany({
    where: { email, usedAt: null },
    data: { usedAt: now },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any).otpToken.create({
    data: { email, code, expiresAt: new Date(now.getTime() + OTP_TTL_MS) },
  });
}

/**
 * Validate an OTP without consuming it.
 *
 * - Returns `{ ok: true, tokenId }` when the code is correct and the token is
 *   valid.
 * - Returns `{ ok: false, reason }` for every failure case.
 * - Increments `failedAttempts` on a wrong code, and invalidates (marks used)
 *   the token once MAX_FAILED_ATTEMPTS is reached.
 */
export async function validateOtp(
  email: string,
  code: string,
): Promise<OtpValidationResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const record = await (db as any).otpToken.findFirst({
    where: { email, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return { ok: false, reason: "not_found" };
  }

  if (new Date(record.expiresAt as Date) <= new Date()) {
    logOtp("otp.expired", email);
    return { ok: false, reason: "expired" };
  }

  if ((record.failedAttempts as number) >= MAX_FAILED_ATTEMPTS) {
    logOtp("otp.max_attempts", email);
    return { ok: false, reason: "max_attempts" };
  }

  if ((record.code as string) !== code) {
    const next = (record.failedAttempts as number) + 1;
    const invalidate = next >= MAX_FAILED_ATTEMPTS;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).otpToken.update({
      where: { id: record.id },
      data: invalidate
        ? { failedAttempts: next, usedAt: new Date() }
        : { failedAttempts: next },
    });

    if (invalidate) {
      logOtp("otp.max_attempts", email, { attemptsUsed: next });
      return { ok: false, reason: "max_attempts" };
    }

    const attemptsLeft = MAX_FAILED_ATTEMPTS - next;
    logOtp("otp.invalid", email, { attemptsUsed: next, attemptsLeft });
    return { ok: false, reason: "wrong_code", attemptsLeft };
  }

  logOtp("otp.check_passed", email);
  return { ok: true, tokenId: record.id as string };
}

/**
 * Final consumption gate — called by NextAuth's `authorize` callback.
 *
 * Re-validates the matching token (safety net for the short TOCTOU window
 * between `validateOtp` in the server action and `authorize` running) and
 * marks it consumed.  Returns true on success, false otherwise.
 */
export async function verifyAndConsumeOtp(email: string, code: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const record = await (db as any).otpToken.findFirst({
    where: { email, code, usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (!record) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any).otpToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });
  logOtp("otp.verified", email);
  return true;
}
