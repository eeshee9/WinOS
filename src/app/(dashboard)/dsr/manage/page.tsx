import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROUTES } from "@/constants/routes";
import { getAllDsrStats, getTeamGroupedDsrSubmissions } from "@/features/dsr/manager/queries";
import { AllDsrClient } from "@/features/dsr/manager/components/all-dsr-client";

export default async function AllDsrPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "MANAGER") {
    redirect(ROUTES.dsr);
  }

  const [stats, groups] = await Promise.all([
    getAllDsrStats(),
    getTeamGroupedDsrSubmissions(),
  ]);

  return <AllDsrClient stats={stats} groups={groups} />;
}
