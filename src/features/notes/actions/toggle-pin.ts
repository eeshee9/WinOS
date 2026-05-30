"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getStr } from "@/lib/action-utils";

export type TogglePinState = { message?: string };

export async function togglePin(
  _prevState: TogglePinState,
  formData: FormData
): Promise<TogglePinState> {
  const session = await auth();
  if (!session?.user?.id) return { message: "Unauthorized" };

  const id = getStr(formData, "id");
  const currentPinned = formData.get("isPinned") === "true";

  const where =
    session.user.role === "MANAGER"
      ? { id }
      : { id, authorId: session.user.id };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (db as any).note.updateMany({
    where,
    data: { isPinned: !currentPinned },
  });
  if (result.count === 0) return { message: "Not found" };

  revalidatePath("/notes");
  return { message: "toggled" };
}
