import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { SendRemindersButton } from "./send-reminders-button";
import type { TeamGroup, MemberSubmissionCard } from "../queries";

// ── Submission time helpers ───────────────────────────────────────────────────

function submissionChip(card: MemberSubmissionCard) {
  if (!card.submittedAt) return null;
  const timeStr = new Date(card.submittedAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const cutoff = new Date(card.submittedAt);
  cutoff.setUTCHours(10, 10, 0, 0);
  const isOnTime = new Date(card.submittedAt) <= cutoff;

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{timeStr}</span>
      <span className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
        isOnTime
          ? "bg-emerald-100 text-emerald-700"
          : "bg-amber-100 text-amber-700"
      )}>
        {isOnTime ? "On Time" : "Delayed"}
      </span>
    </div>
  );
}

// ── Submitted member card ─────────────────────────────────────────────────────

function SubmittedCard({ card }: { card: MemberSubmissionCard }) {
  return (
    <Link
      href={ROUTES.dsmMember(card.userId)}
      className="block rounded-xl border bg-card p-3.5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-2.5 mb-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary ring-2 ring-background ring-offset-1 ring-offset-primary/10">
          {(card.name ?? card.email).slice(0, 2).toUpperCase()}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight truncate">{card.name ?? card.email.split("@")[0]}</p>
          {submissionChip(card)}
        </div>
      </div>

      {card.todayTasks.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Today&apos;s Task
          </p>
          <ul className="space-y-1">
            {card.todayTasks.slice(0, 3).map((task, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                <span className="leading-snug line-clamp-1">{task}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Link>
  );
}

// ── Pending placeholder card ──────────────────────────────────────────────────

function PendingCard({ count, teamId }: { count: number; teamId: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-4 py-7 text-center">
      <div className="mb-3 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-2 w-2 rounded-full bg-muted-foreground/25" />
        ))}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {count} Pending Submission{count !== 1 ? "s" : ""}
      </p>
      <div className="mt-2">
        <SendRemindersButton teamId={teamId} pendingCount={count} />
      </div>
    </div>
  );
}

// ── Team column ───────────────────────────────────────────────────────────────

type Props = { group: TeamGroup };

export function TeamColumn({ group }: Props) {
  const allSubmitted = group.submittedCount === group.totalMembers && group.totalMembers > 0;
  const submitted = group.members.filter(
    (m) => m.status === "SUBMITTED" || m.status === "PENDING_REVIEW" || m.status === "REVIEWED"
  );
  const pending = group.members.filter(
    (m) => m.status === "DRAFT" || m.status === null || m.status === "MISSED"
  );

  return (
    <div className="flex w-64 shrink-0 flex-col gap-3">
      {/* Column header */}
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-primary" />
        <span className="text-sm font-semibold">{group.teamName}</span>
        {allSubmitted ? (
          <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-emerald-600">
            <CheckCircle2 size={12} /> All Submitted
          </span>
        ) : (
          <span className="ml-auto text-[10px] text-muted-foreground">
            {group.submittedCount}/{group.totalMembers}
          </span>
        )}
      </div>

      {/* Submitted member cards */}
      {submitted.map((card) => (
        <SubmittedCard key={card.userId} card={card} />
      ))}

      {/* Pending placeholder */}
      {pending.length > 0 && <PendingCard count={pending.length} teamId={group.teamId} />}

      {/* Empty team */}
      {group.totalMembers === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-6 text-center">
          <p className="text-xs text-muted-foreground">No members yet</p>
        </div>
      )}
    </div>
  );
}
