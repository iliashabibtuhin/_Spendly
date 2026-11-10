import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useApi } from "../../hooks/useApi";
import { api } from "../../lib/api";
import { CURRENCY_SYMBOL, today } from "../../lib/format";
import { check, transactionSchema } from "../../lib/schemas";
import { Button } from "../ui/Button";
import { CategoryIcon } from "../ui/CategoryIcon";
import { Field, FormError, Input, Select, Textarea } from "../ui/Field";
import { SegmentedControl } from "../ui/SegmentedControl";

const TYPE_OPTIONS = [
  { value: "EXPENSE", label: "Expense", icon: ArrowUpRight },
  { value: "INCOME", label: "Income", icon: ArrowDownLeft },
];

const initialValues = (tx) =>
  tx
    ? {
        type: tx.type,
        amount: String(tx.amount),
        categoryId: tx.category?.id ?? "",
        date: tx.date,
        description: tx.description ?? "",
      }
    : { type: "EXPENSE", amount: "", categoryId: "", date: today(), description: "" };

/** Create or edit a transaction. Calls onSaved(transaction) after the API confirms. */
export function TransactionForm({ transaction, onSaved, onCancel }) {
  const editing = Boolean(transaction);
  const [values, setValues] = useState(() => initialValues(transaction));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data, loading: loadingCategories, error: categoriesError } = useApi("/categories");
  const categories = useMemo(
    () => (data?.categories ?? []).filter((c) => c.type === values.type),
    [data, values.type],
  );
  const selectedCategory = categories.find((c) => c.id === values.categoryId);

  const set = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    const { data: parsed, errors: fieldErrors } = check(transactionSchema, values);
    if (fieldErrors) return setErrors(fieldErrors);

    setSaving(true);
    try {
      const body = { ...parsed, amount: Number(parsed.amount) };
      const res = editing
        ? await api.patch(`/transactions/${transaction.id}`, body)
        : await api.post("/transactions", body);
      onSaved(res.transaction);
    } catch (err) {
      if (err.fields) setErrors(err.fields);
      setFormError(err.fields ? null : err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <SegmentedControl
        label="Transaction type"
        value={values.type}
        onChange={(type) => {
          // Categories are per type, so switching type clears the choice.
          if (type !== values.type) setValues((v) => ({ ...v, type, categoryId: "" }));
        }}
        options={TYPE_OPTIONS}
        tone="type"
        size="lg"
        className="flex w-full"
      />

      <Field label="Amount" error={errors.amount}>
        {(a) => (
          <Input
            {...a}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            prefix={CURRENCY_SYMBOL}
            size="lg"
            className="font-bold"
            value={values.amount}
            onChange={set("amount")}
            error={errors.amount}
            autoFocus={!editing}
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Category"
          error={errors.categoryId}
          hint={
            <Link to="/categories" className="font-semibold text-brand-600 hover:underline" onClick={onCancel}>
              Manage categories
            </Link>
          }
        >
          {(a) => (
            <Select
              {...a}
              value={values.categoryId}
              onChange={set("categoryId")}
              error={errors.categoryId}
              disabled={loadingCategories}
              prefix={
                selectedCategory && <CategoryIcon icon={selectedCategory.icon} color={selectedCategory.color} size="xs" />
              }
            >
              <option value="">{loadingCategories ? "Loading…" : "Choose a category"}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Date" error={errors.date}>
          {(a) => <Input {...a} type="date" max={today()} value={values.date} onChange={set("date")} error={errors.date} />}
        </Field>
      </div>

      <Field label="Description (optional)" error={errors.description}>
        {(a) => (
          <Textarea
            {...a}
            rows={2}
            maxLength={200}
            placeholder="e.g. Lunch at Star Kabab"
            value={values.description}
            onChange={set("description")}
            error={errors.description}
          />
        )}
      </Field>

      <FormError>{formError ?? (categoriesError && `Categories couldn't load: ${categoriesError.message}`)}</FormError>

      <div className="grid grid-cols-2 gap-2 pt-1 sm:flex sm:justify-end">
        <Button variant="secondary" size="lg" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="lg" loading={saving}>
          {editing ? "Save changes" : "Add transaction"}
        </Button>
      </div>
    </form>
  );
}
