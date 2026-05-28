import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();
  const role = session?.user?.role;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Signed in as {session?.user?.email} &middot; {role}
      </p>
      {/* TODO: render role-specific widgets */}
    </div>
  );
}
