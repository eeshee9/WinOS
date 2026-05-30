"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getStr } from "@/lib/action-utils";

export type ToggleItemState = { message?: string };

export async function toggleChecklistItem(
  _prevState: ToggleItemState,
  formData: FormData
): Promise<ToggleItemState> {
  const session = await auth();
  if (!session?.user?.id) return { message: "Unauthorized" };

  const itemId = getStr(formData, "itemId");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = await (db as any).checklistItem.findUnique({
    where: { id: itemId },
    include: { note: { select: { authorId: true } } },
  });

  if (!item) return { message: "Not found" };

  const canModify =
    item.note.authorId === session.user.id || session.user.role === "MANAGER";
  if (!canModify) return { message: "Not found" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any).checklistItem.update({
    where: { id: itemId },
    data: { checked: !item.checked },
  });

  revalidatePath("/notes");
  return { message: "toggled" };
}
