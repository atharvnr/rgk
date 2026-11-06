import { formatNumber } from "../src/utils/formatNumber";

describe("formatNumber", () => {
  it("adds thousands separators", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
    expect(formatNumber(999)).toBe("999");
    expect(formatNumber(0)).toBe("0");
  });

  it("keeps one decimal when asked and drops .0", () => {
    expect(formatNumber(1234.5, 1)).toBe("1,234.5");
    expect(formatNumber(1234, 1)).toBe("1,234");
    expect(formatNumber(1234.04, 1)).toBe("1,234");
    expect(formatNumber(12.96, 1)).toBe("13");
  });

  it("treats non-finite input as zero", () => {
    expect(formatNumber(Number.NaN)).toBe("0");
  });
});
