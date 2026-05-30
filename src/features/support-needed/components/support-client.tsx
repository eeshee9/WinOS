"use client";

import { useActionState, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, X, ChevronLeft, ChevronRight, BellRing, CheckCircle2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatShortDate } from "@/features/dsm/utils";
import { daysOpen, filterSupport, type SupportStatusFilter } from "../utils";
import { markSupportResolved, type MarkSupportResolvedState } from "../actions/mark-resolved";
import { createSupport, type CreateSupportState } from "../actions/create-support";
import { sendSupportReminder, type SupportReminderState } from "../actions/send-reminder";
import type { SupportNeedItem } from "../queries";
import type { TeamMember } from "@/features/dsm/queries";

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 5;

const STATUS_STYLES = {
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
} as const;

function StatusBadge({ resolved }: { resolved: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
      resolved ? STATUS_STYLES.resolved : STATUS_STYLES.in_progress
    )}>
      {resolved ? "Resolved" : "In Progress"}
    </span>
  );
}

// ── User avatar ───────────────────────────────────────────────────────────────

function UserAvatar({ user }: { user: { name: string | null; email: string } | null }) {
  if (!user) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
        {(user.name ?? user.email).slice(0, 2).toUpperCase()}
      </span>
      <span className="text-sm">
        {user.name?.split(" ")[0] ?? user.email.split("@")[0]}
      </span>
    </div>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({ item, onClose }: { item: SupportNeedItem; onClose: () => void }) {
  const router = useRouter();
  const [resolveState, resolveAction, resolvePending] = useActionState<MarkSupportResolvedState, FormData>(
    markSupportResolved, {}
  );
  const [reminderState, reminderAction, reminderPending] = useActionState<SupportReminderState, FormData>(
    sendSupportReminder, {}
  );
  const days = daysOpen(item.date);
  const isResolved = item.resolved || resolveState.message === "resolved";

  useEffect(() => {
    if (resolveState.message === "resolved") router.refresh();
  }, [resolveState.message, router]);

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-l bg-card xl:w-80">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <span className="text-sm font-semibold">Support Details</span>
        <button type="button" onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-accent">
          <X size={15} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Description</p>
            <button type="button" className="text-muted-foreground hover:text-primary">
              <Pencil size={12} />
            </button>
          </div>
          <p className="text-sm leading-relaxed">{item.text}</p>
        </div>

        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Days Open
          </p>
          <p className={cn("text-sm font-semibold", days > 3 ? "text-destructive" : "text-foreground")}>
            {days === 0 ? "Today" : `${days} Day${days !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Status</p>
          <StatusBadge resolved={isResolved} />
        </div>

        {item.supportFrom && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Support From
            </p>
            <UserAvatar user={item.supportFrom} />
          </div>
        )}

        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Raised By
          </p>
          <UserAvatar user={item.raisedBy} />
        </div>

        <div className="h-px bg-border" />

        {resolveState.message && resolveState.message !== "resolved" && (
          <p className="text-xs text-destructive">{resolveState.message}</p>
        )}
        {reminderState.message === "sent" && (
          <p className="text-xs text-emerald-600">Reminder sent.</p>
        )}
        {reminderState.message === "no_target" && (
          <p className="text-xs text-muted-foreground">No one to notify — add a @mention when requesting support.</p>
        )}
        {reminderState.message === "already_resolved" && (
          <p className="text-xs text-muted-foreground">This item is already resolved.</p>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t px-5 py-4">
        <form action={resolveAction}>
          <input type="hidden" name="supportId" value={item.id} />
          <button
            type="submit"
            disabled={isResolved || resolvePending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <CheckCircle2 size={15} />
            {isResolved ? "Resolved" : resolvePending ? "Resolving…" : "Mark as Resolved"}
          </button>
        </form>
        <form action={reminderAction}>
          <input type="hidden" name="supportId" value={item.id} />
          <button
            type="submit"
            disabled={isResolved || reminderPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            <BellRing size={15} />
            {reminderPending ? "Sending…" : "Send Reminder"}
          </button>
        </form>
      </div>
    </aside>
  );
}

// ── Request support modal ─────────────────────────────────────────────────────

function RequestSupportModal({
  teamMembers,
  onClose,
}: {
  teamMembers: TeamMember[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<CreateSupportState, FormData>(createSupport, {});

  if (state.message === "created") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl">
          <div className="mb-4 flex items-center gap-2 text-emerald-700">
            <CheckCircle2 size={18} />
            <span className="font-semibold">Support request raised.</span>
          </div>
          <button
            type="button"
            onClick={() => { router.refresh(); onClose(); }}
            className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold">Request Support</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-accent">
            <X size={15} />
          </button>
        </div>
        <form action={action} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Description <span className="text-destructive">*</span>
            </label>
            <textarea
              name="text"
              rows={4}
              placeholder="What support do you need?"
              className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary placeholder:text-muted-foreground/50"
            />
            {state.errors?.text && <p className="mt-1 text-xs text-destructive">{state.errors.text[0]}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Support From <span className="font-normal opacity-60">(optional)</span>
            </label>
            <select
              name="mentionedUserId"
              defaultValue=""
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">No one specific</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name ?? m.email.split("@")[0]}{m.title ? ` — ${m.title}` : ""}
                </option>
              ))}
            </select>
          </div>
          {state.message && state.message !== "created" && (
            <p className="text-xs text-destructive">{state.message}</p>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border py-2 text-sm font-medium hover:bg-accent">
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Requesting…" : "Request Support"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main client ───────────────────────────────────────────────────────────────

type Props = { items: SupportNeedItem[]; teamMembers: TeamMember[] };

export function SupportClient({ items, teamMembers }: Props) {
  const [statusFilter, setStatusFilter] = useState<SupportStatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(() => items[0]?.id ?? null);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const filtered = useMemo(
    () => filterSupport(items, statusFilter, search),
    [items, statusFilter, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const selected = items.find((s) => s.id === selectedId) ?? null;
  const activeCount = items.filter((s) => !s.resolved).length;

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Main area ─────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Support Needed</h1>
              <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
                {activeCount} Active
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Identify challenges early and collaborate to keep work moving.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus size={14} />
            Request Support
          </button>
        </div>

        {/* Filter bar */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
              className="appearance-none rounded-lg border bg-background py-2 pl-3 pr-8 text-sm outline-none focus:border-primary"
            >
              <option value="all">Status: All</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <ChevronRight size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 text-muted-foreground" />
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-lg border bg-background px-3 py-2">
            <Search size={13} className="shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by title or description..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Date Raised
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Support From
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    {search || statusFilter !== "all"
                      ? "No items match your filters."
                      : "No support requests yet. Add one from your DSM or use the button above."}
                  </td>
                </tr>
              ) : (
                paginated.map((item) => {
                  const isSelected = item.id === selectedId;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        isSelected
                          ? "border-l-[3px] border-l-primary bg-primary/5"
                          : "border-l-[3px] border-l-transparent hover:bg-muted/30"
                      )}
                    >
                      <td className="max-w-xs px-5 py-3.5">
                        <p className="line-clamp-2 text-sm font-medium leading-snug">{item.text}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge resolved={item.resolved} />
                      </td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground">
                        {formatShortDate(item.date)}
                      </td>
                      <td className="px-4 py-3.5">
                        <UserAvatar user={item.supportFrom} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {filtered.length > 0 && (
            <div className="flex items-center justify-between border-t px-5 py-3">
              <p className="text-xs text-muted-foreground">
                Showing {Math.min((safePage - 1) * PAGE_SIZE + 1, filtered.length)}–
                {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} item
                {filtered.length !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded border text-muted-foreground hover:bg-accent disabled:opacity-30"
                >
                  <ChevronLeft size={13} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded border text-xs font-medium transition-colors",
                      p === safePage
                        ? "border-primary bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded border text-muted-foreground hover:bg-accent disabled:opacity-30"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail panel ──────────────────────────────────────────────── */}
      {selected && (
        <DetailPanel
          key={selected.id}
          item={selected}
          onClose={() => setSelectedId(null)}
        />
      )}

      {/* ── Modal ─────────────────────────────────────────────────────── */}
      {showModal && (
        <RequestSupportModal
          teamMembers={teamMembers}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
