"use client";

import { useState } from "react";
import { Zap, ChevronDown, ChevronUp } from "lucide-react";
import type { EntryWithDetails } from "../queries";

type TodaysFocusProps = {
  entry: EntryWithDetails | null;
};

export function TodaysFocusCard({ entry }: TodaysFocusProps) {
  const [open, setOpen] = useState(false);

  const todayTasks = entry?.tasks.filter((t) => t.kind === "TODAY") ?? [];
  const focusTask = todayTasks[0];

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Zap size={14} />
        </span>
        <span className="flex-1 text-left text-sm font-semibold text-primary">
          Today&apos;s Focus
        </span>
        {open ? (
          <ChevronUp size={16} className="text-primary/60" />
        ) : (
          <ChevronDown size={16} className="text-primary/60" />
        )}
      </button>

      {open && (
        <div className="border-t border-primary/20 px-4 pb-4 pt-3">
          {focusTask ? (
            <p className="text-sm text-foreground">{focusTask.text}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No focus set for today. Add your first task in the form below.
            </p>
          )}
          {todayTasks.length > 1 && (
            <p className="mt-2 text-xs text-muted-foreground">
              +{todayTasks.length - 1} more task{todayTasks.length > 2 ? "s" : ""} planned
            </p>
          )}
        </div>
      )}
    </div>
  );
}
