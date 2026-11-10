import { ArrowDownLeft, ArrowRight, ArrowUpRight, BarChart3, PieChart, Plus, ReceiptText, Target } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router";
import { BudgetProgress } from "../components/dashboard/BudgetProgress";
import { CategoryBreakdown } from "../components/dashboard/CategoryBreakdown";
import { BalanceCard, Delta, StatCard } from "../components/dashboard/StatCard";
import { TrendChart } from "../components/dashboard/TrendChart";
import { TransactionListItem } from "../components/transactions/TransactionListItem";
import { Button, buttonClass } from "../components/ui/Button";
import { Card, CardHeader, cardLinkClass } from "../components/ui/Card";
import { MonthPicker } from "../components/ui/MonthPicker";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState, ErrorState, Skeleton } from "../components/ui/States";
import { useAuth } from "../context/AuthContext";
import { useTransactionModal } from "../context/TransactionModalContext";
import { useApi } from "../hooks/useApi";
import { useMonthParam } from "../hooks/useMonthParam";
import { formatMoney, formatMonth, formatShortMonth, shiftMonth, thisMonth } from "../lib/format";

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className={`h-[132px] rounded-2xl ${i === 0 ? "col-span-2 sm:col-span-1" : ""}`} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-[380px] rounded-2xl xl:col-span-2" />
        <Skeleton className="h-[380px] rounded-2xl" />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-[300px] rounded-2xl xl:col-span-2" />
        <Skeleton className="h-[300px] rounded-2xl" />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const [month, setMonth] = useMonthParam();
  const { openCreate, openEdit, version } = useTransactionModal();
  const { data, error, loading, reload } = useApi("/summary", { month });

  useEffect(() => {
    if (version) reload();
  }, [version, reload]);

  const firstName = user?.name?.split(" ")[0];
  const budgetLink = `/budget${month === thisMonth() ? "" : `?month=${month}`}`;

  // The six-month trend ends at the selected month, so its second-last entry is the previous month.
  const prev = data?.trend.at(-2);
  const prevLabel = formatShortMonth(shiftMonth(month, -1));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description={`Here's your money overview for ${formatMonth(month)}.`}
        actions={<MonthPicker value={month} onChange={setMonth} />}
      />

      {error && !data ? (
        <Card>
          <ErrorState error={error} onRetry={reload} />
        </Card>
      ) : !data ? (
        <DashboardSkeleton />
      ) : (
        <div className={`space-y-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <BalanceCard
              balance={formatMoney(data.totals.balance)}
              net={formatMoney(data.totals.net, { sign: true })}
            />
            <StatCard
              label="Income"
              value={formatMoney(data.totals.income)}
              icon={ArrowDownLeft}
              tone="income"
              footer={<Delta current={data.totals.income} previous={prev?.income} previousLabel={prevLabel} goodWhen="up" />}
            />
            <StatCard
              label="Expenses"
              value={formatMoney(data.totals.expense)}
              icon={ArrowUpRight}
              tone="expense"
              footer={
                <Delta current={data.totals.expense} previous={prev?.expense} previousLabel={prevLabel} goodWhen="down" />
              }
            />
            <StatCard
              label="Transactions"
              value={data.totals.count}
              icon={ReceiptText}
              tone="brand"
              className="col-span-2 sm:col-span-1"
              footer={<p className="mt-2 text-xs text-ink-faint">Recorded in {formatMonth(month)}</p>}
            />
          </div>

          {/* Trends and where the money went */}
          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="pb-5 xl:col-span-2">
              <CardHeader title="Income vs expenses" description="Last six months" />
              <div className="mt-4">
                {data.trend.some((m) => m.income || m.expense) ? (
                  <TrendChart data={data.trend} selectedMonth={month} />
                ) : (
                  <EmptyState
                    icon={BarChart3}
                    className="py-14!"
                    title="No activity in the last six months"
                    description="Income and expenses you record will be compared here month by month."
                  />
                )}
              </div>
            </Card>

            <Card className="pb-6">
              <CardHeader title="Spending by category" description={formatMonth(month)} />
              <div className="px-5 pt-4 sm:px-6">
                {data.breakdown.length === 0 ? (
                  <EmptyState
                    icon={PieChart}
                    className="py-10!"
                    title="No expenses this month"
                    description="Once you add expenses, you'll see which categories they went to."
                  />
                ) : (
                  <CategoryBreakdown items={data.breakdown} total={data.totals.expense} />
                )}
              </div>
            </Card>
          </div>

          {/* Activity and budget */}
          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="pb-3 xl:col-span-2">
              <CardHeader
                title="Recent transactions"
                description={formatMonth(month)}
                action={
                  <Link to="/transactions" className={cardLinkClass}>
                    View all
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                }
              />
              <div className="px-5 pt-2 sm:px-6">
                {data.recent.length === 0 ? (
                  <EmptyState
                    icon={ReceiptText}
                    className="py-10!"
                    title="Nothing recorded yet"
                    description={`Add your first income or expense for ${formatMonth(month)}.`}
                    action={
                      <Button size="sm" icon={Plus} onClick={openCreate}>
                        Add transaction
                      </Button>
                    }
                  />
                ) : (
                  <div className="divide-y divide-line/60">
                    {data.recent.map((tx) => (
                      <TransactionListItem key={tx.id} tx={tx} onClick={() => openEdit(tx)} />
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card className="flex flex-col">
              <CardHeader
                title="Monthly budget"
                description={formatMonth(month)}
                action={
                  data.budget.amount !== null && (
                    <Link to={budgetLink} className={cardLinkClass}>
                      Edit
                    </Link>
                  )
                }
              />
              <div className="flex flex-1 flex-col justify-center px-5 pb-6 pt-5 sm:px-6">
                {data.budget.amount === null ? (
                  <EmptyState
                    icon={Target}
                    className="py-4!"
                    title="No budget for this month"
                    description={`You've spent ${formatMoney(data.budget.spent)} so far. Set a limit to see how you're tracking.`}
                    action={
                      <Link to={budgetLink} className={buttonClass("secondary", "sm")}>
                        Set a budget
                      </Link>
                    }
                  />
                ) : (
                  <BudgetProgress budget={data.budget} size="lg" />
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
