import type { RopeEntry } from "./store";
import { formatLocalDate } from "./dates";

export function filterEntries(entries: RopeEntry[], query: string, date = "", status = ""): RopeEntry[] {
  const normalized = query.toLowerCase().trim();
  return entries.filter(entry => {
    const matchesQuery = !normalized || [entry.revelationVerse, entry.revelationText, entry.observation, entry.prayer, entry.execution, entry.executionReflection]
      .some(text => (text || "").toLowerCase().includes(normalized));
    const matchesDate = !date || formatLocalDate(new Date(entry.createdAt)) === date;
    const matchesStatus = !status || (status === "pending" ? entry.executionStatus === null : entry.executionStatus === status);
    return matchesQuery && matchesDate && matchesStatus;
  });
}
