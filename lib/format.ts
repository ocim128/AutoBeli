/**
 * Locale-aware formatting helpers. Single source of truth so prices, dates,
 * and order identifiers render consistently across storefront and admin.
 */

const IDR_LOCALE = "id-ID";

/** Format an IDR amount with the canonical `Rp 1.234` spacing. */
export function formatIDR(amount: number): string {
  return `Rp ${amount.toLocaleString(IDR_LOCALE)}`;
}

/** Format a Date (or ISO string) for display. Defaults to id-ID; pass `en-GB` for English. */
export function formatDate(
  value: Date | string,
  locale: string = IDR_LOCALE,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
): string {
  return new Date(value).toLocaleDateString(locale, options);
}

/**
 * Short, human-friendly order identifier. Order IDs are long MongoDB/ObjectId
 * strings; we show the last 6 chars uppercased everywhere they appear to a
 * customer. Use the full ID only inside copy-to-clipboard / admin contexts.
 */
export function shortOrderId(orderId: string): string {
  return orderId.replace(/-/g, "").slice(-6).toUpperCase();
}
