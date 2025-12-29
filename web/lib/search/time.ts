export function minToTimeLabel(min: number): string {
  const h24 = Math.floor(min / 60);
  const m = min % 60;

  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = ((h24 + 11) % 12) + 1;

  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function timeInputToMin(value: string): number | undefined {
  // "HH:MM" from <input type="time" />
  if (!value) return undefined;
  const [h, m] = value.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return undefined;
  return h * 60 + m;
}

export function minToTimeInput(min: number | undefined): string {
  if (typeof min !== "number") return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Parse a time string to minutes from midnight.
 * Supports formats like:
 * - "945" -> 9:45 AM (585 minutes)
 * - "1345" -> 1:45 PM (825 minutes)
 * - "9:45" -> 9:45 AM
 * - "13:45" -> 1:45 PM
 * - "945am" -> 9:45 AM
 * - "945pm" -> 9:45 PM
 * - "9:45am" -> 9:45 AM
 * - "9:45pm" -> 9:45 PM
 * Returns undefined if invalid.
 */
export function parseTimeString(value: string): number | undefined {
  if (!value) return undefined;
  
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return undefined;

  // Check for AM/PM suffix
  let hasAm = trimmed.includes("am");
  let hasPm = trimmed.includes("pm");
  const cleanValue = trimmed.replace(/[ap]m/g, "").trim();

  // Remove colons
  const digitsOnly = cleanValue.replace(/:/g, "");

  // Must be all digits
  if (!/^\d+$/.test(digitsOnly)) return undefined;

  let hours: number;
  let minutes: number;

  if (digitsOnly.length <= 2) {
    // Just hours, e.g., "9" -> 9:00
    hours = parseInt(digitsOnly, 10);
    minutes = 0;
  } else if (digitsOnly.length === 3) {
    // Format: "945" -> 9:45
    hours = parseInt(digitsOnly[0], 10);
    minutes = parseInt(digitsOnly.slice(1), 10);
  } else if (digitsOnly.length === 4) {
    // Format: "0945" or "1345" -> 09:45 or 13:45
    hours = parseInt(digitsOnly.slice(0, 2), 10);
    minutes = parseInt(digitsOnly.slice(2), 10);
  } else {
    // Too many digits
    return undefined;
  }

  // Validate ranges
  if (hours < 0 || hours > 23) return undefined;
  if (minutes < 0 || minutes > 59) return undefined;

  // Handle AM/PM
  if (hasAm || hasPm) {
    if (hasAm && hasPm) return undefined; // Can't have both
    if (hours === 0 || hours > 12) return undefined; // Invalid for 12-hour format
    
    if (hasAm) {
      // AM: 12am -> 0, 1am -> 1, ..., 11am -> 11
      if (hours === 12) hours = 0;
    } else {
      // PM: 12pm -> 12, 1pm -> 13, ..., 11pm -> 23
      if (hours !== 12) hours += 12;
    }
  } else {
    // No AM/PM specified - assume 24-hour format if hours > 12, otherwise assume AM
    if (hours <= 12) {
      // Could be ambiguous, but we'll treat as 24-hour if it's clearly > 12
      // Actually, let's be smart: if user types "945", they probably mean 9:45 AM
      // If they type "1345", they probably mean 1:45 PM (13:45)
      // So we'll use 24-hour format as-is
    }
  }

  return hours * 60 + minutes;
}

/**
 * Format minutes to a simple display string.
 * Examples: 585 -> "945", 825 -> "1345", 540 -> "900"
 */
export function minToTimeString(min: number | undefined): string {
  if (typeof min !== "number") return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) {
    return String(h);
  }
  return `${h}${String(m).padStart(2, "0")}`;
}