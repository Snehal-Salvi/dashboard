// Mock backend. Same shape as a real REST client (async, throws on errors), so swapping in
// fetch/axios calls later only changes this file. Metadata → localStorage, file binaries → IndexedDB.

import { get as idbGet, set as idbSet, clear as idbClear } from 'idb-keyval';
import { ACTIVITY_ACTION as A, SOP_STATUS as S } from '../types';
import type { Activity, ReviewDecision, Sop, SopFile, SopFormInput, User } from '../types';
import { buildSeed, USERS } from './seed';
import {
  canEdit, canMakeChanges, canReview, nextVersion, remarksRequired,
  statusAfterDecision, statusAfterSave, statusAfterSubmit, validateSopFile,
} from '../domain/workflow';

const DB_KEY = 'grap.db.v2';
const LATENCY_MS = 450;

interface Db { sops: Sop[]; activities: Activity[] }

const delay = (ms = LATENCY_MS) => new Promise((r) => setTimeout(r, ms));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

function readDb(): Db {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as Db;
  } catch {
    /* corrupted or blocked storage → fall back to seed */
  }
  const seed = buildSeed();
  writeDb(seed);
  return seed;
}

function writeDb(db: Db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* storage full / private mode: data stays in memory for this session */
  }
}

export class ApiError extends Error {}

const nextSopId = (sops: Sop[]) => {
  const max = sops.reduce((m, s) => Math.max(m, Number(s.id.replace(/\D/g, '')) || 0), 0);
  return `SOP-${String(max + 1).padStart(4, '0')}`;
};

const findSop = (db: Db, id: string) => {
  const sop = db.sops.find((s) => s.id === id);
  if (!sop) throw new ApiError(`SOP ${id} was not found.`);
  return sop;
};

const log = (db: Db, entry: Omit<Activity, 'id' | 'at'>) =>
  db.activities.push({ ...entry, id: uid(), at: new Date().toISOString() });

async function storeFile(file: File): Promise<SopFile> {
  const key = uid();
  await idbSet(key, file);
  return { name: file.name, mimeType: file.type, size: file.size, source: 'idb', key };
}

export const api = {
  users: USERS,

  /** Simulated SSO: the identity provider returns the bank user; GRAP looks up the persona. */
  async ssoSignIn(userId: string): Promise<User> {
    await delay(900);
    const user = USERS.find((u) => u.id === userId);
    if (!user) throw new ApiError('SSO authentication failed.');
    return user;
  },

  getUser: (id: string) => USERS.find((u) => u.id === id),

  async listSops(): Promise<Sop[]> {
    await delay();
    return readDb().sops;
  },

  async getSop(id: string): Promise<Sop> {
    await delay(250);
    return findSop(readDb(), id);
  },

  async getActivity(sopId: string): Promise<Activity[]> {
    await delay(300);
    return readDb()
      .activities.filter((a) => a.sopId === sopId)
      .sort((a, b) => b.at.localeCompare(a.at)); // newest first
  },

  /**
   * Notifications for the bell: decisions on my SOPs by others, and (for reviewers)
   * SOPs submitted/resubmitted by others that are still waiting for review.
   */
  async getNotifications(user: User): Promise<{ activity: Activity; sop: Sop }[]> {
    await delay(150);
    const db = readDb();
    const byId = new Map(db.sops.map((s) => [s.id, s]));
    return db.activities
      .filter((a) => {
        const sop = byId.get(a.sopId);
        if (!sop || a.byUserId === user.id) return false;
        if (sop.createdBy === user.id) return true;
        return (a.action === A.SUBMITTED || a.action === A.RESUBMITTED) && canReview(sop, user);
      })
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 8)
      .map((activity) => ({ activity, sop: byId.get(activity.sopId)! }));
  },

  async getFileBlob(file: SopFile): Promise<Blob> {
    if (file.source === 'idb') {
      const blob = await idbGet<Blob>(file.key);
      if (!blob) throw new ApiError('The file could not be found in local storage.');
      return blob;
    }
    const res = await fetch(file.key);
    if (!res.ok) throw new ApiError('The file could not be downloaded.');
    return res.blob();
  },

  /** Create (no id) or update an SOP. `submit` = "Save & Submit". */
  async saveSop(user: User, input: SopFormInput, submit: boolean, id?: string): Promise<Sop> {
    await delay();
    if (!user.persona) throw new ApiError('Access not assigned.');
    if (input.file) {
      const err = validateSopFile(input.file);
      if (err) throw new ApiError(err);
    }
    const db = readDb();
    const now = new Date().toISOString();
    const existing = id ? findSop(db, id) : undefined;

    if (existing && !canEdit(existing, user)) throw new ApiError('This SOP can no longer be edited.');
    if (!existing && !input.file) throw new ApiError('SOP file is required.');
    if (existing && nextVersion(existing, !!input.file) > existing.version && !input.changeNote?.trim()) {
      throw new ApiError('Please describe what changed in the new version.');
    }

    const from = existing?.status ?? null;
    const to = submit ? statusAfterSubmit(existing) : statusAfterSave(existing);
    const version = nextVersion(existing, !!input.file);
    const newFile = input.file ? await storeFile(input.file) : null;

    let sop: Sop;
    if (existing) {
      const versions = [...existing.versions];
      if (newFile) {
        if (version === existing.version) versions[versions.length - 1] = { version, file: newFile, uploadedAt: now };
        else versions.push({ version, file: newFile, uploadedAt: now });
      }
      sop = {
        ...existing, ...pick(input), status: to, version, versions, updatedAt: now,
        submittedVersion: submit ? version : existing.submittedVersion,
      };
      db.sops = db.sops.map((s) => (s.id === sop.id ? sop : s));
    } else {
      sop = {
        id: nextSopId(db.sops), ...pick(input), status: to, version: 1, createdBy: user.id,
        createdAt: now, updatedAt: now, versions: [{ version: 1, file: newFile!, uploadedAt: now }],
        submittedVersion: submit ? 1 : undefined,
      };
      db.sops.push(sop);
    }

    const action = !existing && !submit ? A.CREATED
      : !submit ? A.SAVED
      : to === S.RESUBMITTED ? A.RESUBMITTED : A.SUBMITTED;
    log(db, {
      sopId: sop.id, action, byUserId: user.id, fromStatus: from, toStatus: to, version,
      // "What changed" for new versions; otherwise comments only when new/changed (keeps the timeline readable).
      remarks: input.changeNote?.trim()
        ? `What changed: ${input.changeNote.trim()}`
        : input.comments.trim() && input.comments.trim() !== existing?.comments ? input.comments.trim() : undefined,
      fileChange: existing && version !== existing.version ? { from: existing.version, to: version } : undefined,
    });
    writeDb(db);
    return sop;
  },

  /** "Make changes": Requested Modification → Modification In Progress. */
  async startModification(user: User, id: string): Promise<Sop> {
    await delay(300);
    const db = readDb();
    const sop = findSop(db, id);
    if (!canMakeChanges(sop, user)) throw new ApiError('Changes can only be made to your own SOPs when modification is requested.');
    const updated: Sop = { ...sop, status: S.MODIFICATION_IN_PROGRESS, updatedAt: new Date().toISOString() };
    db.sops = db.sops.map((s) => (s.id === id ? updated : s));
    log(db, { sopId: id, action: A.MODIFICATION_STARTED, byUserId: user.id, fromStatus: sop.status, toStatus: updated.status, version: sop.version });
    writeDb(db);
    return updated;
  },

  async reviewSop(user: User, id: string, decision: ReviewDecision, remarks: string): Promise<Sop> {
    await delay();
    const db = readDb();
    const sop = findSop(db, id);
    if (!canReview(sop, user)) throw new ApiError('You are not allowed to review this SOP.');
    if (remarksRequired(decision) && !remarks.trim()) throw new ApiError('Remarks are mandatory for this decision.');

    const to = statusAfterDecision[decision];
    const updated: Sop = {
      ...sop, status: to, updatedAt: new Date().toISOString(),
      reviewRemarks: remarks.trim() || undefined, reviewedBy: user.id,
    };
    db.sops = db.sops.map((s) => (s.id === id ? updated : s));
    const action = decision === 'APPROVE' ? A.APPROVED : decision === 'REJECT' ? A.REJECTED : A.MODIFICATION_REQUESTED;
    log(db, { sopId: id, action, byUserId: user.id, fromStatus: sop.status, toStatus: to, version: sop.version, remarks: remarks.trim() || undefined });
    writeDb(db);
    return updated;
  },

  async resetDemoData() {
    localStorage.removeItem(DB_KEY);
    await idbClear().catch(() => undefined);
    readDb();
  },
};

const pick = (i: SopFormInput) => ({
  name: i.name.trim(),
  category: i.category.trim(),
  subCategory: i.subCategory.trim(),
  comments: i.comments.trim(),
});
