import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { getMySupportNeeds } from "@/features/support-needed/queries";
import { getTeamMembers } from "@/features/dsm/queries";
import { SupportClient } from "@/features/support-needed/components/support-client";

export default async function SupportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(ROUTES.login);

  const [items, teamMembers] = await Promise.all([
    getMySupportNeeds(),
    getTeamMembers(),
  ]);

  return <SupportClient items={items} teamMembers={teamMembers} />;
}
