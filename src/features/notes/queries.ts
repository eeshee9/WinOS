import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type ChecklistItemData = {
  id: string;
  text: string;
  checked: boolean;
  position: number;
};

export type NoteWithDetails = {
  id: string;
  title: string;
  content: string;
  type: "TEXT" | "CHECKLIST";
  color: string | null;
  isPinned: boolean;
  reminderAt: Date | null;
  notebookId: string | null;
  notebook: { id: string; name: string; color: string | null } | null;
  authorId: string;
  author: { name: string | null; email: string };
  tags: { tag: { id: string; name: string } }[];
  checklistItems: ChecklistItemData[];
  createdAt: Date;
  updatedAt: Date;
};

export type NotebookData = {
  id: string;
  name: string;
  color: string | null;
};

export async function getNotes(): Promise<NoteWithDetails[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const isManager = session.user.role === "MANAGER";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notes = await (db as any).note.findMany({
    where: isManager ? undefined : { authorId: session.user.id },
    include: {
      author: { select: { name: true, email: true } },
      notebook: { select: { id: true, name: true, color: true } },
      tags: { include: { tag: { select: { id: true, name: true } } } },
      checklistItems: { orderBy: { position: "asc" } },
    },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
  });

  return notes as NoteWithDetails[];
}

export async function getNotebooks(): Promise<NotebookData[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notebooks = await (db as any).notebook.findMany({
    where: { ownerId: session.user.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  });

  return notebooks as NotebookData[];
}
