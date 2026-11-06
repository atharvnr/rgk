/**
 * Formats a number with thousands separators and up to `maxDecimals`
 * decimals, dropping a fractional part that rounds to zero.
 *   formatNumber(1234.5, 1) -> "1,234.5"
 *   formatNumber(1234.0, 1) -> "1,234"
 * Implemented by hand so output is identical on Hermes, JSC and browsers.
 */
export function formatNumber(value: number, maxDecimals = 0): string {
  if (!Number.isFinite(value)) return "0";
  const [whole, fraction = ""] = value.toFixed(maxDecimals).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const trimmed = fraction.replace(/0+$/, "");
  return trimmed ? `${grouped}.${trimmed}` : grouped;
}
