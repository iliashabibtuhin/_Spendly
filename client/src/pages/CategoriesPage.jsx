import { Check, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { CategoryIcon } from "../components/ui/CategoryIcon";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Field, FormError, Input } from "../components/ui/Field";
import { Modal } from "../components/ui/Modal";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { PageHeader } from "../components/ui/PageHeader";
import { ErrorState, ListSkeleton } from "../components/ui/States";
import { useToast } from "../components/ui/Toast";
import { useTransactionModal } from "../context/TransactionModalContext";
import { useApi } from "../hooks/useApi";
import { api } from "../lib/api";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "../lib/icons";
import { categorySchema, check } from "../lib/schemas";

export function CategoriesPage() {
  const { data, error, reload } = useApi("/categories");
  const [editor, setEditor] = useState(null); // { category?, type }
  const [toDelete, setToDelete] = useState(null);
  const toast = useToast();
  const { version } = useTransactionModal();

  // Transaction counts change when a transaction is saved from the global add button.
  useEffect(() => {
    if (version) reload();
  }, [version, reload]);

  const categories = data?.categories ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Defaults come with every account. Add your own for anything else."
        actions={
          <Button icon={Plus} onClick={() => setEditor({ type: "EXPENSE" })}>
            New category
          </Button>
        }
      />

      {error && !data ? (
        <Card>
          <ErrorState error={error} onRetry={reload} />
        </Card>
      ) : !data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <Card key={i} className="px-5 py-4 sm:px-6">
              <ListSkeleton rows={6} />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {[
            { type: "EXPENSE", title: "Expense categories" },
            { type: "INCOME", title: "Income categories" },
          ].map(({ type, title }) => {
            const list = categories.filter((c) => c.type === type);
            return (
              <Card key={type} className="pb-2">
                <CardHeader
                  title={title}
                  description={`${list.length} categories`}
                  action={
                    <Button size="sm" variant="secondary" icon={Plus} onClick={() => setEditor({ type })}>
                      Add
                    </Button>
                  }
                />
                <ul className="mt-3 divide-y divide-line/60 px-5 sm:px-6">
                  {list.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 py-3">
                      <CategoryIcon icon={c.icon} color={c.color} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{c.name}</p>
                        <p className="text-xs text-ink-faint">
                          {c.transactionCount} {c.transactionCount === 1 ? "transaction" : "transactions"}
                        </p>
                      </div>
                      {c.isDefault ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-1 text-[11px] font-semibold text-ink-faint" title="Default categories can't be changed">
                          <Lock className="size-3" aria-hidden />
                          Default
                        </span>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setEditor({ category: c, type: c.type })}
                            className="rounded-lg p-2 text-ink-faint hover:bg-brand-50 hover:text-brand-700"
                            aria-label={`Edit ${c.name}`}
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setToDelete(c)}
                            className="rounded-lg p-2 text-ink-faint hover:bg-expense-soft hover:text-expense"
                            aria-label={`Delete ${c.name}`}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        title={editor?.category ? "Edit category" : "New category"}
      >
        {editor && (
          <CategoryForm
            key={editor.category?.id ?? editor.type}
            category={editor.category}
            defaultType={editor.type}
            onCancel={() => setEditor(null)}
            onSaved={(saved, wasEdit) => {
              setEditor(null);
              reload();
              toast(wasEdit ? `${saved.name} updated` : `${saved.name} created`);
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title={`Delete ${toDelete?.name}?`}
        message="This category will be removed. Categories that still have transactions can't be deleted."
        confirmLabel="Delete category"
        onConfirm={async () => {
          await api.delete(`/categories/${toDelete.id}`);
          reload();
          toast("Category deleted");
        }}
      />
    </div>
  );
}

function CategoryForm({ category, defaultType, onSaved, onCancel }) {
  const editing = Boolean(category);
  const [values, setValues] = useState({
    name: category?.name ?? "",
    type: category?.type ?? defaultType,
    color: category?.color ?? CATEGORY_COLORS[0],
    icon: category?.icon ?? "tag",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (field, value) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    const { data, errors: fieldErrors } = check(categorySchema, values);
    if (fieldErrors) return setErrors(fieldErrors);
    setSaving(true);
    try {
      const res = editing
        ? await api.patch(`/categories/${category.id}`, { name: data.name, color: data.color, icon: data.icon })
        : await api.post("/categories", data);
      onSaved(res.category, editing);
    } catch (err) {
      if (err.fields) setErrors(err.fields);
      else setFormError(err.message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {!editing && (
        <SegmentedControl
          label="Category type"
          value={values.type}
          onChange={(t) => set("type", t)}
          tone="type"
          className="flex w-full"
          options={[
            { value: "EXPENSE", label: "Expense" },
            { value: "INCOME", label: "Income" },
          ]}
        />
      )}

      <div className="flex items-end gap-3">
        <CategoryIcon icon={values.icon} color={values.color} size="lg" />
        <Field label="Name" error={errors.name} className="flex-1">
          {(a) => (
            <Input {...a} value={values.name} maxLength={30} autoFocus error={errors.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Pets" />
          )}
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Color</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => set("color", color)}
              aria-label={color}
              aria-pressed={values.color === color}
              className="grid size-8 place-items-center rounded-full ring-offset-2 aria-pressed:ring-2 aria-pressed:ring-ink"
              style={{ backgroundColor: color }}
            >
              {values.color === color && <Check className="size-4 text-white" aria-hidden />}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Icon</legend>
        <div className="grid grid-cols-8 gap-1.5">
          {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => set("icon", key)}
              aria-label={key.replace("-", " ")}
              aria-pressed={values.icon === key}
              className="grid aspect-square place-items-center rounded-lg border border-line text-ink-soft hover:bg-canvas aria-pressed:border-brand-600 aria-pressed:bg-brand-50 aria-pressed:text-brand-700"
            >
              <Icon className="size-[18px]" aria-hidden />
            </button>
          ))}
        </div>
      </fieldset>

      <FormError>{formError}</FormError>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {editing ? "Save changes" : "Create category"}
        </Button>
      </div>
    </form>
  );
}
