"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getStr, validateText } from "@/lib/action-utils";
import { syncTags, syncChecklistItems } from "./_utils";

export type CreateNoteState = {
  errors?: { title?: string[]; content?: string[] };
  message?: string;
};

const TITLE_MAX = 120;
const CONTENT_MAX = 5000;

export async function createNote(
  _prevState: CreateNoteState,
  formData: FormData
): Promise<CreateNoteState> {
  const session = await auth();
  if (!session?.user?.id) return { message: "Unauthorized" };

  const title = getStr(formData, "title");
  const type = getStr(formData, "type") === "CHECKLIST" ? "CHECKLIST" : "TEXT";
  const content = type === "TEXT" ? getStr(formData, "content") : "";
  const notebookId = getStr(formData, "notebookId") || null;
  const color = getStr(formData, "color") || null;
  const tagsRaw = getStr(formData, "tags");
  const reminderAtStr = getStr(formData, "reminderAt");
  const reminderAt = reminderAtStr ? new Date(reminderAtStr) : null;

  const errors: CreateNoteState["errors"] = {};
  errors.title = validateText("Title", title, TITLE_MAX);
  if (type === "TEXT") {
    errors.content = validateText("Content", content, CONTENT_MAX);
  }
  if (errors.title || errors.content) return { errors };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const note = await (db as any).note.create({
    data: {
      title,
      content,
      type,
      color,
      authorId: session.user.id,
      notebookId,
      reminderAt,
    },
  });

  // Tags
  await syncTags(note.id, session.user.id, tagsRaw);

  // Checklist items
  if (type === "CHECKLIST") {
    const items = formData.getAll("item") as string[];
    await syncChecklistItems(note.id, items);
  }

  revalidatePath("/notes");
  return { message: "created" };
}
