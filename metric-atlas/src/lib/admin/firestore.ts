import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";

export type ManualUserDraft = {
  firstName: string;
  lastName: string;
  email: string;
  avatarColor: string;
};

export const AVATAR_PALETTE = [
  "#A855F7",
  "#0EA5E9",
  "#F97316",
  "#10B981",
  "#F43F5E",
  "#FACC15",
  "#22D3EE",
  "#818CF8",
  "#FB7185",
  "#34D399",
] as const;

function newUid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export function pickAvatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]!;
}

/** Crea una entrada manual en /userProfiles. No crea un usuario en Firebase Auth.
 *  Cuando la persona se registre con ese email, AuthProvider creará otro doc
 *  con su uid real; el admin podrá borrar el manual en ese momento. */
export async function createManualUserProfile(
  draft: ManualUserDraft,
): Promise<string> {
  const id = `manual-${newUid()}`;
  const displayName = [draft.firstName.trim(), draft.lastName.trim()]
    .filter(Boolean)
    .join(" ");
  await setDoc(doc(getDb(), "userProfiles", id), {
    uid: id,
    email: draft.email.trim().toLowerCase(),
    displayName: displayName || null,
    photoURL: null,
    avatarColor: draft.avatarColor,
    manualCreated: true,
    createdAt: serverTimestamp(),
  });
  return id;
}

export async function deleteUserProfile(uid: string): Promise<void> {
  await deleteDoc(doc(getDb(), "userProfiles", uid));
}

export async function grantAdmin(uid: string, email: string): Promise<void> {
  await setDoc(doc(getDb(), "admins", uid), {
    email: email.trim().toLowerCase(),
    addedAt: new Date().toISOString(),
  });
}

export async function revokeAdmin(uid: string): Promise<void> {
  await deleteDoc(doc(getDb(), "admins", uid));
}

export function subscribeToAdmins(
  cb: (uids: Set<string>) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(getDb(), "admins"),
    (snap) => {
      cb(new Set(snap.docs.map((d) => d.id)));
    },
    (err) => {
      console.error("[admin] admins snapshot error", err);
      onError?.(err);
    },
  );
}
