"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type MarkReadState = { message?: string };

/** Mark a single notification as read. Only the recipient can do this. */
export async function markNotificationRead(
  _prev: MarkReadState,
  formData: FormData
): Promise<MarkReadState> {
  const session = await auth();
  if (!session?.user?.id) return { message: "Unauthorized" };

  const notificationId = formData.get("notificationId") as string;
  if (!notificationId) return { message: "Missing id" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = db as any;

  const notif = await d.notification.findUnique({ where: { id: notificationId } });
  if (!notif || notif.userId !== session.user.id) return { message: "Not found" };

  if (notif.readAt) return { message: "marked" }; // already read — no-op

  await d.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });

  revalidatePath("/", "layout");
  return { message: "marked" };
}

/** Mark all notifications for the current user as read. */
export async function markAllNotificationsRead(
  _: MarkReadState,
  __: FormData
): Promise<MarkReadState> {
  const session = await auth();
  if (!session?.user?.id) return { message: "Unauthorized" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any).notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/", "layout");
  return { message: "all_marked" };
}
