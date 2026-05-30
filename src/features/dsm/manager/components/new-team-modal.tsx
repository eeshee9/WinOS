"use client";

import { useActionState, useState, useEffect } from "react";
import { X, Search, Users, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { createTeam, type CreateTeamState } from "../actions/create-team";
import { updateTeam, type UpdateTeamState } from "../actions/update-team";
import type { TeamWithMembers, AllUser } from "../queries";

const DEPARTMENTS = ["Engineering", "Design", "Marketing", "Product", "Sales", "Support", "SMM", "Other"];

type Props = {
  teams: TeamWithMembers[];
  allUsers: AllUser[];
  onClose: () => void;
};

function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked ?? false);
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => setOn((v) => !v)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          on ? "bg-primary" : "bg-muted"
        )}
      >
        <span className={cn(
          "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
          on ? "translate-x-4.5" : "translate-x-0.5"
        )} />
      </button>
      <input type="hidden" name={name} value={on ? "on" : "off"} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </label>
  );
}

function MemberPicker({
  allUsers,
  initialIds = [],
}: {
  allUsers: AllUser[];
  initialIds?: string[];
}) {
  const [selected, setSelected] = useState<string[]>(initialIds);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = allUsers.filter(
    (u) =>
      !selected.includes(u.id) &&
      (u.name?.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase()))
  );
  const selectedUsers = allUsers.filter((u) => selected.includes(u.id));

  return (
    <div>
      <div className="flex min-h-10 flex-wrap gap-1.5 rounded-md border bg-background p-2">
        {selectedUsers.map((u) => (
          <span
            key={u.id}
            className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">
              {(u.name ?? u.email).slice(0, 2).toUpperCase()}
            </span>
            {u.name ?? u.email.split("@")[0]}
            <button
              type="button"
              onClick={() => setSelected((s) => s.filter((id) => id !== u.id))}
              className="ml-0.5 text-primary/60 hover:text-primary"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          type="text"
          placeholder={selected.length === 0 ? "Search users..." : ""}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="min-w-24 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
        />
      </div>

      {open && filtered.length > 0 && (
        <div className="mt-1 max-h-40 overflow-y-auto rounded-md border bg-card shadow-md">
          {filtered.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => { setSelected((s) => [...s, u.id]); setQuery(""); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-accent"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                {(u.name ?? u.email).slice(0, 2).toUpperCase()}
              </span>
              <div>
                <p className="font-medium">{u.name ?? u.email}</p>
                <p className="text-muted-foreground">{u.title ?? u.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected.map((id) => (
        <input key={id} type="hidden" name="memberIds" value={id} />
      ))}
    </div>
  );
}

function TeamForm({
  allUsers,
  team,
  onSuccess,
}: {
  allUsers: AllUser[];
  team?: TeamWithMembers;
  onSuccess: () => void;
}) {
  const isEdit = !!team;
  const [createState, createAction, createPending] = useActionState<CreateTeamState, FormData>(createTeam, {});
  const [updateState, updateAction, updatePending] = useActionState<UpdateTeamState, FormData>(updateTeam, {});

  const state = isEdit ? updateState : createState;
  const action = isEdit ? updateAction : createAction;
  const pending = isEdit ? updatePending : createPending;

  useEffect(() => {
    if (state.message === "created" || state.message === "updated") {
      onSuccess();
    }
  }, [state.message, onSuccess]);

  return (
    <form action={action} className="flex flex-col gap-4">
      {isEdit && <input type="hidden" name="teamId" value={team.id} />}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium">Team Name</label>
          <input
            name="name"
            defaultValue={team?.name}
            placeholder="e.g. Product Ops"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Department</label>
          <div className="relative">
            <select
              name="department"
              defaultValue={team?.department ?? ""}
              className="w-full appearance-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Select department...</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium">Team Lead</label>
        <div className="relative">
          <select
            name="leadId"
            defaultValue={team?.leadId ?? ""}
            className="w-full appearance-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">Search for a leader...</option>
            {allUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name ?? u.email} — {u.title ?? u.role}</option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium">Add Members</label>
        <MemberPicker
          allUsers={allUsers}
          initialIds={team?.members.map((m) => m.userId) ?? []}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium">Team Description</label>
        <textarea
          name="description"
          defaultValue={team?.description ?? ""}
          placeholder="What will this team focus on?"
          rows={3}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary placeholder:text-muted-foreground/50 resize-none"
        />
      </div>

      <div className="flex items-center gap-6">
        <Toggle name="requireApproval" label="Require approval" defaultChecked={team?.requireApproval ?? false} />
        <Toggle name="notifyMembers" label="Notify members" defaultChecked={team?.notifyMembers ?? true} />
        <Toggle name="allowEdits" label="Allow edits" defaultChecked={team?.allowEdits ?? false} />
      </div>

      {state.message && state.message !== "created" && state.message !== "updated" && (
        <p className="text-xs text-destructive">{state.message}</p>
      )}

      <div className="flex items-center justify-end gap-3 border-t pt-4">
        <button
          type="button"
          onClick={onSuccess}
          className="rounded-lg border px-5 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save Team" : "Create Team 🚀")}
        </button>
      </div>
    </form>
  );
}

export function NewTeamModal({ teams, allUsers, onClose }: Props) {
  const [selectedTeam, setSelectedTeam] = useState<TeamWithMembers | null>(null);
  const [teamSearch, setTeamSearch] = useState("");

  const filtered = teams.filter((t) =>
    t.name.toLowerCase().includes(teamSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-background shadow-2xl">
        {/* Left — existing teams */}
        <div className="flex w-72 shrink-0 flex-col border-r">
          <div className="border-b p-5">
            <h2 className="text-lg font-semibold">Existing Teams</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Manage and view your current organizational structures.
            </p>
          </div>
          <div className="p-4 pb-2">
            <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
              <Search size={13} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter teams..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 pt-2 flex flex-col gap-2">
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTeam(t)}
                className={cn(
                  "w-full rounded-xl border p-3 text-left transition-colors hover:bg-accent",
                  selectedTeam?.id === t.id && "border-primary bg-primary/5"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Users size={14} className="text-primary" />
                    </span>
                    <div>
                      <p className="text-sm font-medium leading-tight">{t.name}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {t.members.length} members
                  </span>
                </div>
                {t.lead && (
                  <p className="mt-1.5 pl-10 text-xs text-muted-foreground">
                    &#9998; {t.lead.name ?? t.lead.email}
                  </p>
                )}
                {t.members.length > 0 && (
                  <div className="mt-2 flex pl-10">
                    {t.members.slice(0, 3).map((m) => (
                      <span
                        key={m.id}
                        title={m.user.name ?? m.user.email}
                        className="-ml-1.5 first:ml-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-primary/20 text-[9px] font-bold text-primary"
                      >
                        {(m.user.name ?? m.user.email).slice(0, 2).toUpperCase()}
                      </span>
                    ))}
                    {t.members.length > 3 && (
                      <span className="-ml-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] font-medium text-muted-foreground">
                        +{t.members.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedTeam(null)}
              className={cn(
                "w-full rounded-xl border border-dashed p-3 text-center text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary",
                !selectedTeam && "border-primary/40 text-primary"
              )}
            >
              + New Team
            </button>
          </div>
        </div>

        {/* Right — create/edit form */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h2 className="text-lg font-semibold">
                {selectedTeam ? `Edit: ${selectedTeam.name}` : "Create Team"}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {selectedTeam
                  ? "Update team parameters and members."
                  : "Define your team parameters and invite initial members."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-accent"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <TeamForm
              key={selectedTeam?.id ?? "new"}
              allUsers={allUsers}
              team={selectedTeam ?? undefined}
              onSuccess={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
