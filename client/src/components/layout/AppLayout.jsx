import { LayoutDashboard, ListOrdered, LogOut, Plus, Shapes, Target } from "lucide-react";
import { NavLink, Outlet } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useTransactionModal } from "../../context/TransactionModalContext";
import { Button } from "../ui/Button";
import { Logo } from "./Logo";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/transactions", label: "Transactions", icon: ListOrdered },
  { to: "/budget", label: "Budget", icon: Target },
  { to: "/categories", label: "Categories", icon: Shapes },
];

function initials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

function Avatar({ name, className = "" }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-linear-to-br from-brand-500 to-brand-700 font-bold text-white ${className}`}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const { openCreate } = useTransactionModal();

  return (
    <div className="min-h-dvh lg:pl-[252px]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-[252px] flex-col border-r border-line bg-white px-4 pb-4 pt-6 lg:flex">
        <Logo className="px-3" />

        <p className="mb-2 mt-9 px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">Menu</p>
        <nav className="space-y-1" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-ink-soft hover:bg-canvas hover:text-ink"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute -left-4 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-600 transition-opacity ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                    aria-hidden
                  />
                  <Icon
                    className={`size-[18px] ${isActive ? "text-brand-600" : "text-ink-faint group-hover:text-ink-soft"}`}
                    strokeWidth={isActive ? 2.3 : 2}
                    aria-hidden
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <Button icon={Plus} size="lg" className="mt-6 w-full shadow-brand" onClick={openCreate}>
          Add transaction
        </Button>

        <div className="mt-auto flex items-center gap-3 rounded-xl border border-line bg-canvas/50 p-2.5">
          <Avatar name={user?.name} className="size-9 text-sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{user?.name}</p>
            <p className="truncate text-xs text-ink-faint">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="grid size-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-expense-soft hover:text-expense"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line/80 bg-white/90 px-4 py-3 backdrop-blur-md lg:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={logout}
            className="grid size-9 place-items-center rounded-lg text-ink-faint hover:bg-canvas hover:text-expense"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-[18px]" />
          </button>
          <Avatar name={user?.name} className="size-8 text-xs" />
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-9">
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        {NAV.slice(0, 2).map((item) => (
          <MobileNavItem key={item.to} {...item} />
        ))}
        <div className="grid place-items-center">
          <button
            type="button"
            onClick={openCreate}
            aria-label="Add transaction"
            className="-mt-6 grid size-13 place-items-center rounded-2xl bg-brand-600 text-white shadow-brand ring-4 ring-white transition-transform active:scale-95"
          >
            <Plus className="size-6" />
          </button>
        </div>
        {NAV.slice(2).map((item) => (
          <MobileNavItem key={item.to} {...item} />
        ))}
      </nav>
    </div>
  );
}

function MobileNavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 pb-2 pt-2.5 text-[11px] font-semibold transition-colors ${
          isActive ? "text-brand-600" : "text-ink-faint hover:text-ink-soft"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${isActive ? "bg-brand-50" : ""}`}>
            <Icon className="size-5" strokeWidth={isActive ? 2.3 : 2} aria-hidden />
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
}
