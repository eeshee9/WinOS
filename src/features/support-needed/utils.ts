import type { SupportNeedItem } from "./queries";

export type SupportStatusFilter = "all" | "in_progress" | "resolved";

/** Days since the support need was raised. Returns 0 for same-day. */
export function daysOpen(date: Date): number {
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
}

/** Filter and search support needs client-side. */
export function filterSupport(
  items: SupportNeedItem[],
  status: SupportStatusFilter,
  search: string
): SupportNeedItem[] {
  const q = search.toLowerCase();
  return items.filter((s) => {
    if (status === "in_progress" && s.resolved) return false;
    if (status === "resolved" && !s.resolved) return false;
    if (q) {
      const matchText = s.text.toLowerCase().includes(q);
      const matchUser = (s.supportFrom?.name ?? s.supportFrom?.email ?? "").toLowerCase().includes(q);
      if (!matchText && !matchUser) return false;
    }
    return true;
  });
}
