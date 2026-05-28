import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROUTES } from "@/constants/routes";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) redirect(ROUTES.login);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — wired up in the next phase */}
      <aside className="w-60 shrink-0 border-r bg-card" />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header — wired up in the next phase */}
        <header className="flex h-14 items-center border-b bg-card px-6">
          <span className="text-sm font-medium text-muted-foreground">
            {session.user?.email}
          </span>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
