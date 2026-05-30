import { describe, it, expect } from "vitest";
import { applyFilter, applySecondaryFilters } from "@/features/notes/utils";
import type { NoteWithDetails } from "@/features/notes/queries";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function note(overrides: Partial<NoteWithDetails> & { id: string }): NoteWithDetails {
  return {
    id: overrides.id,
    title: overrides.title ?? "Note " + overrides.id,
    content: overrides.content ?? "Content",
    type: overrides.type ?? "TEXT",
    color: overrides.color ?? null,
    isPinned: overrides.isPinned ?? false,
    reminderAt: overrides.reminderAt ?? null,
    notebookId: overrides.notebookId ?? null,
    notebook: overrides.notebook ?? null,
    authorId: overrides.authorId ?? "user-a",
    author: overrides.author ?? { name: "User A", email: "a@test.com" },
    tags: overrides.tags ?? [],
    checklistItems: overrides.checklistItems ?? [],
    createdAt: overrides.createdAt ?? new Date("2026-01-01"),
    updatedAt: overrides.updatedAt ?? new Date("2026-01-01"),
  };
}

const MANAGER_ID = "manager-1";
const MEMBER_ID = "user-a";
const NB_WORK = "nb-work";
const NB_PERSONAL = "nb-personal";
const TAG_AUTH = "tag-auth";
const TAG_INFRA = "tag-infra";

const pinnedOld    = note({ id: "1", isPinned: true,  authorId: MANAGER_ID, updatedAt: new Date("2026-01-01"), notebookId: NB_WORK });
const pinnedNew    = note({ id: "2", isPinned: true,  authorId: MEMBER_ID,  updatedAt: new Date("2026-05-01"), notebookId: NB_PERSONAL });
const unpinnedOld  = note({ id: "3", isPinned: false, authorId: MEMBER_ID,  updatedAt: new Date("2026-02-01") });
const unpinnedNew  = note({ id: "4", isPinned: false, authorId: MANAGER_ID, updatedAt: new Date("2026-04-01") });
const withReminder = note({ id: "5", authorId: MEMBER_ID, reminderAt: new Date("2026-05-29"), updatedAt: new Date("2026-04-10") });
const noReminder   = note({ id: "6", authorId: MEMBER_ID, reminderAt: null });

const taggedAuth  = note({ id: "7", authorId: MEMBER_ID, tags: [{ tag: { id: TAG_AUTH, name: "auth" } }] });
const taggedInfra = note({ id: "8", authorId: MANAGER_ID, tags: [{ tag: { id: TAG_INFRA, name: "infra" } }] });

const allNotes = [pinnedNew, pinnedOld, unpinnedNew, unpinnedOld];

// ── applyFilter — "all" ───────────────────────────────────────────────────────

describe('applyFilter — "all"', () => {
  it("returns all notes unchanged", () => {
    expect(applyFilter(allNotes, "all", MEMBER_ID)).toEqual(allNotes);
  });

  it("returns empty array for empty input", () => {
    expect(applyFilter([], "all", MEMBER_ID)).toEqual([]);
  });
});

// ── applyFilter — "pinned" ────────────────────────────────────────────────────

describe('applyFilter — "pinned"', () => {
  it("returns only pinned notes", () => {
    const result = applyFilter(allNotes, "pinned", MEMBER_ID);
    expect(result.every((n) => n.isPinned)).toBe(true);
    expect(result).toHaveLength(2);
  });

  it("returns empty when no notes are pinned", () => {
    expect(applyFilter([unpinnedOld, unpinnedNew], "pinned", MEMBER_ID)).toEqual([]);
  });
});

// ── applyFilter — "recent" ────────────────────────────────────────────────────

describe('applyFilter — "recent"', () => {
  it("sorts by updatedAt descending", () => {
    const result = applyFilter(allNotes, "recent", MEMBER_ID);
    const dates = result.map((n) => n.updatedAt.getTime());
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });

  it("does not mutate the original array", () => {
    const original = [...allNotes];
    applyFilter(allNotes, "recent", MEMBER_ID);
    expect(allNotes).toEqual(original);
  });

  it("most recently updated note is first", () => {
    expect(applyFilter(allNotes, "recent", MEMBER_ID)[0].id).toBe(pinnedNew.id);
  });
});

// ── applyFilter — "mine" ──────────────────────────────────────────────────────

describe('applyFilter — "mine"', () => {
  it("returns only notes authored by the given user", () => {
    const result = applyFilter(allNotes, "mine", MEMBER_ID);
    expect(result.every((n) => n.authorId === MEMBER_ID)).toBe(true);
    expect(result).toHaveLength(2);
  });

  it("returns empty when user has no notes", () => {
    expect(applyFilter(allNotes, "mine", "unknown-user")).toEqual([]);
  });
});

// ── applyFilter — "reminders" ─────────────────────────────────────────────────

describe('applyFilter — "reminders"', () => {
  const mixed = [withReminder, noReminder, pinnedOld];

  it("returns only notes that have a reminder set", () => {
    const result = applyFilter(mixed, "reminders", MEMBER_ID);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(withReminder.id);
  });

  it("sorts by reminderAt ascending (soonest first)", () => {
    const n1 = note({ id: "r1", reminderAt: new Date("2026-06-01") });
    const n2 = note({ id: "r2", reminderAt: new Date("2026-05-30") });
    const result = applyFilter([n1, n2], "reminders", MEMBER_ID);
    expect(result[0].id).toBe("r2");
  });

  it("returns empty when no notes have reminders", () => {
    expect(applyFilter([noReminder, pinnedOld], "reminders", MEMBER_ID)).toEqual([]);
  });
});

// ── applySecondaryFilters — notebook ──────────────────────────────────────────

describe("applySecondaryFilters — notebookId", () => {
  const notes = [pinnedOld, pinnedNew, unpinnedOld];

  it("filters by notebookId", () => {
    const result = applySecondaryFilters(notes, { notebookId: NB_WORK });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(pinnedOld.id);
  });

  it("returns all notes when notebookId is undefined", () => {
    expect(applySecondaryFilters(notes, {})).toHaveLength(3);
  });

  it("returns empty when no notes match the notebook", () => {
    expect(applySecondaryFilters(notes, { notebookId: "nb-other" })).toEqual([]);
  });
});

// ── applySecondaryFilters — tag ───────────────────────────────────────────────

describe("applySecondaryFilters — tagId", () => {
  const notes = [taggedAuth, taggedInfra, pinnedOld];

  it("filters to notes with the given tag", () => {
    const result = applySecondaryFilters(notes, { tagId: TAG_AUTH });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(taggedAuth.id);
  });

  it("returns empty when no notes carry the tag", () => {
    expect(applySecondaryFilters(notes, { tagId: "tag-unknown" })).toEqual([]);
  });
});

// ── applySecondaryFilters — search ────────────────────────────────────────────

describe("applySecondaryFilters — search", () => {
  const notes = [
    note({ id: "s1", title: "Auth refactor", content: "JWT migration steps" }),
    note({ id: "s2", title: "DB perf", content: "Index on userId" }),
    note({ id: "s3", title: "Meeting notes", content: "Sprint retro", notebook: { id: "nb1", name: "Work", color: null } }),
    note({ id: "s4", title: "Side project", content: "Unrelated", tags: [{ tag: { id: "t1", name: "nextjs" } }] }),
  ];

  it("matches note title", () => {
    expect(applySecondaryFilters(notes, { search: "auth" })).toHaveLength(1);
  });

  it("matches note content", () => {
    expect(applySecondaryFilters(notes, { search: "JWT" })).toHaveLength(1);
  });

  it("matches notebook name", () => {
    expect(applySecondaryFilters(notes, { search: "work" })).toHaveLength(1);
  });

  it("matches tag name", () => {
    expect(applySecondaryFilters(notes, { search: "nextjs" })).toHaveLength(1);
  });

  it("is case-insensitive", () => {
    expect(applySecondaryFilters(notes, { search: "SPRINT" })).toHaveLength(1);
  });

  it("returns all notes for empty search", () => {
    expect(applySecondaryFilters(notes, { search: "" })).toHaveLength(4);
  });

  it("returns empty when no notes match", () => {
    expect(applySecondaryFilters(notes, { search: "xyzzy" })).toEqual([]);
  });
});
