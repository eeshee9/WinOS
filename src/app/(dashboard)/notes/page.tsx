import { auth } from "@/lib/auth";

export default async function NotesPage() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Notes</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {session?.user?.name ?? session?.user?.email}
      </p>
      {/* TODO: NoteEditor + NoteList from @/features/notes */}
    </div>
  );
}
