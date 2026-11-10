import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Table2 } from "lucide-react";
import { formatCompact, formatMoney, formatMonth, formatShortMonth } from "../../lib/format";
import { SegmentedControl } from "../ui/SegmentedControl";

const VIEWS = [
  { value: "chart", label: "Chart", icon: BarChart3 },
  { value: "table", label: "Table", icon: Table2 },
];

const SERIES = [
  { key: "income", label: "Income", color: "#0E9F6E" },
  { key: "expense", label: "Expenses", color: "#E5484D" },
];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm shadow-pop">
      <p className="mb-1.5 font-bold">{formatMonth(label)}</p>
      {SERIES.map((s) => {
        const value = payload.find((p) => p.dataKey === s.key)?.value ?? 0;
        return (
          <p key={s.key} className="flex items-center gap-2 text-ink-soft">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
            {s.label}
            <span className="ml-auto pl-4 font-bold text-ink">{formatMoney(value)}</span>
          </p>
        );
      })}
    </div>
  );
}

export function TrendChart({ data, selectedMonth }) {
  const [view, setView] = useState("chart");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6">
        <div className="flex items-center gap-4 text-[13px] font-medium text-ink-soft">
          {SERIES.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
              {s.label}
            </span>
          ))}
        </div>
        <SegmentedControl label="Trend view" size="sm" value={view} onChange={setView} options={VIEWS} />
      </div>

      {view === "chart" ? (
        <div className="h-72 px-2 pt-5 sm:px-3" role="img" aria-label="Income and expenses for the last six months">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={2} barCategoryGap="28%" margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#ECEBF3" strokeDasharray="4 4" />
              <XAxis
                dataKey="month"
                tickFormatter={formatShortMonth}
                tickLine={false}
                axisLine={false}
                tick={({ x, y, payload }) => (
                  <text
                    x={x}
                    y={y + 12}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={payload.value === selectedMonth ? 700 : 500}
                    fill={payload.value === selectedMonth ? "#1C1A3A" : "#8E8DA8"}
                  >
                    {formatShortMonth(payload.value)}
                  </text>
                )}
              />
              <YAxis
                tickFormatter={formatCompact}
                tickLine={false}
                axisLine={false}
                width={56}
                tick={{ fontSize: 12, fill: "#8E8DA8" }}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#F1F0F8", radius: 8 }} />
              {SERIES.map((s) => (
                <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={26} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="overflow-x-auto px-5 pt-3 sm:px-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-faint">
                <th className="py-2 font-semibold">Month</th>
                <th className="py-2 text-right font-semibold">Income</th>
                <th className="py-2 text-right font-semibold">Expenses</th>
                <th className="py-2 text-right font-semibold">Net</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.month} className="border-b border-line/60 last:border-0">
                  <td className={`py-2.5 ${row.month === selectedMonth ? "font-bold" : ""}`}>{formatMonth(row.month)}</td>
                  <td className="py-2.5 text-right">{formatMoney(row.income)}</td>
                  <td className="py-2.5 text-right">{formatMoney(row.expense)}</td>
                  <td className="py-2.5 text-right font-semibold">{formatMoney(row.income - row.expense, { sign: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
