"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type BlockerReminderState = { message?: string };

/**
 * Send a reminder notification about an unresolved blocker.
 * - Team member → notifies their team lead (or first manager in system)
 * - Manager → notifies the team member who owns the blocker
 */
export async function sendBlockerReminder(
  _: BlockerReminderState,
  formData: FormData
): Promise<BlockerReminderState> {
  const session = await auth();
  if (!session?.user?.id) return { message: "Unauthorized" };

  const blockerId = formData.get("blockerId") as string;
  if (!blockerId) return { message: "Missing id" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = db as any;

  const blocker = await d.standupBlocker.findUnique({
    where: { id: blockerId },
    include: {
      entry: {
        include: {
          user: {
            select: {
              id: true, name: true,
              teamMemberships: {
                take: 1,
                include: { team: { select: { leadId: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!blocker) return { message: "Not found" };
  if (blocker.resolved) return { message: "already_resolved" };

  const isOwner = blocker.entry.userId === session.user.id;
  const isManager = session.user.role === "MANAGER";
  if (!isOwner && !isManager) return { message: "Unauthorized" };

  // Decide who to notify
  let targetUserId: string | null = null;
  if (isManager) {
    // Manager reminds the team member who has this blocker
    targetUserId = blocker.entry.userId;
  } else {
    // Team member notifies their team lead
    const firstMembership = blocker.entry.user.teamMemberships?.[0];
    targetUserId = firstMembership?.team?.leadId ?? null;

    // Fall back to any manager in the system
    if (!targetUserId) {
      const manager = await d.user.findFirst({
        where: { role: "MANAGER" },
        select: { id: true },
      });
      targetUserId = manager?.id ?? null;
    }
  }

  if (!targetUserId || targetUserId === session.user.id) {
    return { message: "no_target" };
  }

  await d.notification.create({
    data: {
      type: "DSM_REMINDER",
      title: "Blocker Reminder",
      message: `Reminder: the blocker "${blocker.text.slice(0, 80)}" is still unresolved and needs attention.`,
      userId: targetUserId,
      createdById: session.user.id,
    },
  });

  revalidatePath("/blockers");
  return { message: "sent" };
}
