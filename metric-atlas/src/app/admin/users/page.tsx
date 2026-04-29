"use client";

import * as React from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type Timestamp,
} from "firebase/firestore";
import {
  Pencil,
  Plus,
  ShieldCheck,
  ShieldOff,
  Trash2,
  X,
} from "lucide-react";
import { getDb } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  AVATAR_PALETTE,
  createManualUserProfile,
  deleteUserProfile,
  grantAdmin,
  pickAvatarColor,
  revokeAdmin,
  subscribeToAdmins,
} from "@/lib/admin/firestore";
import { cn } from "@/lib/utils";

type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  avatarColor: string | null;
  manualCreated: boolean;
  createdAt?: Timestamp;
  lastSignInAt?: Timestamp;
};

function formatTimestamp(ts?: Timestamp): string {
  if (!ts) return "—";
  try {
    return ts.toDate().toLocaleString("es", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function initials(name: string | null | undefined, email: string | null): string {
  const source = name || email || "?";
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function Avatar({ profile, size = 28 }: { profile: UserProfile; size?: number }) {
  if (profile.photoURL) {
    return (
      <img
        src={profile.photoURL}
        alt=""
        referrerPolicy="no-referrer"
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const color =
    profile.avatarColor ?? pickAvatarColor(profile.email ?? profile.uid);
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
      style={{ backgroundColor: color, width: size, height: size }}
      aria-hidden
    >
      {initials(profile.displayName, profile.email)}
    </span>
  );
}

function NewUserModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (draft: {
    firstName: string;
    lastName: string;
    email: string;
    avatarColor: string;
  }) => Promise<void>;
}) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [color, setColor] = React.useState<string>(AVATAR_PALETTE[0]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setFirstName("");
    setLastName("");
    setEmail("");
    setColor(AVATAR_PALETTE[0]);
    setError(null);
    setBusy(false);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("El email es obligatorio.");
      return;
    }
    if (!firstName.trim() && !lastName.trim()) {
      setError("Indica al menos nombre o apellidos.");
      return;
    }
    setBusy(true);
    try {
      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        avatarColor: color,
      });
      onClose();
    } catch (err) {
      console.error("[new-user] submit", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const labelClass =
    "block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#757575]";
  const inputClass =
    "w-full rounded-md border border-[#e6e6e6] bg-white px-2.5 py-1.5 text-xs text-[#1e1e1e] outline-none focus:border-[#0d99ff] focus:ring-2 focus:ring-[#0d99ff]/15";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col rounded-lg border border-[#e6e6e6] bg-white shadow-xl"
      >
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#e6e6e6] px-4">
          <span className="text-sm font-semibold tracking-[-0.02em] text-[#1e1e1e]">
            Nuevo usuario
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[#757575] hover:bg-[#f5f5f5]"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="space-y-3 px-4 py-4">
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="space-y-1">
              <span className={labelClass}>Nombre</span>
              <input
                type="text"
                className={inputClass}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoFocus
              />
            </label>
            <label className="space-y-1">
              <span className={labelClass}>Apellidos</span>
              <input
                type="text"
                className={inputClass}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className={labelClass}>Email</span>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="persona@empresa.com"
              required
            />
          </label>
          <div>
            <span className={labelClass}>Color del avatar</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {AVATAR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                  className={cn(
                    "h-7 w-7 rounded-full ring-2 ring-offset-1 transition-all",
                    color === c ? "ring-[#0d99ff]" : "ring-transparent",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <p className="rounded-md bg-[#fafafa] px-3 py-2 text-[11px] leading-[1.45] text-[#626262]">
            Esta acción crea solo el perfil en el panel. La persona deberá
            registrarse en el login con ese email para acceder a la app.
            Cuando lo haga, se generará otro perfil con su sesión real; podrás
            borrar entonces este registro manual.
          </p>
        </div>
        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-[#e6e6e6] px-4 py-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-[#626262] hover:bg-[#f5f5f5]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-[#0d99ff] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0b87e0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Creando…" : "Crear usuario"}
          </button>
        </footer>
      </form>
    </div>
  );
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [profiles, setProfiles] = React.useState<UserProfile[] | null>(null);
  const [admins, setAdmins] = React.useState<Set<string>>(new Set());
  const [error, setError] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const q = query(
      collection(getDb(), "userProfiles"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data() as Partial<UserProfile> & {
            avatarColor?: string;
            manualCreated?: boolean;
          };
          return {
            uid: d.id,
            email: data.email ?? null,
            displayName: data.displayName ?? null,
            photoURL: data.photoURL ?? null,
            avatarColor: data.avatarColor ?? null,
            manualCreated: Boolean(data.manualCreated),
            createdAt: data.createdAt,
            lastSignInAt: data.lastSignInAt,
          } satisfies UserProfile;
        });
        setProfiles(list);
      },
      (err) => {
        console.error("[admin-users] snapshot", err);
        setError(err.message);
      },
    );
    return unsub;
  }, []);

  React.useEffect(() => {
    return subscribeToAdmins(setAdmins, (err) => {
      console.error("[admin-users] admins", err);
      setError(err.message);
    });
  }, []);

  const onCreate = async (draft: {
    firstName: string;
    lastName: string;
    email: string;
    avatarColor: string;
  }) => {
    await createManualUserProfile(draft);
  };

  const onToggleAdmin = async (p: UserProfile) => {
    setPendingId(p.uid);
    try {
      if (admins.has(p.uid)) {
        await revokeAdmin(p.uid);
      } else {
        await grantAdmin(p.uid, p.email ?? "");
      }
    } catch (err) {
      console.error("[admin-users] toggle admin", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPendingId(null);
    }
  };

  const onDelete = async (p: UserProfile) => {
    if (
      !window.confirm(
        `¿Borrar el perfil de ${p.displayName ?? p.email ?? p.uid}?`,
      )
    ) {
      return;
    }
    setPendingId(p.uid);
    try {
      if (admins.has(p.uid)) {
        await revokeAdmin(p.uid);
      }
      await deleteUserProfile(p.uid);
    } catch (err) {
      console.error("[admin-users] delete", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.03em] text-[#1e1e1e]">
            Usuarios
          </h1>
          <p className="text-xs text-[#757575]">
            Cuentas reales (las que han iniciado sesión) y entradas manuales
            que has creado tú. Promueve a admin a quien deba acceder a esta
            zona.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#0d99ff] px-3 text-xs font-medium text-white hover:bg-[#0b87e0]"
        >
          <Plus className="h-3.5 w-3.5" />
          Nuevo usuario
        </button>
      </header>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-[#e6e6e6] bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#f0f0f0] bg-[#fafafa] text-[10px] font-semibold uppercase tracking-[0.08em] text-[#757575]">
            <tr>
              <th className="px-4 py-2.5">Cuenta</th>
              <th className="px-4 py-2.5">Email</th>
              <th className="hidden px-4 py-2.5 md:table-cell">Origen</th>
              <th className="hidden px-4 py-2.5 md:table-cell">Último login</th>
              <th className="px-4 py-2.5">Rol</th>
              <th className="w-[200px] px-4 py-2.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {profiles === null ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-xs text-[#757575]"
                >
                  Cargando…
                </td>
              </tr>
            ) : profiles.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-xs text-[#757575]"
                >
                  Aún no hay usuarios.
                </td>
              </tr>
            ) : (
              profiles.map((p) => {
                const isAdminUser = admins.has(p.uid);
                const isSelf = currentUser?.uid === p.uid;
                return (
                  <tr
                    key={p.uid}
                    className="border-b border-[#f3f3f3] hover:bg-[#fafafa]"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar profile={p} />
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-medium text-[#1e1e1e]">
                            {p.displayName ?? "(sin nombre)"}
                            {isSelf ? (
                              <span className="ml-1.5 rounded-md bg-[#f0f7ff] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[#0d99ff]">
                                tú
                              </span>
                            ) : null}
                          </p>
                          <p className="truncate font-mono text-[10px] text-[#949494]">
                            {p.uid}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-[#444]">
                      {p.email ?? "—"}
                    </td>
                    <td className="hidden px-4 py-2.5 text-[11px] text-[#626262] md:table-cell">
                      {p.manualCreated ? (
                        <span className="rounded-md bg-[#fff3cd] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[#8a6d3b]">
                          Manual
                        </span>
                      ) : (
                        <span className="rounded-md bg-[#e9f8ee] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[#16794c]">
                          Auth
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-2.5 text-[11px] text-[#626262] md:table-cell">
                      {formatTimestamp(p.lastSignInAt)}
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-[#444]">
                      {isAdminUser ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#f0f7ff] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[#0d99ff]">
                          <ShieldCheck className="h-3 w-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#949494]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        {p.manualCreated ? (
                          <button
                            type="button"
                            onClick={() => alert("Edición pendiente — usa Borrar y vuelve a crear si necesitas cambiar datos.")}
                            disabled
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#bdbdbd]"
                          >
                            <Pencil className="h-3 w-3" />
                            Editar
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => onToggleAdmin(p)}
                          disabled={pendingId === p.uid || (isSelf && isAdminUser)}
                          title={
                            isSelf && isAdminUser
                              ? "No puedes quitarte el rol a ti mismo"
                              : undefined
                          }
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs disabled:opacity-50",
                            isAdminUser
                              ? "text-[#8a6d3b] hover:bg-[#fff3cd]"
                              : "text-[#0d99ff] hover:bg-[#f0f7ff]",
                          )}
                        >
                          {isAdminUser ? (
                            <>
                              <ShieldOff className="h-3 w-3" />
                              Quitar admin
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-3 w-3" />
                              Hacer admin
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(p)}
                          disabled={pendingId === p.uid || isSelf}
                          title={isSelf ? "No puedes borrarte a ti mismo" : undefined}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <NewUserModal
        open={creating}
        onClose={() => setCreating(false)}
        onSubmit={onCreate}
      />
    </div>
  );
}
