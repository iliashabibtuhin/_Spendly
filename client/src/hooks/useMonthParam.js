import { useSearchParams } from "react-router";
import { thisMonth } from "../lib/format";

/** Selected month kept in the ?month= query param (defaults to the current month). */
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function useMonthParam() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("month");
  const month = raw && MONTH_RE.test(raw) && raw <= thisMonth() ? raw : thisMonth();
  const setMonth = (m) =>
    setParams(
      (p) => {
        if (m === thisMonth()) p.delete("month");
        else p.set("month", m);
        return p;
      },
      { replace: true },
    );
  return [month, setMonth];
}
