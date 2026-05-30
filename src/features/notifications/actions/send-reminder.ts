"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { toUtcDate } from "@/features/dsm/utils";

const REMINDER_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4-hour cooldown per user per day

export type SendReminderState = {
  message?: string;
  sent?: number;
  skipped?: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** True if the user already has a DSM_REMINDER today within the cooldown window. */
async function alreadyRemindedToday(
  d: ReturnType<typeof Object.create>,
  userId: string
): Promise<boolean> {
  const todayStart = toUtcDate();
  const cooldownStart = new Date(Date.now() - REMINDER_COOLDOWN_MS);
  const cutoff = cooldownStart > todayStart ? cooldownStart : todayStart;

  const existing = await d.notification.findFirst({
    where: {
      userId,
      type: "DSM_REMINDER",
      createdAt: { gte: cutoff },
    },
  });
  return !!existing;
}

/** True if the user already submitted today (not pending). */
async function hasSubmittedToday(
  d: ReturnType<typeof Object.create>,
  userId: string,
  today: Date
): Promise<boolean> {
  const entry = await d.standupEntry.findUnique({
    where: { userId_date: { userId, date: today } },
    select: { status: true },
  });
  if (!entry) return false;
  return (
    entry.status === "SUBMITTED" ||
    entry.status === "PENDING_REVIEW" ||
    entry.status === "REVIEWED"
  );
}

// ── Actions ───────────────────────────────────────────────────────────────────

/** Send a reminder to a single user. Returns skipped if user already submitted or reminded. */
export async function sendReminderToUser(
  _prev: SendReminderState,
  formData: FormData
): Promise<SendReminderState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "MANAGER") {
    return { message: "Unauthorized" };
  }

  const userId = formData.get("userId") as string;
  const teamId = (formData.get("teamId") as string | null) || null;

  if (!userId) return { message: "Missing userId" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = db as any;
  const today = toUtcDate();

  if (await hasSubmittedToday(d, userId, today)) {
    return { message: "already_submitted", sent: 0, skipped: 1 };
  }
  if (await alreadyRemindedToday(d, userId)) {
    return { message: "already_reminded", sent: 0, skipped: 1 };
  }

  await d.notification.create({
    data: {
      type: "DSM_REMINDER",
      title: "DSM Reminder",
      message:
        "Hey! You haven't submitted your Daily Status Meeting update yet. Please submit before EOD.",
      userId,
      createdById: session.user.id,
      teamId,
    },
  });

  revalidatePath("/dsm/all");
  return { message: "sent", sent: 1, skipped: 0 };
}

/** Send reminders to all pending members of a team. */
export async function sendRemindersToTeam(
  _prev: SendReminderState,
  formData: FormData
): Promise<SendReminderState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "MANAGER") {
    return { message: "Unauthorized" };
  }

  const teamId = formData.get("teamId") as string;
  if (!teamId) return { message: "Missing teamId" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = db as any;
  const today = toUtcDate();

  const team = await d.team.findUnique({
    where: { id: teamId },
    include: { members: { select: { userId: true } } },
  });
  if (!team) return { message: "Team not found" };

  let sent = 0;
  let skipped = 0;

  for (const { userId } of team.members) {
    if (await hasSubmittedToday(d, userId, today)) { skipped++; continue; }
    if (await alreadyRemindedToday(d, userId)) { skipped++; continue; }

    await d.notification.create({
      data: {
        type: "DSM_REMINDER",
        title: "DSM Reminder",
        message:
          "Hey! You haven't submitted your Daily Status Meeting update yet. Please submit before EOD.",
        userId,
        createdById: session.user.id,
        teamId,
      },
    });
    sent++;
  }

  revalidatePath("/dsm/all");
  return { message: sent > 0 ? "sent" : "all_reminded", sent, skipped };
}
