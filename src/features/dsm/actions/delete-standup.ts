"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getStr } from "@/lib/action-utils";

export type DeleteStandupState = { message?: string };

export async function deleteStandup(
  _prevState: DeleteStandupState,
  formData: FormData
): Promise<DeleteStandupState> {
  const session = await auth();
  if (!session?.user?.id) return { message: "Unauthorized" };

  const id = getStr(formData, "id");

  const where =
    session.user.role === "MANAGER"
      ? { id }
      : { id, userId: session.user.id };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (db as any).standupEntry.deleteMany({ where });
  if (result.count === 0) return { message: "Not found" };

  revalidatePath("/dsm");
  return { message: "deleted" };
}
