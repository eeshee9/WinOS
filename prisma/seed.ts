import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Normalize a date string to UTC midnight (ensures @@unique([userId, date]) works correctly)
function d(iso: string) {
  return new Date(iso + "T00:00:00.000Z");
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = new PrismaClient({ adapter } as any) as any;

  // ── Users ─────────────────────────────────────────────────────────────────

  const manager = await db.user.upsert({
    where: { email: "mohit@eagleeyedigital.io" },
    update: { role: "MANAGER", title: "Engineering Manager" },
    create: {
      email: "mohit@eagleeyedigital.io",
      name: "Mohit",
      role: "MANAGER",
      title: "Engineering Manager",
    },
  });

  const seo = await db.user.upsert({
    where: { email: "seo@eagleeyedigital.io" },
    update: { role: "MANAGER", title: "SEO Manager" },
    create: {
      email: "seo@eagleeyedigital.io",
      name: "SEO Manager",
      role: "MANAGER",
      title: "SEO Manager",
    },
  });

  const member = await db.user.upsert({
    where: { email: "ishita.vishwakarma@eagleeyedigital.io" },
    update: { title: "Senior Developer" },
    create: {
      email: "ishita.vishwakarma@eagleeyedigital.io",
      name: "Ishita Vishwakarma",
      role: "TEAM_MEMBER",
      title: "Senior Developer",
    },
  });

  // Additional realistic team members for @mention dropdown
  const sarah = await db.user.upsert({
    where: { email: "sarah.jenkins@eagleeyedigital.io" },
    update: { title: "Engineering Manager" },
    create: {
      email: "sarah.jenkins@eagleeyedigital.io",
      name: "Sarah Jenkins",
      role: "MANAGER",
      title: "Engineering Manager",
    },
  });

  const alex = await db.user.upsert({
    where: { email: "alex.rivera@eagleeyedigital.io" },
    update: { title: "Senior Developer" },
    create: {
      email: "alex.rivera@eagleeyedigital.io",
      name: "Alex Rivera",
      role: "TEAM_MEMBER",
      title: "Senior Developer",
    },
  });

  const marcus = await db.user.upsert({
    where: { email: "marcus.wright@eagleeyedigital.io" },
    update: { title: "Product Designer" },
    create: {
      email: "marcus.wright@eagleeyedigital.io",
      name: "Marcus Wright",
      role: "TEAM_MEMBER",
      title: "Product Designer",
    },
  });

  const rohan = await db.user.upsert({
    where: { email: "rohan.mehta@eagleeyedigital.io" },
    update: { title: "UI/UX Designer" },
    create: {
      email: "rohan.mehta@eagleeyedigital.io",
      name: "Rohan Mehta",
      role: "TEAM_MEMBER",
      title: "UI/UX Designer",
    },
  });

  const elena = await db.user.upsert({
    where: { email: "elena.rossi@eagleeyedigital.io" },
    update: { title: "Marketing Specialist" },
    create: {
      email: "elena.rossi@eagleeyedigital.io",
      name: "Elena Rossi",
      role: "TEAM_MEMBER",
      title: "Marketing Specialist",
    },
  });

  const priya = await db.user.upsert({
    where: { email: "priya.sharma@eagleeyedigital.io" },
    update: { title: "Frontend Developer" },
    create: {
      email: "priya.sharma@eagleeyedigital.io",
      name: "Priya Sharma",
      role: "TEAM_MEMBER",
      title: "Frontend Developer",
    },
  });

  console.log("Seeded users:", manager.email, seo.email, member.email, sarah.email, alex.email, marcus.email, rohan.email, elena.email, priya.email);

  // ── Notes: Notebooks ──────────────────────────────────────────────────────

  await db.notebook.deleteMany({ where: { ownerId: { in: [manager.id, member.id] } } });

  const mgNotebooks = await Promise.all([
    db.notebook.create({ data: { name: "Work", color: "#bfdbfe", ownerId: manager.id } }),
    db.notebook.create({ data: { name: "Meeting Notes", color: "#bbf7d0", ownerId: manager.id } }),
    db.notebook.create({ data: { name: "Follow-ups", color: "#fde68a", ownerId: manager.id } }),
    db.notebook.create({ data: { name: "Personal", color: "#e9d5ff", ownerId: manager.id } }),
  ]);

  const mbNotebooks = await Promise.all([
    db.notebook.create({ data: { name: "Work", color: "#bfdbfe", ownerId: member.id } }),
    db.notebook.create({ data: { name: "Dev Notes", color: "#bbf7d0", ownerId: member.id } }),
    db.notebook.create({ data: { name: "To Investigate", color: "#fde68a", ownerId: member.id } }),
    db.notebook.create({ data: { name: "Personal", color: "#e9d5ff", ownerId: member.id } }),
  ]);

  const [mgWork, mgMeeting, mgFollowups, mgPersonal] = mgNotebooks;
  const [mbWork, mbDev, mbInvestigate] = mbNotebooks;

  // ── Notes: Tags ───────────────────────────────────────────────────────────

  await db.tag.deleteMany({ where: { ownerId: { in: [manager.id, member.id] } } });

  const mgTags = {
    q3: await db.tag.create({ data: { name: "q3", ownerId: manager.id } }),
    hiring: await db.tag.create({ data: { name: "hiring", ownerId: manager.id } }),
    infra: await db.tag.create({ data: { name: "infra", ownerId: manager.id } }),
    client: await db.tag.create({ data: { name: "client", ownerId: manager.id } }),
    sprint: await db.tag.create({ data: { name: "sprint", ownerId: manager.id } }),
    action: await db.tag.create({ data: { name: "action-item", ownerId: manager.id } }),
  };

  const mbTags = {
    auth: await db.tag.create({ data: { name: "auth", ownerId: member.id } }),
    db: await db.tag.create({ data: { name: "db", ownerId: member.id } }),
    refactor: await db.tag.create({ data: { name: "refactor", ownerId: member.id } }),
    perf: await db.tag.create({ data: { name: "perf", ownerId: member.id } }),
    nextjs: await db.tag.create({ data: { name: "nextjs", ownerId: member.id } }),
    todo: await db.tag.create({ data: { name: "todo", ownerId: member.id } }),
  };

  // ── Notes ─────────────────────────────────────────────────────────────────

  await db.noteTag.deleteMany({});
  await db.checklistItem.deleteMany({});
  await db.note.deleteMany({ where: { authorId: { in: [manager.id, member.id] } } });

  const soon = new Date("2026-05-29T09:00:00Z");
  const overdue = new Date("2026-05-27T08:00:00Z");

  const mgNote1 = await db.note.create({ data: { title: "Q3 OKR Review", content: "Team hit 87% of targets. Wins: DSM v2, 3 new clients. Needs: deployment automation sprint.", isPinned: true, color: "#fef9c3", notebookId: mgWork.id, authorId: manager.id, reminderAt: soon } });
  await db.noteTag.createMany({ data: [{ noteId: mgNote1.id, tagId: mgTags.q3.id }, { noteId: mgNote1.id, tagId: mgTags.action.id }] });

  const mgNote2 = await db.note.create({ data: { title: "Hiring pipeline update", content: "Two engineers shortlisted for final round. Junior frontend role JD approved.", color: "#dbeafe", notebookId: mgWork.id, authorId: manager.id } });
  await db.noteTag.createMany({ data: [{ noteId: mgNote2.id, tagId: mgTags.hiring.id }] });

  const mgNote3 = await db.note.create({ data: { title: "Sprint 14 retro notes", content: "What went well: standups kept team aligned, PR review under 4h. To improve: story estimation.", notebookId: mgMeeting.id, authorId: manager.id } });
  await db.noteTag.createMany({ data: [{ noteId: mgNote3.id, tagId: mgTags.sprint.id }] });

  const mgNote4 = await db.note.create({ data: { title: "Client feedback — Eagle Eye v2", content: "Client flagged slow reports page. Target: p95 < 800ms. Follow up Thursday.", isPinned: true, notebookId: mgFollowups.id, authorId: manager.id, reminderAt: overdue } });
  await db.noteTag.createMany({ data: [{ noteId: mgNote4.id, tagId: mgTags.client.id }, { noteId: mgNote4.id, tagId: mgTags.action.id }] });

  const mgNote5 = await db.note.create({ data: { title: "Infrastructure cost audit", content: "Cloud spend up 23%. Dev envs left running overnight. Action: auto-shutdown policy.", notebookId: mgWork.id, authorId: manager.id } });
  await db.noteTag.createMany({ data: [{ noteId: mgNote5.id, tagId: mgTags.infra.id }, { noteId: mgNote5.id, tagId: mgTags.action.id }] });

  const mgChecklist = await db.note.create({ data: { title: "Q4 planning checklist", content: "", type: "CHECKLIST", color: "#dcfce7", notebookId: mgWork.id, authorId: manager.id, reminderAt: soon } });
  await db.checklistItem.createMany({ data: [{ text: "Schedule Q4 kick-off", checked: true, position: 0, noteId: mgChecklist.id }, { text: "Finalise headcount plan", checked: false, position: 1, noteId: mgChecklist.id }, { text: "Review infra budget", checked: false, position: 2, noteId: mgChecklist.id }, { text: "Set team OKRs for Q4", checked: false, position: 3, noteId: mgChecklist.id }] });
  await db.noteTag.createMany({ data: [{ noteId: mgChecklist.id, tagId: mgTags.q3.id }, { noteId: mgChecklist.id, tagId: mgTags.action.id }] });

  await db.note.create({ data: { title: "Team offsite agenda draft", content: "Day 1: alignment, roadmap. Day 2: workshops, demo day, dinner.", notebookId: mgPersonal.id, authorId: manager.id } });

  const mbNote1 = await db.note.create({ data: { title: "Auth refactor notes", content: "JWT done. PrismaAdapter wired. Role in token. Test both roles — pending.", isPinned: true, color: "#f3e8ff", notebookId: mbWork.id, authorId: member.id } });
  await db.noteTag.createMany({ data: [{ noteId: mbNote1.id, tagId: mbTags.auth.id }, { noteId: mbNote1.id, tagId: mbTags.refactor.id }] });

  const mbNote2 = await db.note.create({ data: { title: "Tailwind v4 migration notes", content: "Drops tailwind.config.js. Use @theme inline. cn() still works.", notebookId: mbDev.id, authorId: member.id } });
  await db.noteTag.createMany({ data: [{ noteId: mbNote2.id, tagId: mbTags.nextjs.id }] });

  const mbNote3 = await db.note.create({ data: { title: "DB query optimisation ideas", content: "Composite index on (userId, createdAt). Consider pagination. Check N+1 on author.", notebookId: mbInvestigate.id, authorId: member.id, reminderAt: soon } });
  await db.noteTag.createMany({ data: [{ noteId: mbNote3.id, tagId: mbTags.db.id }, { noteId: mbNote3.id, tagId: mbTags.perf.id }] });

  const mbNote4 = await db.note.create({ data: { title: "PR review feedback", content: "Avoid db as any in business logic. Keep server actions thin. No direct db from pages.", isPinned: true, notebookId: mbWork.id, authorId: member.id } });
  await db.noteTag.createMany({ data: [{ noteId: mbNote4.id, tagId: mbTags.refactor.id }] });

  const mbChecklist = await db.note.create({ data: { title: "Auth refactor checklist", content: "", type: "CHECKLIST", notebookId: mbWork.id, authorId: member.id } });
  await db.checklistItem.createMany({ data: [{ text: "Migrate to JWT", checked: true, position: 0, noteId: mbChecklist.id }, { text: "Wire PrismaAdapter", checked: true, position: 1, noteId: mbChecklist.id }, { text: "Add role to token", checked: true, position: 2, noteId: mbChecklist.id }, { text: "Test login both roles", checked: false, position: 3, noteId: mbChecklist.id }, { text: "Write integration tests", checked: false, position: 4, noteId: mbChecklist.id }] });
  await db.noteTag.createMany({ data: [{ noteId: mbChecklist.id, tagId: mbTags.auth.id }, { noteId: mbChecklist.id, tagId: mbTags.todo.id }] });

  await db.note.create({ data: { title: "Side project ideas", content: "Time tracker integrating Zoho Projects API. Reuse WinOS auth pattern.", color: "#ffedd5", notebookId: mbNotebooks[3].id, authorId: member.id } });

  console.log("Seeded notes.");

  // ── DSM: Workspace notes ──────────────────────────────────────────────────

  await db.dsmActionItem.deleteMany({});
  await db.dsmWorkspaceNote.deleteMany({ where: { ownerId: { in: [manager.id, member.id] } } });

  const managerNote = await db.dsmWorkspaceNote.create({
    data: {
      title: "Team Focus: Week 22 Priorities",
      body: "Great progress on the auth refactor this week. For today's focus on the DSM dashboard, keep these priority items in mind for our stakeholder sync on Friday. We need to ensure the visual fidelity matches the WinOS design system.",
      keyNote: "Let's ensure the documentation for the auth module is updated before EOD Wednesday.",
      ownerId: manager.id,
    },
  });

  await db.dsmActionItem.createMany({
    data: [
      { text: "Prioritise the DSM dashboard implementation", checked: false, order: 0, noteId: managerNote.id },
      { text: "Check component accessibility (contrast ratios specifically)", checked: true, order: 1, noteId: managerNote.id },
      { text: "Ensure the dark mode toggle doesn't break the chart SVGs", checked: false, order: 2, noteId: managerNote.id },
    ],
  });

  await db.dsmWorkspaceNote.create({
    data: {
      title: "My Work Notes — Week 22",
      body: "Personal notes and reminders for the current sprint. Focusing on DSM v2, auth tests, and DB performance improvements.",
      keyNote: "Ping Mohit about the N+1 fix before the standup — it unblocks the reports page.",
      ownerId: member.id,
    },
  });

  const memberNote = await db.dsmWorkspaceNote.findUnique({ where: { ownerId: member.id } });
  await db.dsmActionItem.createMany({
    data: [
      { text: "Write integration tests for protected routes", checked: false, order: 0, noteId: memberNote.id },
      { text: "Open PR for DB query optimisation", checked: true, order: 1, noteId: memberNote.id },
    ],
  });

  // Workspace notes for other team members (shown in DSR member review panel)
  await db.dsmWorkspaceNote.deleteMany({
    where: { ownerId: { in: [alex.id, marcus.id, elena.id, rohan.id, priya.id] } },
  });

  const alexNote = await db.dsmWorkspaceNote.create({
    data: {
      title: "Sprint Focus — Auth & API Work",
      body: "Wrapping up the token refresh logic this week. Aiming to have the Auth service fully covered by tests before Friday's release cut. Backend API docs are still pending — blocked on that until they land.",
      keyNote: "Need the backend API documentation before I can unblock the token refresh endpoint tests.",
      ownerId: alex.id,
    },
  });
  await db.dsmActionItem.createMany({
    data: [
      { text: "Complete token refresh logic implementation", checked: false, order: 0, noteId: alexNote.id },
      { text: "Write unit tests for login API endpoints", checked: false, order: 1, noteId: alexNote.id },
      { text: "Review Sarah's PR once docs land", checked: false, order: 2, noteId: alexNote.id },
    ],
  });

  const marcusNote = await db.dsmWorkspaceNote.create({
    data: {
      title: "Design Week 22 — Client X Delivery",
      body: "High-fidelity mockups for Client X are done. Finalizing the style guide today. The dev handoff meeting is scheduled for Friday — need all assets exported and documented before then.",
      keyNote: "Automated handoff scripts will save us hours every sprint — pushing this as a team standard.",
      ownerId: marcus.id,
    },
  });
  await db.dsmActionItem.createMany({
    data: [
      { text: "Export all Client X assets to Figma handoff", checked: true, order: 0, noteId: marcusNote.id },
      { text: "Document component naming conventions", checked: false, order: 1, noteId: marcusNote.id },
      { text: "Prepare dev handoff deck for Friday", checked: false, order: 2, noteId: marcusNote.id },
    ],
  });

  const elenaNote = await db.dsmWorkspaceNote.create({
    data: {
      title: "Q3 Content Strategy Week",
      body: "Finalised the Q3 content calendar today — big win. A/B test is live on the homepage banner. Watching the data closely over the next 48 hours. Coordinating with the design team on the next campaign assets.",
      keyNote: "Data-backed decisions are the only way to scale content. Always tie copy to a measurable outcome.",
      ownerId: elena.id,
    },
  });
  await db.dsmActionItem.createMany({
    data: [
      { text: "Monitor A/B test results daily", checked: false, order: 0, noteId: elenaNote.id },
      { text: "Share Q3 strategy doc with Sarah for feedback", checked: true, order: 1, noteId: elenaNote.id },
      { text: "Brief design team on campaign assets needed", checked: false, order: 2, noteId: elenaNote.id },
    ],
  });

  const rohanNote = await db.dsmWorkspaceNote.create({
    data: {
      title: "Design System Audit Week",
      body: "Working through the full design system audit this week. Icon set review is done — found 12 inconsistencies that need to be resolved. Accessibility pass is still pending — targeting that tomorrow morning.",
      keyNote: "Consistent icon naming is critical for design-to-dev handoff. Align on conventions before the next sprint.",
      ownerId: rohan.id,
    },
  });
  await db.dsmActionItem.createMany({
    data: [
      { text: "Fix 12 icon naming inconsistencies", checked: false, order: 0, noteId: rohanNote.id },
      { text: "Complete accessibility review", checked: false, order: 1, noteId: rohanNote.id },
      { text: "Update component documentation", checked: true, order: 2, noteId: rohanNote.id },
    ],
  });

  console.log("Seeded workspace notes.");

  // ── DSM: Standup entries (structured) ─────────────────────────────────────

  await db.standupSupportNeed.deleteMany({});
  await db.standupBlocker.deleteMany({});
  await db.standupTask.deleteMany({});
  await db.standupEntry.deleteMany({ where: { userId: { in: [manager.id, member.id] } } });

  // Helper to create a full entry with tasks, blockers, support needs
  type BlockerInput = { text: string; priority: string; resolved: boolean };
  type SupportInput = { text: string; mentionedUserId?: string };

  async function makeEntry(
    userId: string,
    dateIso: string,
    status: string,
    yesterdayTasks: string[],
    todayTasks: string[],
    blockers: BlockerInput[],
    supports: SupportInput[],
    opts?: { reviewedById?: string; submittedAt?: Date }
  ) {
    const entry = await db.standupEntry.create({
      data: {
        userId,
        date: d(dateIso),
        status,
        submittedAt: status !== "DRAFT" && status !== "MISSED" ? (opts?.submittedAt ?? d(dateIso)) : null,
        reviewedAt: status === "REVIEWED" ? new Date(d(dateIso).getTime() + 6 * 3600000) : null,
        reviewedById: status === "REVIEWED" ? opts?.reviewedById : null,
      },
    });

    if (yesterdayTasks.length > 0) {
      await db.standupTask.createMany({
        data: yesterdayTasks.map((text, i) => ({ text, kind: "YESTERDAY", order: i, entryId: entry.id })),
      });
    }
    if (todayTasks.length > 0) {
      await db.standupTask.createMany({
        data: todayTasks.map((text, i) => ({ text, kind: "TODAY", order: i, entryId: entry.id })),
      });
    }
    if (blockers.length > 0) {
      await db.standupBlocker.createMany({
        data: blockers.map(b => ({ text: b.text, priority: b.priority, resolved: b.resolved, entryId: entry.id })),
      });
    }
    if (supports.length > 0) {
      await db.standupSupportNeed.createMany({
        data: supports.map((s, i) => ({ text: s.text, mentionedUserId: s.mentionedUserId ?? null, order: i, entryId: entry.id })),
      });
    }

    return entry;
  }

  // ── Member standup entries ────────────────────────────────────────────────

  // Current week (Mon 2026-05-25 – Thu 2026-05-28 "today")
  await makeEntry(member.id, "2026-05-25", "REVIEWED",
    ["Completed initial DB schema review", "Set up dev environment for new sprint"],
    ["Implement auth middleware refactor", "Write unit tests for login flow"],
    [{ text: "Waiting for approval on the DB migration plan from DevOps", priority: "MEDIUM", resolved: true }],
    [{ text: "Need code review from Sarah on the middleware PR", mentionedUserId: sarah.id }],
    { reviewedById: sarah.id }
  );

  await makeEntry(member.id, "2026-05-26", "PENDING_REVIEW",
    ["Implemented auth middleware refactor", "Wrote unit tests for login flow"],
    ["Architecture documentation for Project Phoenix", "Resolve 3 critical bugs in middleware"],
    [{ text: "Waiting for API documentation from the Backend team", priority: "HIGH", resolved: false }],
    [
      { text: "Need feedback from Marcus on modal transitions by EOD", mentionedUserId: marcus.id },
      { text: "Waiting on Alex for the API spec sign-off", mentionedUserId: alex.id },
    ]
  );

  await makeEntry(member.id, "2026-05-27", "SUBMITTED",
    ["Architecture documentation for Project Phoenix", "Resolved 3 critical bugs in middleware"],
    ["Investigated and fixed the N+1 query issue on reports page", "Opened PR for JWT auth migration"],
    [{ text: "Prisma adapter types conflict with NextAuth session shape — casting as any for now", priority: "MEDIUM", resolved: true }],
    [
      { text: "Need DB access credentials for staging — waiting on DevOps", mentionedUserId: sarah.id },
      { text: "Review request for auth PR — should be quick", mentionedUserId: alex.id },
    ]
  );

  // Today (Wed 2026-05-28): DRAFT — pre-filled so the form shows context
  await makeEntry(member.id, "2026-05-28", "DRAFT",
    [],
    ["Complete DSM dashboard implementation", "Write integration tests for protected routes"],
    [{ text: "Need design sign-off on the DSM card layout before proceeding", priority: "MEDIUM", resolved: false }],
    [{ text: "Feedback needed from Sarah on the DSM form UX by EOD", mentionedUserId: sarah.id }]
  );

  // Previous week (Mon 2026-05-18 – Fri 2026-05-22)
  await makeEntry(member.id, "2026-05-18", "REVIEWED",
    ["Reviewed PR backlog — cleared 6 open reviews", "Updated sprint board"],
    ["Start auth refactor", "Set up JWT session strategy"],
    [{ text: "Still waiting on access to the staging environment", priority: "LOW", resolved: true }],
    [{ text: "Sarah please review the sprint planning doc when you get a chance", mentionedUserId: sarah.id }],
    { reviewedById: sarah.id }
  );

  await makeEntry(member.id, "2026-05-19", "REVIEWED",
    ["Started auth refactor", "Set up JWT session strategy"],
    ["Wire up PrismaAdapter with custom fields", "Add role to JWT token"],
    [{ text: "NextAuth v5 beta docs are incomplete for edge cases — need to test manually", priority: "LOW", resolved: true }],
    [
      { text: "Pair session with Sarah needed on PrismaAdapter edge cases", mentionedUserId: sarah.id },
      { text: "Need updated design mocks from Marcus for v2", mentionedUserId: marcus.id },
    ],
    { reviewedById: sarah.id }
  );

  await makeEntry(member.id, "2026-05-20", "SUBMITTED",
    ["Wired up PrismaAdapter", "Added role to JWT token"],
    ["Test login flow end-to-end for both roles", "Fix edge case in session expiry"],
    [{ text: "Session expiry edge case is subtle — needs manager review before merge", priority: "HIGH", resolved: false }],
    [
      { text: "Code review needed from Alex on the session fix", mentionedUserId: alex.id },
      { text: "Staging deploy blocked until DevOps approves infra change", mentionedUserId: sarah.id },
    ]
  );

  // Missed Friday
  await db.standupEntry.create({ data: { userId: member.id, date: d("2026-05-23"), status: "MISSED" } });

  await makeEntry(member.id, "2026-05-22", "REVIEWED",
    ["Fixed session expiry edge case", "Merged auth refactor"],
    ["Refactor Prisma calls into typed data layer", "Remove direct db access from page files"],
    [{ text: "Data layer abstraction needs alignment on naming conventions", priority: "LOW", resolved: true }],
    [
      { text: "Review needed on the data layer design from Sarah", mentionedUserId: sarah.id },
      { text: "Need input from Alex on import path conventions for the feature folders", mentionedUserId: alex.id },
    ],
    { reviewedById: sarah.id }
  );

  // ── Manager standup entries ───────────────────────────────────────────────

  await makeEntry(manager.id, "2026-05-27", "REVIEWED",
    ["Reviewed sprint 14 retro with team", "Unblocked auth PR that was waiting"],
    ["Client call at 11am for Eagle Eye v2", "Write Q3 OKR summary for leadership"],
    [],
    [],
    { reviewedById: sarah.id }
  );

  await makeEntry(manager.id, "2026-05-28", "DRAFT",
    [],
    ["Review DSM v2 implementation with Test Member", "Follow up on hiring shortlist"],
    [],
    []
  );

  // ── Additional team-member standup entries (for All DSM demo) ────────────────

  // Alex Rivera: SUBMITTED today (2026-05-28) — Tech team
  await db.standupEntry.deleteMany({ where: { userId: alex.id } });
  await makeEntry(alex.id, "2026-05-28", "SUBMITTED",
    ["Completed Auth API endpoint documentation", "Reviewed PR #204 for the login flow"],
    ["Implement token refresh logic for Auth service", "Write unit tests for login API"],
    [{ text: "Waiting for API documentation from Backend team", priority: "HIGH", resolved: false }],
    [{ text: "Need code review from Sarah on the auth PR", mentionedUserId: sarah.id }],
    { submittedAt: new Date("2026-05-28T10:05:00Z") }
  );

  // Marcus Wright: SUBMITTED today — Creative team
  await db.standupEntry.deleteMany({ where: { userId: marcus.id } });
  await makeEntry(marcus.id, "2026-05-28", "SUBMITTED",
    ["Refactored data-table component for shared responsiveness", "Closed bug ticket #402: Sidebar alignment on Safari"],
    ["UI Revamp for Client X", "Brand Deck Polish", "Team Moodboard"],
    [],
    [{ text: "Need a quick sync with Sarah regarding the transition animation timing", mentionedUserId: sarah.id }],
    { submittedAt: new Date("2026-05-28T10:05:00Z") }
  );

  // Rohan Mehta: SUBMITTED today — Creative team (delayed)
  await db.standupEntry.deleteMany({ where: { userId: rohan.id } });
  await makeEntry(rohan.id, "2026-05-28", "SUBMITTED",
    ["Reviewed PR for Design System documentation updates", "Updated icon set library"],
    ["Design System Audit", "Icon Set Review"],
    [],
    [],
    { submittedAt: new Date("2026-05-28T10:15:00Z") }
  );

  // Elena Rossi: SUBMITTED today — Marketing team
  await db.standupEntry.deleteMany({ where: { userId: elena.id } });
  await makeEntry(elena.id, "2026-05-28", "SUBMITTED",
    ["Drafted Q3 social media calendar", "Reviewed campaign analytics for May"],
    ["Finalise Q3 content strategy", "Set up A/B test for homepage banner"],
    [],
    [],
    { submittedAt: new Date("2026-05-28T09:55:00Z") }
  );

  // Priya Sharma: no entry today (pending) — Creative team
  // (no entry needed — absence means pending)

  // Sarah Jenkins: no entry today (pending) — Tech team lead
  await db.standupEntry.deleteMany({ where: { userId: sarah.id } });

  console.log("Seeded standup entries.");

  // ── Teams ─────────────────────────────────────────────────────────────────

  await db.teamMember.deleteMany({});
  await db.team.deleteMany({});

  const teamCreative = await db.team.create({
    data: {
      name: "Creative Design & Brand",
      department: "Design",
      description: "Brand identity, UI design, and creative assets.",
      requireApproval: false,
      notifyMembers: true,
      allowEdits: false,
      leadId: marcus.id,
      members: {
        create: [
          { userId: marcus.id },
          { userId: rohan.id },
          { userId: priya.id },
          { userId: elena.id },
        ],
      },
    },
  });

  const teamTech = await db.team.create({
    data: {
      name: "Tech Engineering",
      department: "Engineering",
      description: "Backend, frontend, and infrastructure engineering.",
      requireApproval: true,
      notifyMembers: true,
      allowEdits: false,
      leadId: sarah.id,
      members: {
        create: [
          { userId: member.id },
          { userId: alex.id },
          { userId: sarah.id },
        ],
      },
    },
  });

  const teamMarketing = await db.team.create({
    data: {
      name: "Marketing & Growth",
      department: "Marketing",
      description: "Growth campaigns, content strategy, and partnerships.",
      requireApproval: false,
      notifyMembers: true,
      allowEdits: true,
      leadId: manager.id,
      members: {
        create: [
          { userId: elena.id },
          { userId: marcus.id },
        ],
      },
    },
  });

  await db.team.create({
    data: {
      name: "SMM",
      department: "Marketing",
      description: "Social media management and community engagement.",
      requireApproval: false,
      notifyMembers: false,
      allowEdits: false,
      leadId: manager.id,
    },
  });

  console.log("Seeded teams:", teamCreative.name, teamTech.name, teamMarketing.name, "SMM");

  // ── Notifications ─────────────────────────────────────────────────────────

  await db.notification.deleteMany({});

  // Seed some reminder notifications for the member and priya (to simulate prior reminders)
  await db.notification.createMany({
    data: [
      {
        type: "DSM_REMINDER",
        title: "DSM Reminder",
        message: "Hey! You haven't submitted your Daily Status Meeting update yet. Please submit before EOD.",
        userId: member.id,
        createdById: sarah.id,
        teamId: teamTech.id,
        // readAt null = unread
        createdAt: new Date("2026-05-27T09:30:00Z"),
      },
      {
        type: "DSM_REMINDER",
        title: "DSM Reminder",
        message: "Hey! You haven't submitted your Daily Status Meeting update yet. Please submit before EOD.",
        userId: priya.id,
        createdById: manager.id,
        teamId: teamCreative.id,
        readAt: new Date("2026-05-27T10:00:00Z"), // already read
        createdAt: new Date("2026-05-27T09:30:00Z"),
      },
    ],
  });

  console.log("Seeded notifications.");

  // ── DSR: Daily Status Review entries ─────────────────────────────────────

  await db.dsrTimelineEvent.deleteMany({});
  await db.dsrFollowUpDone.deleteMany({});
  await db.dsrResolvedBlocker.deleteMany({});
  await db.dsrAdditionalWork.deleteMany({});
  await db.dsrPlannedTask.deleteMany({});
  await db.dsrEntry.deleteMany({ where: { userId: member.id } });

  async function makeDsr(
    userId: string,
    dateIso: string,
    status: string,
    opts: {
      completionPercent?: number;
      completedTaskCount?: number;
      plannedTaskCount?: number;
      sentiment?: string;
      reflection?: string;
      resultOfDay?: string;
      managerComment?: string;
      submittedAt?: Date;
      reviewedAt?: Date;
      reviewedById?: string;
      plannedTasks?: { text: string; priority?: string; completed: boolean }[];
      additionalWorks?: string[];
      resolvedBlockers?: { text: string; resolved?: boolean }[];
      followUpsDone?: { text: string; completed?: boolean }[];
      timelineEvents?: { type: string; label: string; occurredAt: Date }[];
    }
  ) {
    const entry = await db.dsrEntry.create({
      data: {
        userId,
        date: d(dateIso),
        status,
        completionPercent: opts.completionPercent ?? 0,
        completedTaskCount: opts.completedTaskCount ?? 0,
        plannedTaskCount: opts.plannedTaskCount ?? 0,
        sentiment: opts.sentiment ?? null,
        reflection: opts.reflection ?? null,
        resultOfDay: opts.resultOfDay ?? null,
        managerComment: opts.managerComment ?? null,
        submittedAt: opts.submittedAt ?? null,
        reviewedAt: opts.reviewedAt ?? null,
        reviewedById: opts.reviewedById ?? null,
      },
    });
    if (opts.plannedTasks?.length) {
      await db.dsrPlannedTask.createMany({
        data: opts.plannedTasks.map((t, i) => ({
          dsrEntryId: entry.id, text: t.text,
          priority: t.priority ?? null, completed: t.completed, order: i,
        })),
      });
    }
    if (opts.additionalWorks?.length) {
      await db.dsrAdditionalWork.createMany({
        data: opts.additionalWorks.map((text, i) => ({ dsrEntryId: entry.id, text, order: i })),
      });
    }
    if (opts.resolvedBlockers?.length) {
      await db.dsrResolvedBlocker.createMany({
        data: opts.resolvedBlockers.map((b, i) => ({
          dsrEntryId: entry.id,
          text: b.text,
          resolved: b.resolved ?? true,
          order: i,
        })),
      });
    }
    if (opts.followUpsDone?.length) {
      await db.dsrFollowUpDone.createMany({
        data: opts.followUpsDone.map((f, i) => ({
          dsrEntryId: entry.id,
          text: f.text,
          completed: f.completed ?? true,
          order: i,
        })),
      });
    }
    if (opts.timelineEvents?.length) {
      await db.dsrTimelineEvent.createMany({
        data: opts.timelineEvents.map((e) => ({ dsrEntryId: entry.id, ...e })),
      });
    }
    return entry;
  }

  // 2026-05-25 Mon — REVIEWED
  await makeDsr(member.id, "2026-05-25", "REVIEWED", {
    completionPercent: 80, completedTaskCount: 4, plannedTaskCount: 5,
    sentiment: "BREAKTHROUGH",
    reflection: "Learned a lot about auth middleware patterns and how JWT session shape differs from DB schema.",
    resultOfDay: "Merged the auth refactor PR and unblocked the team.",
    managerComment: "Great work on the auth PR! Keep up the momentum.",
    submittedAt: new Date("2026-05-25T17:14:00Z"),
    reviewedAt: new Date("2026-05-25T17:23:00Z"),
    reviewedById: sarah.id,
    plannedTasks: [
      { text: "Implement auth middleware refactor", priority: "P1", completed: true },
      { text: "Write unit tests for login flow", priority: "P2", completed: true },
      { text: "Review PR backlog", priority: "P3", completed: true },
      { text: "Set up JWT session strategy", priority: "P2", completed: true },
      { text: "Document new auth patterns", priority: "P3", completed: false },
    ],
    additionalWorks: ["Helped Marcus debug a CSS issue in the dashboard"],
    resolvedBlockers: [{ text: "Waiting for approval on the DB migration plan from DevOps" }],
    followUpsDone: [{ text: "Sent recap to the design team" }, { text: "Updated documentation for v1.2" }],
    timelineEvents: [
      { type: "SUBMITTED", label: "Report Submitted", occurredAt: new Date("2026-05-25T17:14:00Z") },
      { type: "OPENED", label: "Manager Opened", occurredAt: new Date("2026-05-25T17:20:00Z") },
      { type: "APPROVED", label: "Manager Approved", occurredAt: new Date("2026-05-25T17:23:00Z") },
    ],
  });

  // 2026-05-26 Tue — REVIEWED
  await makeDsr(member.id, "2026-05-26", "REVIEWED", {
    completionPercent: 80, completedTaskCount: 4, plannedTaskCount: 5,
    sentiment: "BREAKTHROUGH",
    reflection: "Project Phoenix documentation is now comprehensive. Identified 3 critical middleware bugs.",
    resultOfDay: "Resolved critical bugs that were blocking the team.",
    managerComment: "Excellent — this unblocks the whole feature branch.",
    submittedAt: new Date("2026-05-26T17:14:00Z"),
    reviewedAt: new Date("2026-05-26T17:23:00Z"),
    reviewedById: sarah.id,
    plannedTasks: [
      { text: "Architecture documentation for Project Phoenix", priority: "P1", completed: true },
      { text: "Resolve 3 critical bugs in middleware", priority: "P1", completed: true },
      { text: "Code review for Alex's PR", priority: "P2", completed: true },
      { text: "Update sprint board", priority: "P3", completed: true },
      { text: "Pair session on PrismaAdapter edge cases", priority: "P2", completed: false },
    ],
    additionalWorks: ["Reviewed design specs for modal transitions"],
    resolvedBlockers: [{ text: "Waiting for API documentation from the Backend team" }],
    followUpsDone: [{ text: "Sent feedback on modal transitions to Marcus" }, { text: "Updated API spec notes" }],
    timelineEvents: [
      { type: "SUBMITTED", label: "Report Submitted", occurredAt: new Date("2026-05-26T17:14:00Z") },
      { type: "OPENED", label: "Manager Opened", occurredAt: new Date("2026-05-26T17:20:00Z") },
      { type: "APPROVED", label: "Manager Approved", occurredAt: new Date("2026-05-26T17:23:00Z") },
    ],
  });

  // 2026-05-27 Wed — PENDING_REVIEW
  await makeDsr(member.id, "2026-05-27", "PENDING_REVIEW", {
    completionPercent: 85, completedTaskCount: 6, plannedTaskCount: 7,
    sentiment: "BREAKTHROUGH",
    reflection: "Fixed the N+1 query issue. The reports page is now significantly faster.",
    resultOfDay: "Reports page p95 latency dropped from 2.1s to 0.4s after the query fix.",
    submittedAt: new Date("2026-05-27T17:14:00Z"),
    plannedTasks: [
      { text: "Investigate and fix N+1 query on reports page", priority: "P1", completed: true },
      { text: "Open PR for JWT auth migration", priority: "P1", completed: true },
      { text: "Write integration tests for protected routes", priority: "P2", completed: true },
      { text: "Finalize Marketing Deck", priority: "P1", completed: true },
      { text: "Client Sync call", priority: "P2", completed: true },
      { text: "Code Review for team PRs", priority: "P3", completed: true },
      { text: "Update deployment documentation", priority: "P3", completed: false },
    ],
    additionalWorks: ["Helped Alex debug staging environment config"],
    resolvedBlockers: [{ text: "Prisma adapter types conflict with NextAuth session shape — fixed by casting" }],
    followUpsDone: [{ text: "Sent recap to the design team" }, { text: "Updated documentation for v1.2" }],
    timelineEvents: [
      { type: "SUBMITTED", label: "Report Submitted", occurredAt: new Date("2026-05-27T17:14:00Z") },
    ],
  });

  // 2026-05-28 Thu — DRAFT (today, form pre-filled)
  await makeDsr(member.id, "2026-05-28", "DRAFT", {
    completionPercent: 0, completedTaskCount: 0, plannedTaskCount: 2,
    plannedTasks: [
      { text: "Complete DSM dashboard implementation", priority: "P1", completed: false },
      { text: "Write integration tests for protected routes", priority: "P2", completed: false },
    ],
  });

  // Previous week
  await db.dsrEntry.create({ data: { userId: member.id, date: d("2026-05-23"), status: "MISSED" } });

  await makeDsr(member.id, "2026-05-22", "REVIEWED", {
    completionPercent: 80, completedTaskCount: 4, plannedTaskCount: 5,
    sentiment: "BREAKTHROUGH",
    reflection: "Data layer abstraction is cleaner now. Team aligned on naming conventions.",
    resultOfDay: "Refactored Prisma calls into a typed data layer.",
    managerComment: "Good progress. The typed data layer will save the team time.",
    submittedAt: new Date("2026-05-22T17:14:00Z"),
    reviewedAt: new Date("2026-05-22T17:22:00Z"),
    reviewedById: sarah.id,
    plannedTasks: [
      { text: "Refactor Prisma calls into typed data layer", priority: "P1", completed: true },
      { text: "Remove direct db access from page files", priority: "P2", completed: true },
      { text: "Fix session expiry edge case", priority: "P1", completed: true },
      { text: "Code review for feature branch", priority: "P3", completed: true },
      { text: "Write test for session edge case", priority: "P2", completed: false },
    ],
    resolvedBlockers: [{ text: "Data layer abstraction needs alignment on naming conventions" }],
    followUpsDone: [{ text: "Review needed on the data layer design from Sarah" }, { text: "Updated API docs" }],
    timelineEvents: [
      { type: "SUBMITTED", label: "Report Submitted", occurredAt: new Date("2026-05-22T17:14:00Z") },
      { type: "OPENED", label: "Manager Opened", occurredAt: new Date("2026-05-22T17:19:00Z") },
      { type: "APPROVED", label: "Manager Approved", occurredAt: new Date("2026-05-22T17:22:00Z") },
    ],
  });

  await makeDsr(member.id, "2026-05-21", "REVIEWED", {
    completionPercent: 75, completedTaskCount: 3, plannedTaskCount: 4,
    sentiment: "BREAKTHROUGH",
    reflection: "Understanding of PrismaAdapter edge cases improved significantly.",
    resultOfDay: "Merged the auth refactor with full test coverage.",
    managerComment: "Good work. Ship it.",
    submittedAt: new Date("2026-05-21T17:10:00Z"),
    reviewedAt: new Date("2026-05-21T17:20:00Z"),
    reviewedById: sarah.id,
    plannedTasks: [
      { text: "Wire up PrismaAdapter with custom fields", priority: "P1", completed: true },
      { text: "Add role to JWT token", priority: "P2", completed: true },
      { text: "Pair session with Sarah on edge cases", priority: "P2", completed: true },
      { text: "Update sprint board", priority: "P3", completed: false },
    ],
    resolvedBlockers: [{ text: "NextAuth v5 beta docs are incomplete — researched community solutions" }],
    followUpsDone: [{ text: "Sent updated design mocks to Marcus" }],
    timelineEvents: [
      { type: "SUBMITTED", label: "Report Submitted", occurredAt: new Date("2026-05-21T17:10:00Z") },
      { type: "OPENED", label: "Manager Opened", occurredAt: new Date("2026-05-21T17:16:00Z") },
      { type: "APPROVED", label: "Manager Approved", occurredAt: new Date("2026-05-21T17:20:00Z") },
    ],
  });

  // ── DSR entries for other team members (for All Team DSR demo) ───────────────

  // Alex Rivera — SUBMITTED today (Tech team) — has a pending blocker for realism
  await db.dsrEntry.deleteMany({ where: { userId: alex.id } });
  await makeDsr(alex.id, "2026-05-28", "SUBMITTED", {
    completionPercent: 100, completedTaskCount: 4, plannedTaskCount: 4,
    sentiment: "BREAKTHROUGH",
    resultOfDay: "Completed token refresh logic and finalized the Auth service test suite.",
    reflection: "Automated handoff scripts are essential for scalability in the current project phase.",
    submittedAt: new Date("2026-05-28T18:31:00Z"),
    plannedTasks: [
      { text: "Sync Component Library", priority: "P1", completed: true },
      { text: "Client X Mockup v2", priority: "P2", completed: true },
      { text: "Team Standup Prep", priority: "P2", completed: true },
      { text: "Code Review - DS-104", priority: "P3", completed: true },
    ],
    additionalWorks: ["Reviewed Brand Guidelines document with design lead"],
    resolvedBlockers: [
      { text: "Backend API Documentation — waiting on authentication endpoint docs", resolved: false },
      { text: "Asset Sync Issue — Large asset uploads fixed in staging", resolved: true },
    ],
    followUpsDone: [
      { text: "Meeting with Backend Lead", completed: true },
      { text: "Review Sarah's PR", completed: false },
    ],
    timelineEvents: [
      { type: "SUBMITTED", label: "Report Submitted", occurredAt: new Date("2026-05-28T18:31:00Z") },
    ],
  });

  // Alex Rivera — previous week history (Mon–Wed reviewed)
  await makeDsr(alex.id, "2026-05-27", "REVIEWED", {
    completionPercent: 90, completedTaskCount: 9, plannedTaskCount: 10,
    sentiment: "BREAKTHROUGH",
    resultOfDay: "Completed auth API endpoint documentation and reviewed two PRs.",
    managerComment: "Solid output. The endpoint docs were blocking the frontend team.",
    submittedAt: new Date("2026-05-27T17:10:00Z"),
    reviewedAt: new Date("2026-05-27T17:30:00Z"),
    reviewedById: manager.id,
    plannedTasks: [
      { text: "Complete Auth API endpoint documentation", priority: "P1", completed: true },
      { text: "Review PR #204 for the login flow", priority: "P2", completed: true },
      { text: "Implement token refresh — part 1", priority: "P1", completed: true },
    ],
    resolvedBlockers: [{ text: "Staging environment config resolved after DevOps sync" }],
    followUpsDone: [{ text: "Sent endpoint docs to frontend team" }, { text: "Updated Notion sprint board" }],
    timelineEvents: [
      { type: "SUBMITTED", label: "Report Submitted", occurredAt: new Date("2026-05-27T17:10:00Z") },
      { type: "OPENED", label: "Manager Opened", occurredAt: new Date("2026-05-27T17:22:00Z") },
      { type: "APPROVED", label: "Manager Approved", occurredAt: new Date("2026-05-27T17:30:00Z") },
    ],
  });

  await makeDsr(alex.id, "2026-05-26", "REVIEWED", {
    completionPercent: 75, completedTaskCount: 3, plannedTaskCount: 4,
    sentiment: "BREAKTHROUGH",
    resultOfDay: "Merged the login flow PR and unblocked the QA team.",
    managerComment: "Good work. Keep the PRs small and focused.",
    submittedAt: new Date("2026-05-26T17:05:00Z"),
    reviewedAt: new Date("2026-05-26T17:20:00Z"),
    reviewedById: manager.id,
    plannedTasks: [
      { text: "Fix login edge case — remember-me flag", priority: "P1", completed: true },
      { text: "Write unit tests for refresh token", priority: "P2", completed: true },
      { text: "Update API changelog", priority: "P3", completed: true },
      { text: "Performance profiling on auth endpoints", priority: "P3", completed: false },
    ],
    resolvedBlockers: [{ text: "QA environment access granted by DevOps" }],
    followUpsDone: [{ text: "Notified QA team that login PR is merged" }],
    timelineEvents: [
      { type: "SUBMITTED", label: "Report Submitted", occurredAt: new Date("2026-05-26T17:05:00Z") },
      { type: "OPENED", label: "Manager Opened", occurredAt: new Date("2026-05-26T17:15:00Z") },
      { type: "APPROVED", label: "Manager Approved", occurredAt: new Date("2026-05-26T17:20:00Z") },
    ],
  });

  await db.dsrEntry.create({ data: { userId: alex.id, date: d("2026-05-25"), status: "MISSED" } });

  // Marcus Wright — SUBMITTED today (Creative team)
  await db.dsrEntry.deleteMany({ where: { userId: marcus.id } });
  await makeDsr(marcus.id, "2026-05-28", "SUBMITTED", {
    completionPercent: 100, completedTaskCount: 3, plannedTaskCount: 3,
    sentiment: "BREAKTHROUGH",
    resultOfDay: "Completed high-fidelity mockups for Client X and finalized the style guide.",
    reflection: "Design system component naming conventions are critical for developer handoff.",
    submittedAt: new Date("2026-05-28T18:31:00Z"),
    plannedTasks: [
      { text: "UI Revamp for Client X", priority: "P1", completed: true },
      { text: "Brand Deck Polish", priority: "P2", completed: true },
      { text: "Team Moodboard", priority: "P3", completed: true },
    ],
    followUpsDone: [{ text: "Shared final mockups with dev team" }],
    timelineEvents: [
      { type: "SUBMITTED", label: "Report Submitted", occurredAt: new Date("2026-05-28T18:31:00Z") },
    ],
  });

  // Rohan Mehta — SUBMITTED today (Creative team, delayed)
  await db.dsrEntry.deleteMany({ where: { userId: rohan.id } });
  await makeDsr(rohan.id, "2026-05-28", "SUBMITTED", {
    completionPercent: 75, completedTaskCount: 3, plannedTaskCount: 4,
    sentiment: "BREAKTHROUGH",
    resultOfDay: "Completed design system audit and icon set review.",
    reflection: "Icon naming conventions matter for design-to-dev handoff consistency.",
    submittedAt: new Date("2026-05-28T19:15:00Z"),
    plannedTasks: [
      { text: "Design System Audit", priority: "P1", completed: true },
      { text: "Icon Set Review", priority: "P2", completed: true },
      { text: "Component Documentation", priority: "P2", completed: true },
      { text: "Accessibility Review", priority: "P3", completed: false },
    ],
    timelineEvents: [
      { type: "SUBMITTED", label: "Report Submitted", occurredAt: new Date("2026-05-28T19:15:00Z") },
    ],
  });

  // Elena Rossi — SUBMITTED today (Marketing + Creative team)
  await db.dsrEntry.deleteMany({ where: { userId: elena.id } });
  await makeDsr(elena.id, "2026-05-28", "SUBMITTED", {
    completionPercent: 100, completedTaskCount: 2, plannedTaskCount: 2,
    sentiment: "BREAKTHROUGH",
    resultOfDay: "Finalised Q3 content strategy and launched the A/B test for homepage banner.",
    reflection: "Data-backed content decisions lead to better campaign performance.",
    submittedAt: new Date("2026-05-28T17:55:00Z"),
    plannedTasks: [
      { text: "Finalise Q3 content strategy", priority: "P1", completed: true },
      { text: "Set up A/B test for homepage banner", priority: "P2", completed: true },
    ],
    followUpsDone: [{ text: "Shared Q3 strategy with Sarah for feedback" }],
    timelineEvents: [
      { type: "SUBMITTED", label: "Report Submitted", occurredAt: new Date("2026-05-28T17:55:00Z") },
    ],
  });

  // Priya Sharma — no DSR today (pending)
  await db.dsrEntry.deleteMany({ where: { userId: priya.id } });

  // Sarah Jenkins — no DSR today (pending)
  await db.dsrEntry.deleteMany({ where: { userId: sarah.id } });

  console.log("Seeded DSR entries.");

  // ── Extra blockers for My Blockers page demo ──────────────────────────────
  // Enrich existing standup entries with additional, varied blockers

  // Member (Test Member) — add extra blockers on the May 27 entry to show pagination
  const memberEntry27 = await db.standupEntry.findUnique({
    where: { userId_date: { userId: member.id, date: d("2026-05-27") } },
    select: { id: true },
  });

  if (memberEntry27) {
    // Some already exist from makeEntry; add more with varied resolved states
    await db.standupBlocker.createMany({
      data: [
        { text: "DevSecOps has not yet granted access to the OAuth keys for the Staging environment. CI pipeline is blocked.", priority: "HIGH", resolved: false, entryId: memberEntry27.id },
        { text: "Mobile UI mockups for the checkout flow are pending final design review before dev can begin.", priority: "MEDIUM", resolved: true, entryId: memberEntry27.id },
        { text: "Environment refresh is taking longer than expected — testing environment is paused.", priority: "LOW", resolved: true, entryId: memberEntry27.id },
        { text: "API contract changes from backend are not yet documented. Frontend cannot proceed with integration.", priority: "HIGH", resolved: false, entryId: memberEntry27.id },
        { text: "Third-party analytics SDK has a version conflict with our current build tooling.", priority: "MEDIUM", resolved: true, entryId: memberEntry27.id },
        { text: "Waiting for legal sign-off on the updated privacy policy copy before the feature can ship.", priority: "LOW", resolved: false, entryId: memberEntry27.id },
        { text: "Load balancer config changes need DevOps approval — production deployment on hold.", priority: "HIGH", resolved: true, entryId: memberEntry27.id },
      ],
    });
  }

  // Alex — extra blockers on May 27 entry
  const alexEntry27 = await db.standupEntry.findUnique({
    where: { userId_date: { userId: alex.id, date: d("2026-05-27") } },
    select: { id: true },
  });
  if (alexEntry27) {
    await db.standupBlocker.createMany({
      data: [
        { text: "Backend API Documentation for the authentication endpoints is still pending from the platform team.", priority: "HIGH", resolved: false, entryId: alexEntry27.id },
        { text: "Large asset uploads were broken in staging — fixed after coordinating with the infra team.", priority: "MEDIUM", resolved: true, entryId: alexEntry27.id },
        { text: "QA environment firewall rules blocking automated test runner. DevOps ticket raised.", priority: "MEDIUM", resolved: false, entryId: alexEntry27.id },
      ],
    });
  }

  // Marcus — extra blockers on May 27 entry
  const marcusEntry27 = await db.standupEntry.findUnique({
    where: { userId_date: { userId: marcus.id, date: d("2026-05-27") } },
    select: { id: true },
  });
  if (marcusEntry27) {
    await db.standupBlocker.createMany({
      data: [
        { text: "Client brand guidelines PDF is outdated. Waiting for updated assets from the client's marketing team.", priority: "HIGH", resolved: false, entryId: marcusEntry27.id },
        { text: "Figma file permissions need to be updated before the dev team can inspect the handoff.", priority: "LOW", resolved: true, entryId: marcusEntry27.id },
      ],
    });
  }

  // ── Extra support needs for Support Needed page demo ─────────────────────
  if (memberEntry27) {
    await db.standupSupportNeed.createMany({
      data: [
        { text: "The frontend team is unable to proceed with Auth module integration tests. The DevSecOps team has been notified, but the ticket is currently unassigned.", mentionedUserId: sarah.id, resolved: false, order: 10, entryId: memberEntry27.id },
        { text: "Need a quick 30-min sync with Alex to review the API spec before implementation begins.", mentionedUserId: alex.id, resolved: true, order: 11, entryId: memberEntry27.id },
        { text: "Requesting a code review from Sarah on the auth middleware refactor PR #204. Blocking next steps.", mentionedUserId: sarah.id, resolved: false, order: 12, entryId: memberEntry27.id },
        { text: "Marketing deck needs final approval from manager before it can be shared with the client.", mentionedUserId: manager.id, resolved: true, order: 13, entryId: memberEntry27.id },
        { text: "Need Marcus to provide the updated design tokens export for the component library.", mentionedUserId: marcus.id, resolved: false, order: 14, entryId: memberEntry27.id },
        { text: "Waiting on Elena to share the Q3 content calendar so we can align the product release schedule.", mentionedUserId: elena.id, resolved: true, order: 15, entryId: memberEntry27.id },
        { text: "Environment refresh is paused — need DevOps (Sarah) to restart the staging cluster.", mentionedUserId: sarah.id, resolved: false, order: 16, entryId: memberEntry27.id },
      ],
    });
  }

  if (alexEntry27) {
    await db.standupSupportNeed.createMany({
      data: [
        { text: "Need Sarah to review the auth token refresh implementation before merging to main.", mentionedUserId: sarah.id, resolved: false, order: 5, entryId: alexEntry27.id },
        { text: "Requesting Test Member to pair on the database query optimisation this afternoon.", mentionedUserId: member.id, resolved: true, order: 6, entryId: alexEntry27.id },
      ],
    });
  }

  console.log("Seeded extra blockers and support needs.");

  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
