import { TeamEvent } from "@/src/api";

const pad = (n: number) => String(n).padStart(2, "0");

function stampUTC(d: Date) {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function esc(s?: string | null) {
  return (s || "").replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

// Builds a standard iCalendar (.ics) file compatible with Google/Apple/Outlook.
export function buildIcs(events: TeamEvent[]): string {
  const now = stampUTC(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TuS Oberhausen II//Team App//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:TuS Oberhausen II",
  ];

  for (const e of events) {
    const [y, m, d] = e.date.split("-").map(Number);
    const [hh, mm] = e.time.split(":").map(Number);
    const start = `${e.date.replace(/-/g, "")}T${pad(hh)}${pad(mm)}00`;
    const endD = new Date(y, m - 1, d, hh, mm + 90);
    const end =
      `${endD.getFullYear()}${pad(endD.getMonth() + 1)}${pad(endD.getDate())}` +
      `T${pad(endD.getHours())}${pad(endD.getMinutes())}00`;
    const base = e.type === "Spiel" ? `Spiel: ${e.title}` : e.type;
    const summary = e.cancelled ? `ABGESAGT: ${base}` : base;

    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@tus-oberhausen`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${esc(summary)}`
    );
    if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
    // Cancelled events are marked so calendars grey them out / remove them.
    if (e.cancelled) lines.push("STATUS:CANCELLED", "METHOD:CANCEL");
    lines.push(`CATEGORIES:${e.type}`, "END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
