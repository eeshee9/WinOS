"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type CreateTeamState = { message?: string; teamId?: string };

export async function createTeam(
  _prev: CreateTeamState,
  formData: FormData
): Promise<CreateTeamState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "MANAGER") {
    return { message: "Unauthorized" };
  }

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) return { message: "Team name is required" };

  const department = (formData.get("department") as string | null)?.trim() || null;
  const description = (formData.get("description") as string | null)?.trim() || null;
  const leadId = (formData.get("leadId") as string | null) || null;
  const memberIds = (formData.getAll("memberIds") as string[]).filter(Boolean);
  const requireApproval = formData.get("requireApproval") === "on";
  const notifyMembers = formData.get("notifyMembers") === "on";
  const allowEdits = formData.get("allowEdits") === "on";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = db as any;

  const team = await d.team.create({
    data: {
      name,
      department,
      description,
      leadId,
      requireApproval,
      notifyMembers,
      allowEdits,
      members: memberIds.length > 0
        ? { create: memberIds.map((userId) => ({ userId })) }
        : undefined,
    },
  });

  revalidatePath("/dsm/all");
  return { message: "created", teamId: team.id };
}
