"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { toUtcDate } from "@/features/dsm/utils";

export type CreateBlockerState = { message?: string; errors?: { text?: string[] } };

export async function createBlocker(
  _: CreateBlockerState,
  formData: FormData
): Promise<CreateBlockerState> {
  const session = await auth();
  if (!session?.user?.id) return { message: "Unauthorized" };

  const text = (formData.get("text") as string)?.trim();
  const priority = (formData.get("priority") as string) || "MEDIUM";

  if (!text) return { errors: { text: ["Description is required"] } };

  const validPriorities = ["LOW", "MEDIUM", "HIGH"];
  if (!validPriorities.includes(priority)) return { message: "Invalid priority" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = db as any;
  const today = toUtcDate();

  // Upsert a draft standup entry for today
  const entry = await d.standupEntry.upsert({
    where: { userId_date: { userId: session.user.id, date: today } },
    create: { userId: session.user.id, date: today, status: "DRAFT" },
    update: {},
  });

  // Check the guard: don't allow creating on a reviewed entry via this path
  if (entry.status === "REVIEWED") {
    return { message: "Today's standup is already reviewed." };
  }

  await d.standupBlocker.create({
    data: { text, priority, resolved: false, entryId: entry.id },
  });

  revalidatePath("/blockers");
  revalidatePath("/dsm");
  return { message: "created" };
}
