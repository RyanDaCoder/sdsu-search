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
