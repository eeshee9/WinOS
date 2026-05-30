"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronDown, CheckCircle2, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { reviewStandup, type ReviewStandupState } from "../actions/review-standup";
import { setTaskPriority, type SetTaskPriorityState } from "../actions/set-task-priority";
import { reviewStatus, relativeDayLabel, formatShortDate, weekOfMonth, getWeekRange } from "@/features/dsm/utils";
import type { MemberReview, MemberReviewEntry } from "../queries";

// ── Priority picker ───────────────────────────────────────────────────────────

type Priority = "P1" | "P2" | "P3";

const PRIORITY_COLORS: Record<Priority, string> = {
  P1: "bg-destructive/10 text-destructive border-destructive/30",
  P2: "bg-amber-50 text-amber-700 border-amber-300",
  P3: "bg-sky-50 text-sky-700 border-sky-300",
};

function PriorityDropdown({ taskId, current }: { taskId: string; current: Priority | null }) {
  const [, action, pending] = useActionState<SetTaskPriorityState, FormData>(setTaskPriority, {});

  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="taskId" value={taskId} />
      <select
        name="priority"
        defaultValue={current ?? ""}
        onChange={(e) => {
          const form = e.target.form;
          if (form) {
            const fd = new FormData(form);
            fd.set("priority", e.target.value);
            action(fd);
          }
        }}
        disabled={pending}
        className={cn(
          "rounded-md border px-2 py-1 text-xs outline-none transition-colors",
          current ? PRIORITY_COLORS[current] : "text-muted-foreground"
        )}
      >
        <option value="">Select Priority</option>
        <option value="P1">Priority 1 (P1)</option>
        <option value="P2">Priority 2 (P2)</option>
        <option value="P3">Priority 3 (P3)</option>
      </select>
    </form>
  );
}

// ── Review button ─────────────────────────────────────────────────────────────

function ReviewButton({ entryId }: { entryId: string }) {
  const [state, action, pending] = useActionState<ReviewStandupState, FormData>(reviewStandup, {});

  if (state.message === "reviewed") {
    return (
      <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
        <CheckCheck size={16} /> Reviewed
      </div>
    );
  }

  return (
    <form action={action} className="w-full">
      <input type="hidden" name="entryId" value={entryId} />
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <CheckCheck size={16} />
        {pending ? "Reviewing…" : "Reviewed ✓"}
      </button>
    </form>
  );
}

// ── Compact entry preview (default today view) ────────────────────────────────

function CompactEntryPreview({ entry }: { entry: MemberReviewEntry }) {
  const todayTasks = entry.tasks.filter((t) => t.kind === "TODAY");
  const hasFollowUps = entry.supportNeeds.length > 0;
  const hasBlockers = entry.blockers.length > 0;

  return (
    <div className="space-y-3 px-4 pb-4 pt-3">
      {todayTasks.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Today&apos;s Task
          </p>
          <div className="space-y-1.5">
            {todayTasks.map((task, i) => (
              <div key={task.id} className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
                  T{i + 1}
                </span>
                <span className="text-sm leading-snug text-foreground/80">{task.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(hasFollowUps || hasBlockers) && (
        <div className={cn("grid gap-2", hasFollowUps && hasBlockers ? "grid-cols-2" : "grid-cols-1")}>
          {hasFollowUps && (
            <div className="rounded-lg bg-accent/60 p-2.5">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Follow-ups
              </p>
              <ol className="space-y-0.5">
                {entry.supportNeeds.slice(0, 2).map((s, i) => (
                  <li key={s.id} className="text-xs leading-snug text-foreground/70">
                    {i + 1}) {s.text}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {hasBlockers && (
            <div className="rounded-lg bg-destructive/5 p-2.5">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                Blockers
              </p>
              <ol className="space-y-0.5">
                {entry.blockers.slice(0, 2).map((b, i) => (
                  <li key={b.id} className="text-xs leading-snug text-destructive/70">
                    {i + 1}) {b.text}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Day entry expanded (full review form) ─────────────────────────────────────

function EntryExpanded({ entry }: { entry: MemberReviewEntry }) {
  const yesterdayTasks = entry.tasks.filter((t) => t.kind === "YESTERDAY");
  const todayTasks = entry.tasks.filter((t) => t.kind === "TODAY");
  const isReviewable =
    entry.status === "SUBMITTED" || entry.status === "PENDING_REVIEW";

  return (
    <div className="space-y-4">
      {yesterdayTasks.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
            <CheckCircle2 size={15} className="text-primary" />
            What did you complete yesterday?
          </h3>
          <div className="space-y-2">
            {yesterdayTasks.map((task) => (
              <div key={task.id} className="flex items-start gap-2.5">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-primary" />
                <span className="text-sm">{task.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {todayTasks.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
            <span className="text-sm">📋</span>
            What will you do today?
          </h3>
          <div className="space-y-2.5">
            {todayTasks.map((task, i) => (
              <div key={task.id} className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
                  T{i + 1}
                </span>
                <span className="flex-1 text-sm">{task.text}</span>
                <PriorityDropdown
                  taskId={task.id}
                  current={task.managerPriority as Priority | null}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {entry.blockers.length > 0 && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive">
            <span>🚫</span> Blockers
          </h3>
          <ol className="space-y-1 text-sm text-destructive/90">
            {entry.blockers.map((b, i) => (
              <li key={b.id}>{i + 1}. {b.text}</li>
            ))}
          </ol>
        </div>
      )}

      {entry.supportNeeds.length > 0 && (
        <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-sky-700">
            <span>🤝</span> Support needed
          </h3>
          <ol className="space-y-1 text-sm">
            {entry.supportNeeds.map((s, i) => (
              <li key={s.id}>
                {i + 1}.{" "}
                {s.mentionedUser && (
                  <span className="font-medium text-primary">
                    @{s.mentionedUser.name?.split(" ")[0] ?? "user"}&nbsp;
                  </span>
                )}
                {s.text}
              </li>
            ))}
          </ol>
        </div>
      )}

      {isReviewable && (
        <div className="pt-1">
          <ReviewButton entryId={entry.id} />
        </div>
      )}

      {entry.status === "REVIEWED" && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCheck size={16} />
          Reviewed{entry.reviewedBy ? ` by ${entry.reviewedBy.name?.split(" ")[0] ?? "manager"}` : ""}
        </div>
      )}
    </div>
  );
}

// ── Today entry card — compact default (images 3 & 9), expands to full form (image 10) ──

function TodayEntryCard({ entry }: { entry: MemberReviewEntry }) {
  const [expanded, setExpanded] = useState(false);
  const review = reviewStatus({
    status: entry.status,
    date: entry.date,
    reviewedAt: entry.reviewedAt,
    reviewedBy: entry.reviewedBy,
  });
  const dateStr = formatShortDate(entry.date);

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {/* Header — chevron toggles between compact (images 3 & 9) and full form (image 10) */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{dateStr}</span>
          <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
            Today
          </span>
          {(entry.status === "SUBMITTED" || entry.status === "PENDING_REVIEW" || entry.status === "REVIEWED") && (
            <span className="rounded-full border border-emerald-600/40 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              Submitted
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={cn(
            "flex items-center gap-1 text-xs",
            review.kind === "reviewed"
              ? "text-emerald-600"
              : review.kind === "none"
              ? "text-muted-foreground"
              : "text-destructive"
          )}>
            <span className={cn(
              "h-2 w-2 rounded-full",
              review.kind === "reviewed"
                ? "bg-emerald-500"
                : review.kind === "none"
                ? "bg-muted-foreground/40"
                : "bg-destructive"
            )} />
            {review.label}
          </span>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent"
            aria-label={expanded ? "Collapse entry" : "Expand to review form"}
          >
            <ChevronDown
              size={15}
              className={cn("transition-transform duration-200", expanded && "rotate-180")}
            />
          </button>
        </div>
      </div>

      {entry.status !== "MISSED" && (
        <div className="border-t">
          {expanded ? (
            <div className="px-4 pb-4 pt-3">
              <EntryExpanded entry={entry} />
            </div>
          ) : (
            <CompactEntryPreview entry={entry} />
          )}
        </div>
      )}
    </div>
  );
}

// ── Day card collapsed ────────────────────────────────────────────────────────

function DayCardCollapsed({ entry }: { entry: MemberReviewEntry }) {
  const [open, setOpen] = useState(false);
  const review = reviewStatus({
    status: entry.status,
    date: entry.date,
    reviewedAt: entry.reviewedAt,
    reviewedBy: entry.reviewedBy,
  });
  const dayLabel = relativeDayLabel(entry.date);
  const dateStr = formatShortDate(entry.date);

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{dateStr}</span>
          {dayLabel && (
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium",
              dayLabel === "Today" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
            )}>
              {dayLabel}
            </span>
          )}
          {(entry.status === "SUBMITTED" || entry.status === "PENDING_REVIEW" || entry.status === "REVIEWED") && (
            <span className="rounded-full border border-emerald-600/40 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              Submitted
            </span>
          )}
          {entry.status === "MISSED" && (
            <span className="rounded-full border border-destructive/30 bg-destructive/5 px-2 py-0.5 text-[11px] font-medium text-destructive">
              Missed
            </span>
          )}
          {entry.status === "DRAFT" && (
            <span className="rounded-full border border-amber-400/40 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
              Draft
            </span>
          )}
          {entry.blockers.length > 0 && (
            <span className="rounded-full border border-destructive/20 bg-destructive/5 px-2 py-0.5 text-[11px] font-medium text-destructive">
              {entry.blockers.length} Blocker{entry.blockers.length > 1 ? "s" : ""}
            </span>
          )}
          {entry.supportNeeds.length > 0 && (
            <span className="rounded-full border border-sky-300/50 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
              {entry.supportNeeds.length} Follow-up{entry.supportNeeds.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 text-xs">
          {review.kind === "reviewed" && (
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {review.label}
            </span>
          )}
          {(review.kind === "pending" || review.kind === "missed-deadline") && (
            <span className="flex items-center gap-1 text-destructive">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              {review.label}
            </span>
          )}
          {review.kind === "none" && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
              {review.label}
            </span>
          )}
        </div>

        <ChevronRight size={15} className={cn("ml-2 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} />
      </button>

      {open && entry.status !== "MISSED" && (
        <div className="border-t px-4 pb-4 pt-3">
          <EntryExpanded entry={entry} />
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  review: MemberReview;
  weekOffset: number;
};

export function MemberReviewDetail({ review, weekOffset }: Props) {
  const { user, entries } = review;
  const { start } = getWeekRange(weekOffset);
  const weekLabel = `Week ${weekOfMonth(start)}`;
  const canGoForward = weekOffset < 0;

  const todayEntry = entries.find((e) => relativeDayLabel(e.date) === "Today");
  const otherEntries = entries.filter((e) => relativeDayLabel(e.date) !== "Today");

  return (
    <div className="flex flex-col gap-5">
      {/* Member header */}
      <div className="flex items-center justify-between rounded-xl border bg-card p-5">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-xl font-bold text-primary ring-2 ring-background ring-offset-2 ring-offset-primary/10">
            {(user.name ?? user.email).slice(0, 2).toUpperCase()}
          </span>
          <div>
            <h2 className="text-xl font-bold">{user.name ?? user.email.split("@")[0]}</h2>
            <p className="text-sm text-muted-foreground">{user.title ?? "Team Member"}</p>
          </div>
        </div>

        {/* Week navigation */}
        <div className="flex items-center gap-1 rounded-lg border bg-background px-1 py-1">
          <Link
            href={`/dsm/member/${user.id}?w=${weekOffset - 1}`}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent"
          >
            <ChevronLeft size={16} />
          </Link>
          <span className="min-w-16 text-center text-sm font-medium">{weekLabel}</span>
          <Link
            href={canGoForward ? `/dsm/member/${user.id}?w=${weekOffset + 1}` : `/dsm/member/${user.id}`}
            className={cn(
              "rounded p-1 text-muted-foreground transition-colors hover:bg-accent",
              !canGoForward && "pointer-events-none opacity-30"
            )}
          >
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      {/* Today entry — compact preview by default, expands to full form */}
      {todayEntry && <TodayEntryCard entry={todayEntry} />}

      {/* Previous day cards */}
      {otherEntries.map((entry) => (
        <DayCardCollapsed key={entry.id} entry={entry} />
      ))}

      {entries.length === 0 && (
        <div className="flex h-24 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
          No standups recorded for this week.
        </div>
      )}
    </div>
  );
}
