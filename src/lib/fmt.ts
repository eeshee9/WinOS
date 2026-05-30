/** Format a wait duration in seconds to a human-readable string. */
export function fmtWait(seconds: number): string {
  if (seconds <= 60) return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  const mins = Math.ceil(seconds / 60);
  return `${mins} minute${mins !== 1 ? "s" : ""}`;
}
