import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, ReceiptText, Search, SearchX, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TransactionListItem } from "../components/transactions/TransactionListItem";
import { Button } from "../components/ui/Button";
import { CategoryPill } from "../components/ui/CategoryIcon";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Field, Input, Select } from "../components/ui/Field";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState, ErrorState, ListSkeleton, Skeleton } from "../components/ui/States";
import { useToast } from "../components/ui/Toast";
import { useTransactionModal } from "../context/TransactionModalContext";
import { useApi } from "../hooks/useApi";
import { useDebounce } from "../hooks/useDebounce";
import { api } from "../lib/api";
import { formatDay, formatMoney, formatTxAmount, monthEnd, thisMonth, today } from "../lib/format";

const PAGE_SIZE = 15;

const SORTS = {
  "date-desc": { sort: "date", order: "desc", label: "Newest first" },
  "date-asc": { sort: "date", order: "asc", label: "Oldest first" },
  "amount-desc": { sort: "amount", order: "desc", label: "Highest amount" },
  "amount-asc": { sort: "amount", order: "asc", label: "Lowest amount" },
};

const TYPE_OPTIONS = [
  { value: "", label: "All" },
  { value: "EXPENSE", label: "Expenses" },
  { value: "INCOME", label: "Income" },
];

const EMPTY_FILTERS = { search: "", type: "", categoryId: "", from: "", to: "", sortKey: "date-desc" };

export function TransactionsPage() {
  const { openCreate, openEdit, version, notifyChanged } = useTransactionModal();
  const toast = useToast();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);

  const search = useDebounce(filters.search.trim(), 300);
  const dateError = filters.from && filters.to && filters.from > filters.to ? "End date is before start date" : null;

  const query = useMemo(
    () => ({
      search,
      type: filters.type,
      categoryId: filters.categoryId,
      from: dateError ? "" : filters.from,
      to: dateError ? "" : filters.to,
      ...SORTS[filters.sortKey],
      label: undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [search, filters.type, filters.categoryId, filters.from, filters.to, filters.sortKey, page, dateError],
  );

  const { data, error, loading, reload } = useApi("/transactions", query);
  const { data: catData } = useApi("/categories");

  useEffect(() => {
    if (version) reload();
  }, [version, reload]);

  const categories = useMemo(
    () => (catData?.categories ?? []).filter((c) => !filters.type || c.type === filters.type),
    [catData, filters.type],
  );

  const update = (patch) => {
    setFilters((f) => {
      const next = { ...f, ...patch };
      // Drop a category that no longer matches the chosen type.
      if (patch.type !== undefined && next.categoryId) {
        const cat = catData?.categories.find((c) => c.id === next.categoryId);
        if (cat && patch.type && cat.type !== patch.type) next.categoryId = "";
      }
      return next;
    });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  // If edits or deletes elsewhere shrink the result set, don't strand the user on an empty page.
  if (data && data.page === page && page > data.totalPages) setPage(data.totalPages);

  const setThisMonth = () => update({ from: `${thisMonth()}-01`, to: monthEnd(thisMonth()) });

  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  async function confirmDelete() {
    await api.delete(`/transactions/${toDelete.id}`);
    toast("Transaction deleted");
    notifyChanged();
    // Step back a page if this was the last row on it.
    if (data?.items.length === 1 && page > 1) setPage((p) => p - 1);
  }

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Search, filter and edit everything you've recorded."
        actions={
          <Button icon={Plus} onClick={openCreate} className="max-sm:hidden">
            Add transaction
          </Button>
        }
      />

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" aria-hidden />
            <input
              type="search"
              value={filters.search}
              onChange={(e) => update({ search: e.target.value })}
              placeholder="Search by description or category"
              aria-label="Search transactions"
              className="h-10 w-full rounded-[10px] border border-line bg-white pl-9 pr-3 text-sm shadow-[0_1px_1px_rgb(28_26_58/0.03)] transition-[border-color,box-shadow] placeholder:text-ink-faint hover:border-[#d6d4e4] focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
            />
          </div>
          <SegmentedControl
            label="Filter by type"
            value={filters.type}
            onChange={(type) => update({ type })}
            options={TYPE_OPTIONS}
            className="w-full sm:w-auto"
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line/70 pt-4 lg:grid-cols-4">
          <Field label="Category" className="col-span-2 sm:col-span-1">
            {(a) => (
              <Select {...a} value={filters.categoryId} onChange={(e) => update({ categoryId: e.target.value })}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {!filters.type ? ` (${c.type === "INCOME" ? "income" : "expense"})` : ""}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="From">
            {(a) => <Input {...a} type="date" max={today()} value={filters.from} onChange={(e) => update({ from: e.target.value })} />}
          </Field>
          <Field label="To" error={dateError}>
            {(a) => (
              <Input {...a} type="date" max={today()} value={filters.to} error={dateError} onChange={(e) => update({ to: e.target.value })} />
            )}
          </Field>
          <Field label="Sort by" className="col-span-2 sm:col-span-1">
            {(a) => (
              <Select {...a} value={filters.sortKey} onChange={(e) => update({ sortKey: e.target.value })}>
                {Object.entries(SORTS).map(([key, s]) => (
                  <option key={key} value={key}>
                    {s.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" icon={CalendarDays} onClick={setThisMonth}>
            This month
          </Button>
          {hasFilters && (
            <Button
              size="sm"
              variant="ghost"
              icon={X}
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          )}
          {data && (
            <p className="ml-auto text-sm text-ink-soft" aria-live="polite">
              <span className="font-bold text-ink">{data.total}</span> {data.total === 1 ? "transaction" : "transactions"}
            </p>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        {error && !data ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data ? (
          <TableSkeleton />
        ) : items.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={SearchX}
              title="No transactions match these filters"
              description="Try a different search term or widen the date range."
              action={
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={ReceiptText}
              title="No transactions yet"
              description="Record your first income or expense to start tracking."
              action={
                <Button size="sm" icon={Plus} onClick={openCreate}>
                  Add transaction
                </Button>
              }
            />
          )
        ) : (
          <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
            {/* Desktop table */}
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-b border-line bg-canvas/70 text-left text-[11px] uppercase tracking-[0.06em] text-ink-faint">
                  <th scope="col" className="px-6 py-3 font-bold">Date</th>
                  <th scope="col" className="px-3 py-3 font-bold">Description</th>
                  <th scope="col" className="px-3 py-3 font-bold">Category</th>
                  <th scope="col" className="px-3 py-3 text-right font-bold">Amount</th>
                  <th scope="col" className="w-24 px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {items.map((tx) => (
                  <tr key={tx.id} className="group transition-colors hover:bg-canvas/60">
                    <td className="whitespace-nowrap px-6 py-3.5 text-ink-soft">{formatDay(tx.date)}</td>
                    <td className="max-w-xs truncate px-3 py-3.5 font-semibold">
                      {tx.description || <span className="font-normal text-ink-faint">No description</span>}
                    </td>
                    <td className="px-3 py-3.5">
                      <CategoryPill category={tx.category} />
                    </td>
                    <td className={`whitespace-nowrap px-3 py-3.5 text-right font-bold ${tx.type === "INCOME" ? "text-income" : "text-expense"}`}>
                      {formatTxAmount(tx)}
                    </td>
                    <td className="px-6 py-3.5">
                      <RowActions tx={tx} onEdit={() => openEdit(tx)} onDelete={() => setToDelete(tx)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile list */}
            <div className="divide-y divide-line/60 px-4 md:hidden">
              {items.map((tx) => (
                <TransactionListItem
                  key={tx.id}
                  tx={tx}
                  onClick={() => openEdit(tx)}
                  actions={
                    <button
                      type="button"
                      onClick={() => setToDelete(tx)}
                      className="rounded-lg p-2 text-ink-faint hover:bg-expense-soft hover:text-expense"
                      aria-label={`Delete ${tx.description || tx.category?.name}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  }
                />
              ))}
            </div>

            {data.totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-6">
                <p className="text-sm text-ink-soft">
                  <span className="max-sm:hidden">
                    Showing{" "}
                    <span className="font-semibold text-ink">
                      {(data.page - 1) * PAGE_SIZE + 1}–{Math.min(data.page * PAGE_SIZE, data.total)}
                    </span>{" "}
                    of <span className="font-semibold text-ink">{data.total}</span>
                  </span>
                  <span className="sm:hidden">
                    Page {data.page} of {data.totalPages}
                  </span>
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" icon={ChevronLeft} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={page >= data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="size-4" aria-hidden />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Delete this transaction?"
        message={
          toDelete &&
          `${toDelete.description || toDelete.category?.name} (${formatMoney(toDelete.amount)}, ${formatDay(toDelete.date)}) will be removed permanently.`
        }
        confirmLabel="Delete transaction"
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading transactions">
      <div className="hidden md:block">
        <div className="h-10 border-b border-line bg-canvas/70" />
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-6 border-b border-line/60 px-6 py-4 last:border-0">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
      <ListSkeleton rows={8} className="px-4 md:hidden" />
    </div>
  );
}

function RowActions({ tx, onEdit, onDelete }) {
  const label = tx.description || tx.category?.name;
  return (
    <div className="flex justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
      <button
        type="button"
        onClick={onEdit}
        className="rounded-lg p-2 text-ink-faint hover:bg-brand-50 hover:text-brand-700"
        aria-label={`Edit ${label}`}
        title="Edit"
      >
        <Pencil className="size-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded-lg p-2 text-ink-faint hover:bg-expense-soft hover:text-expense"
        aria-label={`Delete ${label}`}
        title="Delete"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
