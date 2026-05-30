"use client";
import { useActionState, useState } from "react";
import {
  requestOtpAction,
  verifyOtpAction,
  type RequestOtpState,
} from "@/features/auth/actions/login";

const INITIAL: RequestOtpState = { step: "email" };

export function LoginForm() {
  // When the user clicks "Use a different email" we force the email step
  // without a server round-trip.
  const [emailOverride, setEmailOverride] = useState(false);

  const [requestState, requestAction, isRequestPending] = useActionState<
    RequestOtpState,
    FormData
  >(requestOtpAction, INITIAL);

  const [verifyError, verifyAction, isVerifyPending] = useActionState<
    string | undefined,
    FormData
  >(verifyOtpAction, undefined);

  // Derive step purely from server state + local override.
  const isOtpStep =
    requestState.step === "otp" && !!requestState.email && !emailOverride;

  // ── Step 2: OTP verification ───────────────────────────────────────────────
  if (isOtpStep) {
    return (
      <div className="flex flex-col gap-4">
        {/* Resent confirmation banner */}
        {requestState.resent && !requestState.error && (
          <p className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
            A new code was sent to{" "}
            <span className="font-medium">{requestState.email}</span>.
          </p>
        )}

        {/* Rate-limit or resend error on OTP screen */}
        {requestState.error && (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {requestState.error}
          </p>
        )}

        {/* Verification form */}
        <form action={verifyAction} className="flex flex-col gap-4">
          <input type="hidden" name="email" value={requestState.email} />

          {!requestState.resent && !requestState.error && (
            <p className="text-sm text-muted-foreground">
              A 6-digit code was sent to{" "}
              <span className="font-medium text-foreground">
                {requestState.email}
              </span>
              . It expires in 10 minutes.
            </p>
          )}

          {/* Dev-mode hint — only rendered when SMTP_HOST is absent and not prod */}
          {requestState.devOtp && (
            <p className="rounded-md border border-dashed border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Dev mode — code:{" "}
              <strong className="tracking-widest">{requestState.devOtp}</strong>
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="otp" className="text-sm font-medium">
              One-time code
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoComplete="one-time-code"
              placeholder="000000"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm tracking-widest outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {verifyError && (
            <p className="text-sm text-destructive" role="alert">
              {verifyError}
            </p>
          )}

          <button
            type="submit"
            disabled={isVerifyPending}
            className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {isVerifyPending ? "Verifying…" : "Verify code"}
          </button>
        </form>

        {/* Resend / back — sibling forms, not nested */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <form
            action={(fd: FormData) => {
              requestAction(fd);
            }}
          >
            <input type="hidden" name="email" value={requestState.email} />
            <button
              type="submit"
              disabled={isRequestPending || !!requestState.rateLimitWaitSeconds}
              className="underline underline-offset-2 disabled:opacity-50"
            >
              Resend code
            </button>
          </form>
          <span aria-hidden>·</span>
          <button
            type="button"
            onClick={() => setEmailOverride(true)}
            className="underline underline-offset-2"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  // ── Step 1: Email entry ────────────────────────────────────────────────────
  return (
    <form
      action={(fd: FormData) => {
        setEmailOverride(false);
        requestAction(fd);
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Company email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@eagleeyedigital.io"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {requestState.error && (
        <p className="text-sm text-destructive" role="alert">
          {requestState.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isRequestPending}
        className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {isRequestPending ? "Sending code…" : "Send code"}
      </button>
    </form>
  );
}
