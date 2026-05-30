"use client";

import { useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { DsrForm } from "./dsr-form";
import { InsightsPanel } from "./insights-panel";
import { DsrHistory } from "./dsr-history";
import { formatDayHeader, formatFullDate, toUtcDate } from "@/features/dsm/utils";
import type { DsrEntryData, DsrStandupPrefill, DsrInsights } from "../queries";

type Props = {
  entry: DsrEntryData | null;
  prefill: DsrStandupPrefill;
  weeklyEntries: DsrEntryData[];
  insights: DsrInsights;
  todayDateStr: string;
  weekOffset: number;
  justSubmitted: boolean;
};

export function DsrPageClient({
  entry,
  prefill,
  weeklyEntries,
  insights,
  todayDateStr,
  weekOffset,
  justSubmitted,
}: Props) {
  const submitFnRef = useRef<() => void>(() => {});
  const [, forceRender] = useState(0);

  const showForm = !entry || entry.status === "DRAFT";
  const now = toUtcDate();
  const cp = insights.completionPercent;
  const ct = insights.completedTaskCount;
  const pt = insights.plannedTaskCount;

  function handlePanelSubmit() {
    submitFnRef.current();
  }

  function handleRegisterSubmit(fn: () => void) {
    submitFnRef.current = fn;
    forceRender((n) => n + 1);
  }

  return (
    <div className="flex h-full">
      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-y-auto p-6">
        {/* Page header */}
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatDayHeader(now)}</span>
              <span className="mx-1 text-muted-foreground/30">·</span>
              <span className="font-semibold text-primary">Evening Review</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{formatFullDate(now)}</h1>
          </div>

          {(cp > 0 || !showForm) && (
            <div className="mb-0.5 flex items-center divide-x divide-border rounded-lg border bg-card shadow-sm">
              <div className="flex flex-col items-center px-4 py-2 text-center">
                <span className="text-[10px] font-medium uppercase text-muted-foreground">Completion</span>
                <span className="text-lg font-bold text-primary">{cp}%</span>
              </div>
              <div className="flex flex-col items-center px-4 py-2 text-center">
                <span className="text-[10px] font-medium uppercase text-muted-foreground">Tasks</span>
                <span className="text-lg font-bold">{ct}/{pt}</span>
              </div>
            </div>
          )}
        </div>

        {/* Success banner */}
        {justSubmitted && (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">DSR submitted successfully</p>
              <p className="text-xs text-emerald-700">Your team focus has been updated for today.</p>
            </div>
          </div>
        )}

        {showForm ? (
          <DsrForm
            entry={entry}
            prefill={prefill}
            todayDateStr={todayDateStr}
            onRegisterSubmit={handleRegisterSubmit}
          />
        ) : (
          <DsrHistory entries={weeklyEntries} weekOffset={weekOffset} />
        )}
      </div>

      {/* ── Insights Panel ──────────────────────────────────────────── */}
      <aside className="w-80 shrink-0 overflow-hidden border-l xl:w-96">
        <InsightsPanel
          insights={insights}
          entry={showForm ? entry : (weeklyEntries[0] ?? null)}
          showSubmitButton={showForm}
          onSubmit={handlePanelSubmit}
        />
      </aside>
    </div>
  );
}
