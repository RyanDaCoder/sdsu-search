import type { ScheduleItem } from "./types";
import { minToTimeLabel } from "@/lib/search/time";

/**
 * Export schedule as plain text.
 */
export function exportScheduleAsText(items: ScheduleItem[]): string {
  if (items.length === 0) return "Empty schedule";

  let text = "SDSU Course Schedule\n";
  text += "=".repeat(50) + "\n\n";

  items.forEach((item) => {
    text += `${item.courseCode}${item.courseTitle ? ` - ${item.courseTitle}` : ""}\n`;
    if (item.termCode) {
      text += `Term: ${item.termCode}\n`;
    }

    if (item.meetings && item.meetings.length > 0) {
      text += "Meetings:\n";
      item.meetings.forEach((m) => {
        if (m.days && m.startMin != null && m.endMin != null) {
          text += `  ${m.days} ${minToTimeLabel(m.startMin)}–${minToTimeLabel(m.endMin)}`;
          if (m.location) {
            text += ` @ ${m.location}`;
          }
          text += "\n";
        } else if (m.days === "TBA") {
          text += `  TBA\n`;
        }
      });
    }

    text += "\n";
  });

  return text;
}

/**
 * Export schedule as JSON.
 */
export function exportScheduleAsJson(items: ScheduleItem[]): string {
  return JSON.stringify(
    items.map((item) => ({
      courseCode: item.courseCode,
      courseTitle: item.courseTitle,
      termCode: item.termCode,
      sectionId: item.sectionId,
      meetings: item.meetings.map((m) => ({
        days: m.days,
        startMin: m.startMin,
        endMin: m.endMin,
        location: m.location,
      })),
    })),
    null,
    2
  );
}

/**
 * Export schedule as iCal format (basic).
 */
export function exportScheduleAsIcal(items: ScheduleItem[]): string {
  const now = new Date();
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  let ical = "BEGIN:VCALENDAR\n";
  ical += "VERSION:2.0\n";
  ical += "PRODID:-//SDSU Search//Course Schedule//EN\n";
  ical += "CALSCALE:GREGORIAN\n";

  items.forEach((item, idx) => {
    item.meetings?.forEach((m, meetingIdx) => {
      if (!m.days || m.days === "TBA" || m.startMin == null || m.endMin == null) return;

      const uid = `schedule-${item.sectionId}-${meetingIdx}@sdsu-search`;
      const summary = `${item.courseCode}${item.courseTitle ? ` - ${item.courseTitle}` : ""}`;
      const location = m.location || "";

      // For simplicity, use current week (Monday)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      monday.setHours(0, 0, 0, 0);

      // Map day codes to day offset
      const dayMap: Record<string, number> = { M: 0, T: 1, W: 2, R: 3, F: 4 };
      const dayOffset = dayMap[m.days[0]] ?? 0;

      const eventDate = new Date(monday);
      eventDate.setDate(monday.getDate() + dayOffset);

      const startHour = Math.floor(m.startMin / 60);
      const startMin = m.startMin % 60;
      const endHour = Math.floor(m.endMin / 60);
      const endMin = m.endMin % 60;

      const dtstart = new Date(eventDate);
      dtstart.setHours(startHour, startMin, 0, 0);

      const dtend = new Date(eventDate);
      dtend.setHours(endHour, endMin, 0, 0);

      ical += "BEGIN:VEVENT\n";
      ical += `UID:${uid}\n`;
      ical += `DTSTAMP:${formatDate(now)}\n`;
      ical += `DTSTART:${formatDate(dtstart)}\n`;
      ical += `DTEND:${formatDate(dtend)}\n`;
      ical += `SUMMARY:${summary}\n`;
      if (location) {
        ical += `LOCATION:${location}\n`;
      }
      ical += `DESCRIPTION:Section ${item.sectionId}\n`;
      ical += "END:VEVENT\n";
    });
  });

  ical += "END:VCALENDAR\n";
  return ical;
}

/**
 * Download file with given content and filename.
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

