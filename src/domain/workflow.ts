// Pure business rules for the SOP status flow and permissions.
// Kept free of React/storage so the rules are easy to read, test and reuse on a real backend.

import { PERSONA, SOP_STATUS } from '../types';
import type { ReviewDecision, Sop, SopStatus, SopTab, User } from '../types';

export type RowAction = 'view' | 'activity' | 'edit' | 'makeChanges' | 'review';

const EDITABLE: SopStatus[] = [SOP_STATUS.DRAFT, SOP_STATUS.MODIFICATION_IN_PROGRESS];
const REVIEWABLE: SopStatus[] = [SOP_STATUS.SUBMITTED, SOP_STATUS.RESUBMITTED];

export const isOwner = (sop: Sop, user: User) => sop.createdBy === user.id;
export const isReviewer = (user: User | null) => user?.persona === PERSONA.REVIEWER;

export const canEdit = (sop: Sop, user: User) => isOwner(sop, user) && EDITABLE.includes(sop.status);

export const canMakeChanges = (sop: Sop, user: User) =>
  isOwner(sop, user) && sop.status === SOP_STATUS.REQUESTED_MODIFICATION;

/** Reviewers can review SOPs of *other* users only. */
export const canReview = (sop: Sop, user: User) =>
  isReviewer(user) && !isOwner(sop, user) && REVIEWABLE.includes(sop.status);

/** Which SOPs belong in a tab. A user's own SOPs never appear in "For My Review". */
export const belongsToTab = (sop: Sop, user: User, tab: SopTab) =>
  tab === 'mine' ? isOwner(sop, user) : canReview(sop, user);

/** Row actions per tab, persona and status (requirements §5.4). */
export function getRowActions(sop: Sop, user: User, tab: SopTab): RowAction[] {
  const actions: RowAction[] = ['view', 'activity'];
  if (tab === 'mine') {
    if (canEdit(sop, user)) actions.push('edit');
    if (canMakeChanges(sop, user)) actions.push('makeChanges');
  } else if (canReview(sop, user)) {
    actions.push('review');
  }
  return actions;
}

/** "Save" keeps a modification in progress; otherwise the SOP is a Draft. */
export const statusAfterSave = (current?: Sop): SopStatus =>
  current?.status === SOP_STATUS.MODIFICATION_IN_PROGRESS ? SOP_STATUS.MODIFICATION_IN_PROGRESS : SOP_STATUS.DRAFT;

/** "Save & Submit" → Resubmitted if it went through a modification, else Submitted. */
export const statusAfterSubmit = (current?: Sop): SopStatus =>
  current?.status === SOP_STATUS.MODIFICATION_IN_PROGRESS ? SOP_STATUS.RESUBMITTED : SOP_STATUS.SUBMITTED;

export const statusAfterDecision: Record<ReviewDecision, SopStatus> = {
  APPROVE: SOP_STATUS.APPROVED,
  REJECT: SOP_STATUS.REJECTED,
  REQUEST_MODIFICATION: SOP_STATUS.REQUESTED_MODIFICATION,
};

export const remarksRequired = (decision: ReviewDecision) => decision !== 'APPROVE';

/**
 * Versioning: a new file uploaded after the SOP has been sent for review creates a new
 * version (v1 → v2). Replacing the file of a never-submitted draft keeps the version.
 */
export function nextVersion(current: Sop | undefined, fileReplaced: boolean): number {
  if (!current) return 1;
  const sentForReview = current.submittedVersion;
  // Only one version bump per modification cycle, however many times the file is replaced.
  if (fileReplaced && sentForReview !== undefined && current.version === sentForReview) return sentForReview + 1;
  return current.version;
}

// ---- File validation (requirements §6.2) ----
export const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'] as const;
export const MAX_FILE_SIZE_MB = 10;

export function validateSopFile(file: File): string | null {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return `"${file.name}" is not supported. Upload a Word (.doc, .docx) or PDF (.pdf) file.`;
  }
  if (file.size === 0) return 'The selected file is empty.';
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `File is larger than ${MAX_FILE_SIZE_MB} MB.`;
  return null;
}
