// Domain types for GRAP SOP Management.
// String-literal "enums" (const objects) are used because the project compiles
// with `erasableSyntaxOnly`, which disallows TypeScript `enum`.

export const PERSONA = {
  MAKER: 'MAKER',
  REVIEWER: 'REVIEWER',
} as const;
export type Persona = (typeof PERSONA)[keyof typeof PERSONA];

export const SOP_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  REQUESTED_MODIFICATION: 'REQUESTED_MODIFICATION',
  MODIFICATION_IN_PROGRESS: 'MODIFICATION_IN_PROGRESS',
  RESUBMITTED: 'RESUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type SopStatus = (typeof SOP_STATUS)[keyof typeof SOP_STATUS];

export const ACTIVITY_ACTION = {
  CREATED: 'CREATED',
  SAVED: 'SAVED',
  SUBMITTED: 'SUBMITTED',
  MODIFICATION_REQUESTED: 'MODIFICATION_REQUESTED',
  MODIFICATION_STARTED: 'MODIFICATION_STARTED',
  RESUBMITTED: 'RESUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type ActivityAction = (typeof ACTIVITY_ACTION)[keyof typeof ACTIVITY_ACTION];

export type ReviewDecision = 'APPROVE' | 'REJECT' | 'REQUEST_MODIFICATION';

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  /** `null` = signed in through SSO but no GRAP persona assigned. */
  persona: Persona | null;
}

/** Metadata of an uploaded SOP file. The binary lives in IndexedDB (uploads) or /public (seed data). */
export interface SopFile {
  name: string;
  mimeType: string;
  size: number;
  source: 'static' | 'idb';
  /** URL for `static`, IndexedDB key for `idb`. */
  key: string;
}

export interface SopVersion {
  version: number;
  file: SopFile;
  uploadedAt: string;
}

export interface Sop {
  id: string;
  name: string;
  version: number;
  category: string;
  subCategory: string;
  status: SopStatus;
  comments: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  /** Latest reviewer remarks — shown to the creator while modifying. */
  reviewRemarks?: string;
  reviewedBy?: string;
  /** Last version that was sent for review; a new file after that creates the next version. */
  submittedVersion?: number;
  versions: SopVersion[];
}

export interface Activity {
  id: string;
  sopId: string;
  at: string;
  action: ActivityAction;
  byUserId: string;
  fromStatus: SopStatus | null;
  toStatus: SopStatus;
  remarks?: string;
  version: number;
  /** Present when the file was replaced, e.g. { from: 1, to: 2 }. */
  fileChange?: { from: number; to: number };
}

export type SopTab = 'mine' | 'review';

export interface SopFilters {
  search: string;
  category: string;
  subCategory: string;
  status: SopStatus | '';
  from: string; // yyyy-mm-dd (created date)
  to: string;
}

export interface SopFormInput {
  name: string;
  category: string;
  subCategory: string;
  comments: string;
  /** Required when a new version is uploaded: what changed, so reviewers can focus on the changes. */
  changeNote?: string;
  /** A newly picked file; `null` keeps the current file. */
  file: File | null;
}
