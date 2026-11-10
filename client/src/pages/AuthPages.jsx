import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Logo } from "../components/layout/Logo";
import { Button } from "../components/ui/Button";
import { Field, FormError, Input } from "../components/ui/Field";
import { useAuth } from "../context/AuthContext";
import { check, loginSchema, registerSchema } from "../lib/schemas";

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
      {/* Soft brand glow behind the card */}
      <div
        className="pointer-events-none absolute left-1/2 top-[-12rem] size-[36rem] -translate-x-1/2 rounded-full bg-brand-200/40 blur-3xl"
        aria-hidden
      />
      <Logo className="relative mb-8" />
      <div className="relative w-full max-w-[420px] rounded-2xl border border-line/70 bg-white p-6 shadow-pop sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
      <p className="relative mt-6 text-sm text-ink-soft">{footer}</p>
    </div>
  );
}

/** Shared form state + submit handling for login and register. */
function useAuthForm(schema, initial, action) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const bind = (field) => ({
    value: values[field],
    error: errors[field],
    onChange: (e) => {
      setValues((v) => ({ ...v, [field]: e.target.value }));
      if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
    },
  });

  async function onSubmit(e) {
    e.preventDefault();
    setFormError(null);
    const { data, errors: fieldErrors } = check(schema, values);
    if (fieldErrors) return setErrors(fieldErrors);
    setSubmitting(true);
    try {
      await action(data);
    } catch (err) {
      if (err.fields) setErrors(err.fields);
      else setFormError(err.message);
      setSubmitting(false);
    }
  }

  return { bind, errors, formError, submitting, onSubmit };
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { bind, formError, submitting, onSubmit } = useAuthForm(
    loginSchema,
    { email: "", password: "" },
    async (data) => {
      await login(data);
      navigate(location.state?.from ?? "/", { replace: true });
    },
  );

  return (
    <AuthShell
      title="Sign in"
      subtitle="Pick up where you left off with your spending."
      footer={
        <>
          New to Spendly?{" "}
          <Link to="/register" className="font-bold text-brand-600 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError>{formError}</FormError>
        <Field label="Email" error={bind("email").error}>
          {(a) => <Input {...a} {...bind("email")} type="email" autoComplete="email" autoFocus />}
        </Field>
        <Field label="Password" error={bind("password").error}>
          {(a) => <Input {...a} {...bind("password")} type="password" autoComplete="current-password" />}
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { bind, formError, submitting, onSubmit } = useAuthForm(
    registerSchema,
    { name: "", email: "", password: "", confirm: "" },
    async ({ name, email, password }) => {
      await register({ name, email, password });
      navigate("/", { replace: true });
    },
  );

  return (
    <AuthShell
      title="Create your account"
      subtitle="Track income, expenses and a monthly budget in taka."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-brand-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError>{formError}</FormError>
        <Field label="Name" error={bind("name").error}>
          {(a) => <Input {...a} {...bind("name")} autoComplete="name" autoFocus />}
        </Field>
        <Field label="Email" error={bind("email").error}>
          {(a) => <Input {...a} {...bind("email")} type="email" autoComplete="email" />}
        </Field>
        <Field label="Password" error={bind("password").error} hint="At least 8 characters, with a letter and a number.">
          {(a) => <Input {...a} {...bind("password")} type="password" autoComplete="new-password" />}
        </Field>
        <Field label="Confirm password" error={bind("confirm").error}>
          {(a) => <Input {...a} {...bind("confirm")} type="password" autoComplete="new-password" />}
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
