"use client";

import * as React from "react";
import { X } from "lucide-react";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/lib/auth/auth-provider";

type Mode = "signin" | "signup";

const errorMessages: Record<string, string> = {
  "auth/invalid-credential": "Email o contraseña incorrectos.",
  "auth/invalid-email": "El email no es válido.",
  "auth/user-not-found": "No existe una cuenta con ese email.",
  "auth/wrong-password": "Contraseña incorrecta.",
  "auth/email-already-in-use": "Ya existe una cuenta con ese email.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/popup-closed-by-user": "Has cerrado la ventana de Google.",
  "auth/popup-blocked": "El navegador ha bloqueado la ventana de Google.",
  "auth/operation-not-allowed":
    "Este método no está habilitado en Firebase.",
};

function readableError(err: unknown): string {
  if (err instanceof FirebaseError) {
    return errorMessages[err.code] ?? `Error: ${err.code}`;
  }
  if (err instanceof Error) return err.message;
  return "Ha ocurrido un error inesperado.";
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A10.97 10.97 0 0 0 1 12c0 1.78.43 3.46 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export function AuthModal({
  open,
  initialMode = "signin",
  onClose,
  onSuccess,
}: {
  open: boolean;
  initialMode?: Mode;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { signIn, signUp, signInWithGoogle, configured } = useAuth();
  const [mode, setMode] = React.useState<Mode>(initialMode);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setEmail("");
    setPassword("");
    setName("");
    setError(null);
    setBusy(false);
  }, [open, initialMode]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  if (!configured) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md rounded-2xl border border-[#e6e6e6] bg-white p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-base font-semibold text-[#1e1e1e]">
            Firebase no está configurado
          </h2>
          <p className="mt-2 text-xs text-[#626262]">
            Faltan las variables de entorno NEXT_PUBLIC_FIREBASE_*.
          </p>
        </div>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password, name.trim() || undefined);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-[#e6e6e6] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 rounded-md p-1 text-[#757575] hover:bg-[#f5f5f5]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5 text-center">
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#1e1e1e]">
            {mode === "signin" ? "Inicia sesión" : "Crea tu cuenta"}
          </h2>
          <p className="mt-1 text-xs text-[#757575]">
            {mode === "signin"
              ? "Accede a tus matrices."
              : "Crea matrices y guarda tu trabajo."}
          </p>
        </div>

        <button
          type="button"
          onClick={onGoogle}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#e6e6e6] bg-white px-3 py-2 text-sm font-medium text-[#1e1e1e] transition-colors hover:bg-[#f7f7f7] disabled:opacity-60"
        >
          <GoogleIcon />
          Continuar con Google
        </button>

        <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-[#9a9a9a]">
          <div className="h-px flex-1 bg-[#eeeeee]" />
          <span>o</span>
          <div className="h-px flex-1 bg-[#eeeeee]" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "signup" ? (
            <Field
              label="Nombre"
              type="text"
              value={name}
              onChange={setName}
              placeholder="Tu nombre"
              autoComplete="name"
            />
          ) : null}
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="tu@email.com"
            autoComplete="email"
            required
          />
          <Field
            label="Contraseña"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            required
            minLength={6}
          />

          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-[#0d99ff] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0b87e0] disabled:opacity-60"
          >
            {busy ? "..." : mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-[#757575]">
          {mode === "signin" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === "signin" ? "signup" : "signin"));
              setError(null);
            }}
            className="font-medium text-[#0d99ff] hover:underline"
          >
            {mode === "signin" ? "Regístrate" : "Inicia sesión"}
          </button>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  minLength,
}: {
  label: string;
  type: "email" | "password" | "text";
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#757575]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="w-full rounded-md border border-[#e6e6e6] bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[#0d99ff]"
      />
    </label>
  );
}
