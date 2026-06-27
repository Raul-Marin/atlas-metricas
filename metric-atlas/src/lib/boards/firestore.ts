import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import {
  defaultBoardCanvas,
  defaultBoardCover,
  sanitizeBoard,
  type BoardCoverId,
  type MatrixBoard,
  type MatrixBoardCanvasSettings,
  type MatrixSpace,
} from "@/lib/matrix-boards";
import { defaultMatrixAxes, normalizeAxes } from "@/lib/matrix-axes";
import { defaultAtlasFilters } from "@/lib/filters";

function boardsCol(uid: string) {
  return collection(getDb(), "users", uid, "boards");
}
function spacesCol(uid: string) {
  return collection(getDb(), "users", uid, "spaces");
}
function sharedBoardsCol() {
  return collection(getDb(), "sharedBoards");
}

export type ShareState = {
  ownerUid: string;
  boardId: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

function newId(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

export function subscribeToBoards(
  uid: string,
  cb: (boards: MatrixBoard[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(boardsCol(uid), orderBy("updatedAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      const boards = snap.docs.map((d) =>
        sanitizeBoard({ ...(d.data() as MatrixBoard), id: d.id }),
      );
      cb(boards);
    },
    (err) => {
      console.error("[boards] snapshot error", err);
      onError?.(err);
    },
  );
}

export function subscribeToSpaces(
  uid: string,
  cb: (spaces: MatrixSpace[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    spacesCol(uid),
    (snap) => {
      const spaces = snap.docs.map((d) => ({
        id: d.id,
        name: (d.data() as MatrixSpace).name ?? "Espacio",
      }));
      cb(spaces);
    },
    (err) => {
      console.error("[spaces] snapshot error", err);
      onError?.(err);
    },
  );
}

export async function getBoard(uid: string, id: string): Promise<MatrixBoard | null> {
  const snap = await getDoc(doc(boardsCol(uid), id));
  if (!snap.exists()) return null;
  return sanitizeBoard({ ...(snap.data() as MatrixBoard), id: snap.id });
}

export async function createBoard(
  uid: string,
  name: string,
  canvasOverrides?: Partial<MatrixBoardCanvasSettings>,
): Promise<MatrixBoard> {
  const id = newId();
  const now = nowIso();
  const board: MatrixBoard = {
    id,
    name: name.trim() || "Matrix sin título",
    spaceId: null,
    starred: false,
    coverId: defaultBoardCover(),
    createdAt: now,
    updatedAt: now,
    canvas: {
      ...defaultBoardCanvas(),
      ...canvasOverrides,
      matrixAxes: normalizeAxes(
        canvasOverrides?.matrixAxes ?? defaultMatrixAxes,
      ),
      filters: canvasOverrides?.filters ?? defaultAtlasFilters,
      metricScores: canvasOverrides?.metricScores ?? {},
    },
  };
  await setDoc(doc(boardsCol(uid), id), board);
  return board;
}

/** Clona un board (canvas completo: ejes, filtros, posiciones, exclusiones) en una matriz nueva. */
export async function duplicateBoard(
  uid: string,
  source: MatrixBoard,
): Promise<MatrixBoard> {
  const copy = await createBoard(uid, `${source.name} (copia)`, source.canvas);
  if (source.spaceId) {
    await setBoardSpace(uid, copy.id, source.spaceId);
    return { ...copy, spaceId: source.spaceId };
  }
  return copy;
}

export async function updateBoardCanvas(
  uid: string,
  id: string,
  canvas: MatrixBoardCanvasSettings,
): Promise<void> {
  await updateDoc(doc(boardsCol(uid), id), {
    canvas: {
      ...canvas,
      matrixAxes: normalizeAxes(canvas.matrixAxes),
      metricScores: canvas.metricScores ?? {},
    },
    updatedAt: nowIso(),
  });
}

export async function renameBoard(
  uid: string,
  id: string,
  name: string,
): Promise<void> {
  await updateDoc(doc(boardsCol(uid), id), {
    name: name.trim() || "Sin título",
    updatedAt: nowIso(),
  });
}

export async function toggleStarBoard(
  uid: string,
  id: string,
  starred: boolean,
): Promise<void> {
  await updateDoc(doc(boardsCol(uid), id), {
    starred,
  });
}

export async function updateBoardCover(
  uid: string,
  id: string,
  coverId: BoardCoverId,
): Promise<void> {
  await updateDoc(doc(boardsCol(uid), id), {
    coverId,
    updatedAt: nowIso(),
  });
}

export async function setBoardSpace(
  uid: string,
  id: string,
  spaceId: string | null,
): Promise<void> {
  await updateDoc(doc(boardsCol(uid), id), {
    spaceId,
    updatedAt: nowIso(),
  });
}

export async function deleteBoard(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(boardsCol(uid), id));
}

export async function createSpace(
  uid: string,
  name: string,
): Promise<MatrixSpace> {
  const id = newId();
  const space: MatrixSpace = {
    id,
    name: name.trim() || "Espacio",
  };
  await setDoc(doc(spacesCol(uid), id), { name: space.name });
  return space;
}

export async function renameSpace(
  uid: string,
  id: string,
  name: string,
): Promise<void> {
  await updateDoc(doc(spacesCol(uid), id), {
    name: name.trim() || "Espacio",
  });
}

export const DEFAULT_WORKSPACE_NAME = "Mi espacio";

/**
 * Garantiza el modelo de workspaces: siempre existe al menos un espacio de
 * trabajo, toda matriz vive dentro de uno (migra las que estuvieran sin espacio)
 * y un usuario nuevo arranca con una matriz inicial. Idempotente.
 */
export async function ensureWorkspaceSetup(uid: string): Promise<void> {
  const [spacesSnap, boardsSnap] = await Promise.all([
    getDocs(spacesCol(uid)),
    getDocs(boardsCol(uid)),
  ]);

  const orphans = boardsSnap.docs.filter(
    (d) => (d.data() as MatrixBoard).spaceId == null,
  );

  // Espacio por defecto "Mi espacio": reutiliza el existente con ese nombre.
  let defaultSpaceId: string | undefined = spacesSnap.docs.find(
    (d) => (d.data() as MatrixSpace).name === DEFAULT_WORKSPACE_NAME,
  )?.id;

  // Crea "Mi espacio" si hace falta: hay matrices sin espacio que reubicar,
  // o el usuario aún no tiene ningún espacio de trabajo.
  if (!defaultSpaceId && (orphans.length > 0 || spacesSnap.empty)) {
    defaultSpaceId = (await createSpace(uid, DEFAULT_WORKSPACE_NAME)).id;
  }

  // Toda matriz vive en un espacio: reubica las que estén sin espacio.
  if (orphans.length > 0 && defaultSpaceId) {
    await Promise.all(
      orphans.map((d) => setBoardSpace(uid, d.id, defaultSpaceId!)),
    );
  }

  // Usuario nuevo: crea una matriz inicial dentro del espacio por defecto.
  if (boardsSnap.empty) {
    const targetId =
      defaultSpaceId ??
      spacesSnap.docs[0]?.id ??
      (await createSpace(uid, DEFAULT_WORKSPACE_NAME)).id;
    const board = await createBoard(uid, "Mi primera matrix");
    await setBoardSpace(uid, board.id, targetId);
  }
}

export function subscribeToShareState(
  boardId: string,
  cb: (state: ShareState | null) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(sharedBoardsCol(), boardId),
    (snap) => {
      if (!snap.exists()) {
        cb(null);
        return;
      }
      cb(snap.data() as ShareState);
    },
    (err) => {
      console.error("[shared-boards] snapshot error", err);
      onError?.(err);
    },
  );
}

export async function enableShare(uid: string, boardId: string): Promise<void> {
  const ref = doc(sharedBoardsCol(), boardId);
  const existing = await getDoc(ref);
  const now = nowIso();
  if (existing.exists()) {
    await updateDoc(ref, { enabled: true, updatedAt: now });
    return;
  }
  await setDoc(ref, {
    ownerUid: uid,
    boardId,
    enabled: true,
    createdAt: now,
    updatedAt: now,
  } satisfies ShareState);
}

export async function disableShare(uid: string, boardId: string): Promise<void> {
  const ref = doc(sharedBoardsCol(), boardId);
  const existing = await getDoc(ref);
  if (!existing.exists()) return;
  await updateDoc(ref, {
    ownerUid: uid,
    enabled: false,
    updatedAt: nowIso(),
  });
}

export async function getSharedBoard(
  boardId: string,
): Promise<{ share: ShareState; board: MatrixBoard } | null> {
  const shareSnap = await getDoc(doc(sharedBoardsCol(), boardId));
  if (!shareSnap.exists()) return null;
  const share = shareSnap.data() as ShareState;
  if (!share.enabled) return null;
  const boardSnap = await getDoc(
    doc(getDb(), "users", share.ownerUid, "boards", boardId),
  );
  if (!boardSnap.exists()) return null;
  const board = sanitizeBoard({
    ...(boardSnap.data() as MatrixBoard),
    id: boardSnap.id,
  });
  return { share, board };
}
