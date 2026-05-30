"use client";

import { useEffect, useState } from "react";

export function ClockChip() {
  const [time, setTime] = useState("");

  useEffect(() => {
    function tick() {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;

  return (
    <div className="flex items-center rounded-full border bg-card px-3 py-1.5 text-xs font-medium tabular-nums shadow-sm">
      {time}
    </div>
  );
}
