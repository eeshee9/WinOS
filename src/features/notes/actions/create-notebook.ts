"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getStr, validateText } from "@/lib/action-utils";

export type CreateNotebookState = { errors?: { name?: string[] }; message?: string };

const NOTEBOOK_COLORS = [
  "#bfdbfe", "#bbf7d0", "#fde68a",
  "#e9d5ff", "#fecaca", "#e0e7ff",
];

function pickColor(): string {
  return NOTEBOOK_COLORS[Math.floor(Math.random() * NOTEBOOK_COLORS.length)];
}

export async function createNotebook(
  _prevState: CreateNotebookState,
  formData: FormData
): Promise<CreateNotebookState> {
  const session = await auth();
  if (!session?.user?.id) return { message: "Unauthorized" };

  const name = getStr(formData, "name");
  const nameError = validateText("Notebook name", name, 60);
  if (nameError) return { errors: { name: nameError } };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing = await (db as any).notebook.findUnique({
    where: { name_ownerId: { name, ownerId: session.user.id } },
  });
  if (existing) return { errors: { name: ["A notebook with that name already exists"] } };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any).notebook.create({
    data: { name, color: pickColor(), ownerId: session.user.id },
  });

  revalidatePath("/notes");
  return { message: "created" };
}
