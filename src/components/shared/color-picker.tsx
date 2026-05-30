"use client";

import { cn } from "@/lib/utils";
import { NOTE_COLORS } from "@/features/notes/colors";

type ColorPickerProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Note color">
      {NOTE_COLORS.map(({ value: v, label }) => (
        <button
          key={v || "none"}
          type="button"
          role="radio"
          aria-checked={value === v}
          title={label}
          onClick={() => onChange(v)}
          className={cn(
            "h-5 w-5 rounded-full border-2 transition-transform",
            value === v
              ? "scale-110 border-foreground/50"
              : "border-transparent hover:border-foreground/25"
          )}
          style={{
            backgroundColor: v || "transparent",
            // "None" swatch: dashed outline so it reads as an empty choice
            outline: v === "" ? "1.5px dashed hsl(var(--muted-foreground) / 0.4)" : undefined,
            outlineOffset: v === "" ? "-2px" : undefined,
          }}
        />
      ))}
    </div>
  );
}
