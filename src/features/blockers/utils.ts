import type { BlockerItem } from "./queries";

export type BlockerStatusFilter = "all" | "in_progress" | "resolved";
export type BlockerPriorityFilter = "all" | "LOW" | "MEDIUM" | "HIGH";

/** Days since the blocker was raised. Returns 0 for same-day. */
export function daysOpen(date: Date): number {
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
}

/** Filter and search blockers client-side. */
export function filterBlockers(
  items: BlockerItem[],
  status: BlockerStatusFilter,
  priority: BlockerPriorityFilter,
  search: string
): BlockerItem[] {
  const q = search.toLowerCase();
  return items.filter((b) => {
    if (status === "in_progress" && b.resolved) return false;
    if (status === "resolved" && !b.resolved) return false;
    if (priority !== "all" && b.priority !== priority) return false;
    if (q && !b.text.toLowerCase().includes(q)) return false;
    return true;
  });
}
