import nodemailer from "nodemailer";

// ── Zoho SMTP configuration ───────────────────────────────────────────────────
// Production: set these env vars in your deployment environment.
//   SMTP_HOST   = smtp.zoho.in          (or smtp.zoho.com for non-India region)
//   SMTP_PORT   = 587                   (STARTTLS) or 465 (SSL)
//   SMTP_USER   = noreply@eagleeyedigital.io
//   SMTP_PASS   = <Zoho app-specific password>
//   SMTP_FROM   = WinOS <noreply@eagleeyedigital.io>

function buildTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

const FROM = process.env.SMTP_FROM ?? "WinOS <noreply@eagleeyedigital.io>";
const IS_PROD = process.env.NODE_ENV === "production";

/**
 * Send an OTP code to the given address.
 *
 * - Production: requires SMTP_HOST / SMTP_USER / SMTP_PASS to be set.
 *   Throws if they are absent so the server action can surface the failure.
 * - Development: if SMTP is not configured, prints the code to the server
 *   console only. The OTP is never included in any HTTP response body.
 */
export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const transport = buildTransport();

  if (!transport) {
    if (IS_PROD) {
      // Fail loudly — a missing SMTP config in production is a deployment error.
      throw new Error(
        "SMTP not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.",
      );
    }
    // Dev fallback — never logged in production.
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`[OTP EMAIL]  To: ${to}`);
    console.log(`             Code: ${otp}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return;
  }

  const subject = "Your WinOS sign-in code";
  const text = [
    `Your WinOS sign-in code is: ${otp}`,
    "",
    "This code expires in 10 minutes and is single-use.",
    "If you did not request this, you can safely ignore this email.",
  ].join("\n");

  await transport.sendMail({ from: FROM, to, subject, text });
}
