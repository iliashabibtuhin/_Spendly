import { History, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { budgetStatus, BudgetProgress } from "../components/dashboard/BudgetProgress";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Field, FormError, Input } from "../components/ui/Field";
import { MonthPicker } from "../components/ui/MonthPicker";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState, ErrorState, ListSkeleton, Skeleton } from "../components/ui/States";
import { useToast } from "../components/ui/Toast";
import { useTransactionModal } from "../context/TransactionModalContext";
import { useApi } from "../hooks/useApi";
import { api } from "../lib/api";
import { CURRENCY_SYMBOL, formatMoney, formatMonth } from "../lib/format";
import { budgetSchema, check } from "../lib/schemas";
import { useMonthParam } from "../hooks/useMonthParam";

export function BudgetPage() {
  const [month, setMonth] = useMonthParam();
  const { data, error, reload } = useApi(`/budgets/${month}`);
  const history = useApi("/budgets");
  const toast = useToast();
  const { version } = useTransactionModal();

  const [confirmRemove, setConfirmRemove] = useState(false);

  const budget = data?.budget?.month === month ? data.budget : null;
  const hasBudget = budget?.amount != null;

  const reloadHistory = history.reload;
  const refresh = () => {
    reload();
    reloadHistory();
  };

  // Spending changes when a transaction is saved from the global add button.
  useEffect(() => {
    if (version) {
      reload();
      reloadHistory();
    }
  }, [version, reload, reloadHistory]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monthly budget"
        description="Set a spending limit and see how this month's expenses compare."
        actions={<MonthPicker value={month} onChange={setMonth} />}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="pb-6 lg:col-span-3">
          <CardHeader title={formatMonth(month)} description="Spending is the total of this month's expense transactions." />
          <div className="px-5 pt-6 sm:px-6">
            {error && !data ? (
              <ErrorState error={error} onRetry={reload} />
            ) : !budget ? (
              <div className="space-y-3" aria-busy="true" aria-label="Loading budget">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-3.5 w-full rounded-full" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ) : hasBudget ? (
              <BudgetProgress budget={budget} size="lg" />
            ) : (
              <EmptyState
                icon={Target}
                className="py-4!"
                title="No budget set"
                description={`You've spent ${formatMoney(budget.spent)} in ${formatMonth(month)}. Set a limit below to track it.`}
              />
            )}

            {budget && (
              <BudgetForm
                key={`${month}:${budget.amount}`}
                month={month}
                current={budget.amount}
                onSaved={() => {
                  toast(`Budget saved for ${formatMonth(month)}`);
                  refresh();
                }}
                onRemove={() => setConfirmRemove(true)}
              />
            )}
          </div>
        </Card>

        <Card className="pb-3 lg:col-span-2">
          <CardHeader title="Past budgets" description="Most recent first" />
          <div className="px-5 pt-3 sm:px-6">
            {history.error && !history.data ? (
              <ErrorState error={history.error} onRetry={history.reload} />
            ) : !history.data ? (
              <ListSkeleton rows={4} />
            ) : history.data.budgets.length === 0 ? (
              <EmptyState
                icon={History}
                className="py-8!"
                title="No budgets yet"
                description="Budgets you set will show up here so you can compare months."
              />
            ) : (
              <ul className="-mx-2 space-y-0.5">
                {history.data.budgets.map((b) => {
                  const status = budgetStatus(b.percent);
                  const Icon = status.icon;
                  return (
                    <li key={b.month}>
                      <button
                        type="button"
                        onClick={() => setMonth(b.month)}
                        aria-current={b.month === month ? "true" : undefined}
                        className={`flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors ${
                          b.month === month ? "bg-brand-50" : "hover:bg-canvas"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm ${b.month === month ? "font-extrabold" : "font-semibold"}`}>{formatMonth(b.month)}</p>
                          <p className="text-xs text-ink-faint">
                            {formatMoney(b.spent)} of {formatMoney(b.amount)}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-xs font-bold ${status.text}`} title={status.label}>
                          <Icon className="size-3.5" aria-hidden />
                          {b.percent}%
                          <span className="sr-only">, {status.label}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title="Remove this budget?"
        message={`The spending limit for ${formatMonth(month)} will be removed. Your transactions aren't affected.`}
        confirmLabel="Remove budget"
        onConfirm={async () => {
          await api.delete(`/budgets/${month}`);
          toast("Budget removed");
          refresh();
        }}
      />
    </div>
  );
}

/** Set or change the budget amount. Remounted (via key) whenever the saved amount changes. */
function BudgetForm({ month, current, onSaved, onRemove }) {
  const hasBudget = current != null;
  const [amount, setAmount] = useState(hasBudget ? String(current) : "");
  const [fieldError, setFieldError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    const { data: parsed, errors } = check(budgetSchema, { amount });
    if (errors) return setFieldError(errors.amount);
    setSaving(true);
    try {
      await api.put(`/budgets/${month}`, { amount: Number(parsed.amount) });
      onSaved();
    } catch (err) {
      if (err.fields?.amount) setFieldError(err.fields.amount);
      else setFormError(err.message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-8 border-t border-line pt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <Field label={hasBudget ? "Change budget" : "Budget amount"} error={fieldError} className="flex-1">
          {(a) => (
            <Input
              {...a}
              inputMode="decimal"
              prefix={CURRENCY_SYMBOL}
              placeholder="e.g. 40000"
              value={amount}
              error={fieldError}
              onChange={(e) => {
                setAmount(e.target.value);
                setFieldError(null);
              }}
            />
          )}
        </Field>
        <div className="flex gap-2 sm:mt-[26px]">
          <Button type="submit" loading={saving}>
            Save budget
          </Button>
          {hasBudget && (
            <Button variant="secondary" onClick={onRemove}>
              Remove
            </Button>
          )}
        </div>
      </div>
      <div className="mt-3">
        <FormError>{formError}</FormError>
      </div>
    </form>
  );
}
