import { LoginForm } from "@/features/auth/components/login-form";
import { APP_CONFIG } from "@/config/app";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm rounded-lg border bg-card p-8 shadow-sm">
      <h1 className="mb-1 text-xl font-semibold">{APP_CONFIG.name}</h1>
      <p className="mb-1 text-sm font-medium text-foreground">
        Sign in with your Eagle Eye Digital email
      </p>
      <p className="mb-6 text-xs text-muted-foreground">
        Enter your registered company email to receive a one-time code
      </p>
      <LoginForm />
    </div>
  );
}
