"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getStr } from "@/lib/action-utils";

export type SaveNoteState = { message?: string };

export async function saveWorkspaceNote(
  _prevState: SaveNoteState,
  formData: FormData
): Promise<SaveNoteState> {
  const session = await auth();
  if (!session?.user?.id) return { message: "Unauthorized" };

  const title = getStr(formData, "title");
  const body = getStr(formData, "body");
  const keyNote = getStr(formData, "keyNote") || null;

  if (!title) return { message: "Title is required" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any).dsmWorkspaceNote.upsert({
    where: { ownerId: session.user.id },
    create: { title, body, keyNote, ownerId: session.user.id },
    update: { title, body, keyNote },
  });

  revalidatePath("/dsm");
  return { message: "saved" };
}
