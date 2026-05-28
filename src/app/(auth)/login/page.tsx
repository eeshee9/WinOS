import { headers } from "next/headers";
import { LoginForm } from "@/features/auth/components/login-form";
import { APP_CONFIG } from "@/config/app";
import { ROUTES } from "@/constants/routes";

async function getCsrfToken(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const res = await fetch(`${proto}://${host}/api/auth/csrf`, {
    headers: { cookie: h.get("cookie") ?? "" },
    cache: "no-store",
  });
  const data = await res.json() as { csrfToken: string };
  return data.csrfToken;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, csrfToken] = await Promise.all([
    searchParams,
    getCsrfToken(),
  ]);

  return (
    <div className="w-full max-w-sm rounded-lg border bg-card p-8 shadow-sm">
      <h1 className="mb-1 text-xl font-semibold">{APP_CONFIG.name}</h1>
      <p className="mb-6 text-sm text-muted-foreground">Sign in to your account</p>
      <LoginForm
        csrfToken={csrfToken}
        callbackUrl={ROUTES.dashboard}
        error={error}
      />
    </div>
  );
}
