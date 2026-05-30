"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getStr } from "@/lib/action-utils";

export type ToggleActionItemState = { message?: string };

export async function toggleActionItem(
  _prevState: ToggleActionItemState,
  formData: FormData
): Promise<ToggleActionItemState> {
  const session = await auth();
  if (!session?.user?.id) return { message: "Unauthorized" };

  const itemId = getStr(formData, "itemId");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = db as any;

  const item = await d.dsmActionItem.findUnique({
    where: { id: itemId },
    include: { note: { select: { ownerId: true } } },
  });

  if (!item) return { message: "Not found" };

  // Only note owner (or manager) can toggle
  const canToggle =
    item.note.ownerId === session.user.id || session.user.role === "MANAGER";
  if (!canToggle) return { message: "Not found" };

  await d.dsmActionItem.update({ where: { id: itemId }, data: { checked: !item.checked } });

  revalidatePath("/dsm");
  return { message: "toggled" };
}
