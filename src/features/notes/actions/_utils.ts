// Server-side helpers shared across note actions. Not a "use server" file.
import { db } from "@/lib/db";

/**
 * Replaces all NoteTag records for a note with entries derived from a
 * comma-separated tag string. Tags are upserted per owner so re-using an
 * existing tag name never creates a duplicate.
 */
export async function syncTags(
  noteId: string,
  authorId: string,
  tagNamesRaw: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = db as any;

  await d.noteTag.deleteMany({ where: { noteId } });

  const names = tagNamesRaw
    .split(",")
    .map((s: string) => s.trim().toLowerCase())
    .filter(Boolean);

  for (const name of names) {
    const tag = await d.tag.upsert({
      where: { name_ownerId: { name, ownerId: authorId } },
      create: { name, ownerId: authorId },
      update: {},
    });
    await d.noteTag.createMany({
      data: [{ noteId, tagId: tag.id }],
      skipDuplicates: true,
    });
  }
}

/**
 * Replaces all ChecklistItem records for a note with a new ordered list.
 * Blank strings are silently filtered out.
 */
export async function syncChecklistItems(
  noteId: string,
  items: string[]
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = db as any;

  await d.checklistItem.deleteMany({ where: { noteId } });

  const valid = items.map((t) => t.trim()).filter(Boolean);
  if (valid.length === 0) return;

  await d.checklistItem.createMany({
    data: valid.map((text, i) => ({ text, position: i, noteId })),
  });
}
