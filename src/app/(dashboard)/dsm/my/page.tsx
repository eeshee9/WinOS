import { CheckCircle2 } from "lucide-react";
import { auth } from "@/lib/auth";
import {
  getTodayEntry,
  getYesterdayTasks,
  getWeekEntries,
  getWorkspaceNote,
  getKpiStats,
  getTeamMembers,
} from "@/features/dsm/queries";
import { toIsoDateStr, toUtcDate } from "@/features/dsm/utils";
import { TodaysFocusCard } from "@/features/dsm/components/today-focus-card";
import { SubmitDsmForm } from "@/features/dsm/components/submit-dsm-form";
import { WorkspaceNotesPanel } from "@/features/dsm/components/workspace-notes-panel";
import { DsmHeader } from "@/features/dsm/components/dsm-header";
import { KpiCards } from "@/features/dsm/components/kpi-cards";
import { WeekHistory } from "@/features/dsm/components/week-history";

type Props = {
  searchParams: Promise<{ submitted?: string; w?: string }>;
};

export default async function ManagerMyDsmPage({ searchParams }: Props) {
  const sp = await searchParams;
  const weekOffset = parseInt(sp.w ?? "0") || 0;
  const justSubmitted = sp.submitted === "1";

  const [session, todayEntry, yesterdayTasks, weekEntries, workspaceNote, kpiStats, teamMembers] =
    await Promise.all([
      auth(),
      getTodayEntry(),
      getYesterdayTasks(),
      getWeekEntries(weekOffset),
      getWorkspaceNote(),
      getKpiStats(),
      getTeamMembers(),
    ]);

  const todayDateStr = toIsoDateStr(toUtcDate());
  const showForm = !todayEntry || todayEntry.status === "DRAFT";
  const canEditNote =
    session?.user?.role === "MANAGER" ||
    (workspaceNote != null && workspaceNote.owner.id === session?.user?.id);

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-y-auto p-6">
        <DsmHeader entry={todayEntry} />

        {justSubmitted && (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">DSM submitted successfully</p>
              <p className="text-xs text-emerald-700">Your team focus has been updated for today.</p>
            </div>
          </div>
        )}

        {showForm ? (
          <>
            <TodaysFocusCard entry={todayEntry} />
            <SubmitDsmForm
              entry={todayEntry}
              yesterdayTasks={yesterdayTasks}
              teamMembers={teamMembers}
              todayDateStr={todayDateStr}
            />
          </>
        ) : (
          <>
            <WeekHistory entries={weekEntries} weekOffset={weekOffset} />
            <KpiCards stats={kpiStats} />
          </>
        )}
      </div>

      <aside className="w-80 shrink-0 overflow-hidden border-l xl:w-96">
        <WorkspaceNotesPanel note={workspaceNote} canEdit={canEditNote} />
      </aside>
    </div>
  );
}
