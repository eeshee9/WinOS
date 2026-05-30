import { auth } from "@/lib/auth";
import { getNotes, getNotebooks, NewNoteForm, NotesList } from "@/features/notes";

export default async function NotesPage() {
  const [session, notes, notebooks] = await Promise.all([
    auth(),
    getNotes(),
    getNotebooks(),
  ]);

  const isManager = session?.user?.role === "MANAGER";
  const userId = session?.user?.id ?? "";

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Notes</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {isManager
            ? "All team notes — you can see everyone's notes as manager."
            : "Your personal notes. Only you can see these."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside>
          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-4 text-sm font-medium">New note</h2>
            <NewNoteForm notebooks={notebooks} />
          </div>
        </aside>

        <section>
          <NotesList
            notes={notes}
            notebooks={notebooks}
            isManager={isManager}
            userId={userId}
          />
        </section>
      </div>
    </div>
  );
}
