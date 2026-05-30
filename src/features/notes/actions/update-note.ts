"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getStr, validateText } from "@/lib/action-utils";
import { syncTags, syncChecklistItems } from "./_utils";

export type UpdateNoteState = {
  errors?: { title?: string[]; content?: string[] };
  message?: string;
};

const TITLE_MAX = 120;
const CONTENT_MAX = 5000;

export async function updateNote(
  _prevState: UpdateNoteState,
  formData: FormData
): Promise<UpdateNoteState> {
  const session = await auth();
  if (!session?.user?.id) return { message: "Unauthorized" };

  const id = getStr(formData, "id");
  const title = getStr(formData, "title");
  const noteType = getStr(formData, "noteType"); // "TEXT" | "CHECKLIST" — hidden field
  const content = noteType === "CHECKLIST" ? "" : getStr(formData, "content");
  const notebookId = getStr(formData, "notebookId") || null;
  const color = getStr(formData, "color") || null;
  const tagsRaw = getStr(formData, "tags");
  const reminderAtStr = getStr(formData, "reminderAt");
  const reminderAt = reminderAtStr ? new Date(reminderAtStr) : null;

  const errors: UpdateNoteState["errors"] = {};
  errors.title = validateText("Title", title, TITLE_MAX);
  if (noteType !== "CHECKLIST") {
    errors.content = validateText("Content", content, CONTENT_MAX);
  }
  if (errors.title || errors.content) return { errors };

  const where =
    session.user.role === "MANAGER"
      ? { id }
      : { id, authorId: session.user.id };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (db as any).note.updateMany({
    where,
    data: { title, content, color, notebookId, reminderAt },
  });
  if (result.count === 0) return { message: "Not found" };

  await syncTags(id, session.user.id, tagsRaw);

  if (noteType === "CHECKLIST") {
    const items = formData.getAll("item") as string[];
    await syncChecklistItems(id, items);
  }

  revalidatePath("/notes");
  return { message: "updated" };
}
