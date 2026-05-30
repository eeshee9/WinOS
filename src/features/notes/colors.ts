/** Soft pastel tints — light enough to stay readable, distinct enough to scan quickly. */
export const NOTE_COLORS = [
  { value: "",        label: "None"   },
  { value: "#fef9c3", label: "Yellow" },
  { value: "#dcfce7", label: "Green"  },
  { value: "#dbeafe", label: "Blue"   },
  { value: "#fce7f3", label: "Pink"   },
  { value: "#f3e8ff", label: "Purple" },
  { value: "#ffedd5", label: "Orange" },
] as const;

export type NoteColorValue = (typeof NOTE_COLORS)[number]["value"];
