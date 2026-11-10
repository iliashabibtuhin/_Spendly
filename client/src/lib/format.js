// BDT amounts use South Asian digit grouping (1,00,000), as is customary in Bangladesh.
const numberFmt = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const compactFmt = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });

export const CURRENCY_SYMBOL = "৳";

export function formatMoney(amount, { sign = false } = {}) {
  const value = Number(amount) || 0;
  const prefix = sign ? (value > 0 ? "+" : value < 0 ? "−" : "") : value < 0 ? "−" : "";
  return `${prefix}${CURRENCY_SYMBOL}${numberFmt.format(Math.abs(value))}`;
}

export const formatCompact = (amount) => `${CURRENCY_SYMBOL}${compactFmt.format(amount)}`;

/** Signed amount for a transaction: income positive, expense negative. */
export const formatTxAmount = (tx) => formatMoney(tx.type === "INCOME" ? tx.amount : -tx.amount, { sign: true });

// Transaction dates are calendar days ("YYYY-MM-DD"). They are formatted from
// the string itself, so the day never shifts with the viewer's timezone.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const parts = (s) => s.split("-").map(Number);

/** "2026-11-04" -> "4 Nov 2026" */
export function formatDay(day) {
  const [y, m, d] = parts(day);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
/** "2026-11" -> "November 2026" */
export function formatMonth(month) {
  const [y, m] = parts(month);
  return `${LONG_MONTHS[m - 1]} ${y}`;
}
/** "2026-11" -> "Nov" */
export const formatShortMonth = (month) => MONTHS[parts(month)[1] - 1];

const pad = (n) => String(n).padStart(2, "0");

/** Today's date in the user's local timezone as YYYY-MM-DD. */
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export const thisMonth = () => today().slice(0, 7);

export function shiftMonth(month, delta) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

/** Last calendar day of a month, YYYY-MM-DD. */
export function monthEnd(month) {
  const [y, m] = month.split("-").map(Number);
  return `${month}-${pad(new Date(Date.UTC(y, m, 0)).getUTCDate())}`;
}
