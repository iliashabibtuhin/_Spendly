import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { TransactionForm } from "../components/transactions/TransactionForm";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../components/ui/Toast";

const TransactionModalContext = createContext(null);

/**
 * Hosts the single add/edit transaction modal. `version` increments after every
 * change so pages can refetch their data.
 */
export function TransactionModalProvider({ children }) {
  const [state, setState] = useState({ open: false, transaction: null });
  const [version, setVersion] = useState(0);
  const toast = useToast();

  const openCreate = useCallback(() => setState({ open: true, transaction: null }), []);
  const openEdit = useCallback((transaction) => setState({ open: true, transaction }), []);
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);
  const notifyChanged = useCallback(() => setVersion((v) => v + 1), []);

  const value = useMemo(
    () => ({ openCreate, openEdit, version, notifyChanged }),
    [openCreate, openEdit, version, notifyChanged],
  );

  const editing = Boolean(state.transaction);

  return (
    <TransactionModalContext.Provider value={value}>
      {children}
      <Modal
        open={state.open}
        onClose={close}
        title={editing ? "Edit transaction" : "Add transaction"}
        description={editing ? undefined : "Record money coming in or going out."}
      >
        <TransactionForm
          key={state.transaction?.id ?? "new"}
          transaction={state.transaction}
          onCancel={close}
          onSaved={() => {
            close();
            notifyChanged();
            toast(editing ? "Transaction updated" : "Transaction added");
          }}
        />
      </Modal>
    </TransactionModalContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTransactionModal() {
  const ctx = useContext(TransactionModalContext);
  if (!ctx) throw new Error("useTransactionModal must be used inside TransactionModalProvider");
  return ctx;
}
