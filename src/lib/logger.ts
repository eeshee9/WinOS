// Structured server-side event logger for the OTP auth flow.
// Raw OTP codes are never passed here — only email addresses and metadata.

export type OtpEvent =
  | "otp.requested"
  | "otp.sent"
  | "otp.send_failed"
  | "otp.check_passed"
  | "otp.verified"
  | "otp.invalid"
  | "otp.expired"
  | "otp.max_attempts"
  | "otp.rate_limited";

type LogExtra = Record<string, string | number | boolean | undefined>;

const WARN_EVENTS = new Set<OtpEvent>([
  "otp.invalid",
  "otp.expired",
  "otp.max_attempts",
  "otp.rate_limited",
  "otp.send_failed",
]);

export function logOtp(event: OtpEvent, email: string, extra?: LogExtra): void {
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    event,
    email,
    ...extra,
  });
  if (WARN_EVENTS.has(event)) {
    console.warn(entry);
  } else {
    console.log(entry);
  }
}
