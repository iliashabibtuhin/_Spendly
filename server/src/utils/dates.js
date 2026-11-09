// All transaction dates are stored as UTC midnight of their calendar day, so
// month and day boundaries are computed in UTC as well.

/** "2026-11-04" -> Date at 2026-11-04T00:00:00Z */
export const parseDay = (day) => new Date(`${day}T00:00:00.000Z`);

/** Date -> "2026-11-04" */
export const formatDay = (date) => date.toISOString().slice(0, 10);

/** "2026-11" -> { start, end } where end is exclusive */
export function monthRange(month) {
  const [y, m] = month.split("-").map(Number);
  return {
    start: new Date(Date.UTC(y, m - 1, 1)),
    end: new Date(Date.UTC(y, m, 1)),
  };
}

/** "2026-11", -2 -> "2026-09" */
export function shiftMonth(month, delta) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export const currentMonth = () => new Date().toISOString().slice(0, 7);
