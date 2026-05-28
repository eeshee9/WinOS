import { redirect } from "next/navigation";

export default function RootPage() {
  // TODO: replace with session check — redirect to /dashboard or /login
  redirect("/dashboard");
}
