"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { toUtcDate } from "@/features/dsm/utils";

export type CreateSupportState = { message?: string; errors?: { text?: string[] } };

export async function createSupport(
  _: CreateSupportState,
  formData: FormData
): Promise<CreateSupportState> {
  const session = await auth();
  if (!session?.user?.id) return { message: "Unauthorized" };

  const text = (formData.get("text") as string)?.trim();
  const mentionedUserId = (formData.get("mentionedUserId") as string) || null;

  if (!text) return { errors: { text: ["Description is required"] } };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = db as any;
  const today = toUtcDate();

  const entry = await d.standupEntry.upsert({
    where: { userId_date: { userId: session.user.id, date: today } },
    create: { userId: session.user.id, date: today, status: "DRAFT" },
    update: {},
  });

  if (entry.status === "REVIEWED") {
    return { message: "Today's standup is already reviewed." };
  }

  const order = await d.standupSupportNeed.count({ where: { entryId: entry.id } });

  await d.standupSupportNeed.create({
    data: {
      text,
      mentionedUserId: mentionedUserId || null,
      resolved: false,
      order,
      entryId: entry.id,
    },
  });

  revalidatePath("/support");
  revalidatePath("/dsm");
  return { message: "created" };
}
