import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getAllDsmStats,
  getTeamDsmGroups,
  getAllTeams,
  getAllUsers,
} from "@/features/dsm/manager/queries";
import { AllDsmClient } from "@/features/dsm/manager/components/all-dsm-client";

export default async function AllDsmPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "MANAGER") {
    redirect("/dsm/my");
  }

  const [stats, groups, teams, allUsers] = await Promise.all([
    getAllDsmStats(),
    getTeamDsmGroups(),
    getAllTeams(),
    getAllUsers(),
  ]);

  return <AllDsmClient stats={stats} groups={groups} teams={teams} allUsers={allUsers} />;
}
