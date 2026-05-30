import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { weekOfMonth, getWeekRange, relativeDayLabel } from "../utils";
import { StandupDayCard } from "./standup-day-card";
import type { EntryWithDetails } from "../queries";

type WeekHistoryProps = {
  entries: EntryWithDetails[];
  weekOffset: number;
};

export function WeekHistory({ entries, weekOffset }: WeekHistoryProps) {
  const { start } = getWeekRange(weekOffset);
  const weekLabel = `Week ${weekOfMonth(start)}`;
  const canGoForward = weekOffset < 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Heading row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">This Week&apos;s Standups</h2>
          <p className="text-sm text-muted-foreground">
            Review daily status updates and progress.
          </p>
        </div>

        {/* Week nav */}
        <div className="flex shrink-0 items-center gap-1 rounded-lg border bg-card px-1 py-1 shadow-sm">
          <Link
            href={`/dsm?w=${weekOffset - 1}`}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent"
            aria-label="Previous week"
          >
            <ChevronLeft size={16} />
          </Link>
          <span className="min-w-16 text-center text-sm font-medium">{weekLabel}</span>
          <Link
            href={canGoForward ? `/dsm?w=${weekOffset + 1}` : "/dsm"}
            aria-label="Next week"
            className={cn(
              "rounded p-1 text-muted-foreground transition-colors hover:bg-accent",
              !canGoForward && "pointer-events-none opacity-30"
            )}
            aria-disabled={!canGoForward}
          >
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      {/* Day cards */}
      {entries.length === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          No standups recorded for this week.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <StandupDayCard
              key={entry.id}
              entry={entry}
              defaultOpen={relativeDayLabel(entry.date) === "Today" && entry.status !== "MISSED"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
