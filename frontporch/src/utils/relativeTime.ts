const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// An ISO datetime that already says which zone it is in.
const HAS_ZONE = /(Z|[+-]\d{2}:?\d{2})$/i;
const HAS_TIME = /T\d{2}:\d{2}/;
const FRACTION = /(\.\d{3})\d+/;

/**
 * Parses a datetime from the API. Mongo hands back naive UTC datetimes, which
 * the server serialises without a zone ("2026-11-02T10:00:00"); JavaScript
 * would read those as local time, so they are treated as UTC here.
 */
export function parseServerDate(value: string | number | Date): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  // Python sends microseconds; not every JS engine parses more than 3 digits.
  const text = value.trim().replace(FRACTION, "$1");
  if (!text) return null;
  const iso = HAS_TIME.test(text) && !HAS_ZONE.test(text) ? `${text}Z` : text;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Short relative time for lists: "just now", "5m ago", "3h ago", "3d ago",
 * "2w ago", "4mo ago", "1y ago". Future times (clock skew) read "just now".
 * Returns "" for a value that cannot be parsed.
 */
export function relativeTime(
  value: string | number | Date,
  now: number | Date = Date.now()
): string {
  const date = parseServerDate(value);
  if (!date) return "";
  const nowMs = typeof now === "number" ? now : now.getTime();
  const diff = nowMs - date.getTime();

  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < WEEK) return `${Math.floor(diff / DAY)}d ago`;
  if (diff < MONTH) return `${Math.floor(diff / WEEK)}w ago`;
  if (diff < YEAR) return `${Math.floor(diff / MONTH)}mo ago`;
  return `${Math.floor(diff / YEAR)}y ago`;
}

/**
 * "Nov 5, 2026" in the device's local zone. Built by hand so the output is the
 * same on Hermes, JSC and browsers. Returns "" for a value that cannot be
 * parsed.
 */
export function formatShortDate(value: string | number | Date): string {
  const date = parseServerDate(value);
  if (!date) return "";
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
