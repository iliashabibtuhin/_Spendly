import { Link, Route, Routes } from "react-router";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute, PublicOnlyRoute } from "./components/layout/RouteGuards";
import { buttonClass } from "./components/ui/Button";
import { TransactionModalProvider } from "./context/TransactionModalContext";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import { BudgetPage } from "./pages/BudgetPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TransactionsPage } from "./pages/TransactionsPage";

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-5xl font-extrabold text-brand-600">404</p>
      <p className="mt-3 font-bold">This page doesn't exist</p>
      <Link to="/" className={buttonClass("secondary", "md", "mt-5")}>
        Go to dashboard
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route
          element={
            <TransactionModalProvider>
              <AppLayout />
            </TransactionModalProvider>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="budget" element={<BudgetPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
