"use server";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  generateOtp,
  storeOtp,
  validateOtp,
  checkEmailRateLimit,
} from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { logOtp } from "@/lib/logger";
import { fmtWait } from "@/lib/fmt";
import { ROUTES } from "@/constants/routes";

const COMPANY_DOMAIN = "eagleeyedigital.io";

// ── Step 1 — Request OTP ──────────────────────────────────────────────────────

export type RequestOtpState = {
  step: "email" | "otp";
  email?: string;
  error?: string;
  /** Dev mode only: visible in the UI when SMTP is not configured.
   *  Guaranteed undefined when NODE_ENV === "production". */
  devOtp?: string;
  /** True when this was a resend (the OTP screen was already showing). */
  resent?: boolean;
  /** Seconds until the next OTP request is allowed (rate-limited response). */
  rateLimitWaitSeconds?: number;
};

export async function requestOtpAction(
  _prev: RequestOtpState,
  formData: FormData,
): Promise<RequestOtpState> {
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();

  if (!email) return { step: "email", error: "Email is required." };

  if (!email.endsWith(`@${COMPANY_DOMAIN}`)) {
    return {
      step: "email",
      error: "Only @eagleeyedigital.io email addresses are allowed.",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = await (db as any).user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return {
      step: "email",
      error:
        "This email is not registered in WinOS. Contact your manager to get access.",
    };
  }

  // Rate limit check — per-email cooldown + rolling hourly window.
  const rateLimit = await checkEmailRateLimit(email);
  if (!rateLimit.allowed) {
    logOtp("otp.rate_limited", email, { waitSeconds: rateLimit.waitSeconds });
    // If already on the OTP screen (resend attempt), keep the user there.
    const isAlreadyOnOtpStep = _prev.step === "otp" && _prev.email === email;
    return {
      step: isAlreadyOnOtpStep ? "otp" : "email",
      email: isAlreadyOnOtpStep ? email : undefined,
      error: `Please wait ${fmtWait(rateLimit.waitSeconds)} before requesting a new code.`,
      rateLimitWaitSeconds: rateLimit.waitSeconds,
    };
  }

  const otp = generateOtp();
  await storeOtp(email, otp);
  logOtp("otp.requested", email);

  try {
    await sendOtpEmail(email, otp);
    logOtp("otp.sent", email);
  } catch (err) {
    logOtp("otp.send_failed", email, { error: String(err) });
    return {
      step: "email",
      error: "Failed to send the verification code. Please try again.",
    };
  }

  const isResend = _prev.step === "otp" && _prev.email === email;
  // Dev-mode hint: only when SMTP is absent AND not in production.
  const devOtp =
    !process.env.SMTP_HOST && process.env.NODE_ENV !== "production"
      ? otp
      : undefined;

  return { step: "otp", email, devOtp, resent: isResend };
}

// ── Step 2 — Verify OTP ───────────────────────────────────────────────────────

export async function verifyOtpAction(
  _prev: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const otp = ((formData.get("otp") as string) ?? "").trim();

  if (!email || !otp) return "Missing email or code.";

  // Validate first — this gives us specific failure reasons and updates
  // attempt counters, without yet consuming the token.
  const check = await validateOtp(email, otp);
  if (!check.ok) {
    switch (check.reason) {
      case "not_found":
        return "No active code found for this email. Please request a new one.";
      case "expired":
        return "Your code has expired (10-minute limit). Please request a new one.";
      case "wrong_code": {
        const left = check.attemptsLeft;
        return left <= 1
          ? `Incorrect code — 1 attempt remaining before your code is invalidated.`
          : `Incorrect code. ${left} attempts remaining.`;
      }
      case "max_attempts":
        return "Too many incorrect attempts — your code has been invalidated. Click 'Resend code' to get a new one.";
    }
  }

  // Look up role for the redirect destination.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRecord = await (db as any).user.findUnique({
    where: { email },
    select: { role: true },
  });
  const redirectTo =
    userRecord?.role === "MANAGER" ? ROUTES.dashboard : ROUTES.dsmMy;

  try {
    // signIn calls authorize → verifyAndConsumeOtp (final consumption).
    await signIn("credentials", { email, otp, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      logOtp("otp.invalid", email, { stage: "signIn" });
      return "Sign-in failed. Please request a new code.";
    }
    // Re-throw Next.js redirects so they propagate correctly.
    throw error;
  }
}

