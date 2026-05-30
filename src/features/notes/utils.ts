import type { NoteWithDetails } from "./queries";

export type NotesFilter = "all" | "pinned" | "recent" | "mine" | "reminders";

/**
 * Primary tab filter applied to an already-fetched notes array.
 * Server-side visibility rules (member vs manager) are enforced in getNotes().
 */
export function applyFilter(
  notes: NoteWithDetails[],
  filter: NotesFilter,
  userId: string
): NoteWithDetails[] {
  switch (filter) {
    case "pinned":
      return notes.filter((n) => n.isPinned);

    case "recent":
      return [...notes].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

    case "mine":
      return notes.filter((n) => n.authorId === userId);

    case "reminders":
      return notes
        .filter((n) => n.reminderAt !== null)
        .sort(
          (a, b) =>
            new Date(a.reminderAt!).getTime() -
            new Date(b.reminderAt!).getTime()
        );

    case "all":
    default:
      return notes;
  }
}

/**
 * Secondary filters: notebook, tag, and free-text search.
 * Applied after the primary tab filter.
 */
export function applySecondaryFilters(
  notes: NoteWithDetails[],
  opts: { notebookId?: string; tagId?: string; search?: string }
): NoteWithDetails[] {
  let result = notes;

  if (opts.notebookId) {
    result = result.filter((n) => n.notebookId === opts.notebookId);
  }

  if (opts.tagId) {
    result = result.filter((n) => n.tags.some((t) => t.tag.id === opts.tagId));
  }

  if (opts.search) {
    const q = opts.search.toLowerCase();
    result = result.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.notebook?.name ?? "").toLowerCase().includes(q) ||
        n.tags.some((t) => t.tag.name.toLowerCase().includes(q)) ||
        n.checklistItems.some((i) => i.text.toLowerCase().includes(q))
    );
  }

  return result;
}
