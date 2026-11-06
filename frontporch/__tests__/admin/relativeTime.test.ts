import {
  formatShortDate,
  parseServerDate,
  relativeTime,
} from "../../src/utils/relativeTime";

const NOW = Date.UTC(2026, 10, 5, 12, 0, 0); // 2026-11-05T12:00:00Z
const ago = (ms: number) => new Date(NOW - ms).toISOString();

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("relativeTime", () => {
  it.each([
    [0, "just now"],
    [30 * 1000, "just now"],
    [MINUTE, "1m ago"],
    [5 * MINUTE, "5m ago"],
    [59 * MINUTE, "59m ago"],
    [HOUR, "1h ago"],
    [3 * HOUR, "3h ago"],
    [23 * HOUR, "23h ago"],
    [DAY, "1d ago"],
    [3 * DAY, "3d ago"],
    [6 * DAY, "6d ago"],
    [7 * DAY, "1w ago"],
    [14 * DAY, "2w ago"],
    [45 * DAY, "1mo ago"],
    [200 * DAY, "6mo ago"],
    [400 * DAY, "1y ago"],
    [800 * DAY, "2y ago"],
  ])("%d ms ago reads %s", (ms, expected) => {
    expect(relativeTime(ago(ms), NOW)).toBe(expected);
  });

  it("treats future times (clock skew) as just now", () => {
    expect(relativeTime(new Date(NOW + 5 * MINUTE).toISOString(), NOW)).toBe("just now");
  });

  it("accepts Date and epoch values, and a Date for now", () => {
    expect(relativeTime(new Date(NOW - 2 * HOUR), new Date(NOW))).toBe("2h ago");
    expect(relativeTime(NOW - 2 * DAY, NOW)).toBe("2d ago");
  });

  it("reads a zone-less server datetime as UTC", () => {
    expect(relativeTime("2026-11-05T09:00:00", NOW)).toBe("3h ago");
    expect(relativeTime("2026-11-02T11:59:59.123456", NOW)).toBe("3d ago");
  });

  it("respects an explicit offset", () => {
    // 14:30 at +05:30 is 09:00Z.
    expect(relativeTime("2026-11-05T14:30:00+05:30", NOW)).toBe("3h ago");
  });

  it("returns an empty string for unparseable input", () => {
    expect(relativeTime("", NOW)).toBe("");
    expect(relativeTime("not a date", NOW)).toBe("");
  });
});

describe("parseServerDate", () => {
  it("appends Z only when the value has a time and no zone", () => {
    expect(parseServerDate("2026-11-05T12:00:00")?.getTime()).toBe(NOW);
    expect(parseServerDate("2026-11-05T12:00:00Z")?.getTime()).toBe(NOW);
    expect(parseServerDate("2026-11-05T13:00:00+01:00")?.getTime()).toBe(NOW);
  });

  it("trims Python microseconds to milliseconds", () => {
    expect(parseServerDate("2026-11-05T12:00:00.123456")?.getTime()).toBe(NOW + 123);
    expect(parseServerDate("2026-11-05T12:00:00.123456+00:00")?.getTime()).toBe(NOW + 123);
  });

  it("returns null for invalid values", () => {
    expect(parseServerDate("nope")).toBeNull();
    expect(parseServerDate(new Date(NaN))).toBeNull();
  });
});

describe("formatShortDate", () => {
  it("formats as Mon D, YYYY", () => {
    expect(formatShortDate("2026-11-05T12:00:00Z")).toBe("Nov 5, 2026");
    expect(formatShortDate("2025-01-15T12:00:00")).toBe("Jan 15, 2025");
  });

  it("returns an empty string for invalid input", () => {
    expect(formatShortDate("garbage")).toBe("");
  });
});
