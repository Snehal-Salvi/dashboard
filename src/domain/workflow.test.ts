import { describe, expect, it } from 'vitest';
import { PERSONA, SOP_STATUS as S } from '../types';
import type { Sop, User } from '../types';
import {
  belongsToTab, canReview, getRowActions, nextVersion, statusAfterDecision, statusAfterSave, statusAfterSubmit, validateSopFile,
} from './workflow';

const maker: User = { id: 'm', name: 'Maker', email: 'm@axisbank.com', department: 'Ops', persona: PERSONA.MAKER };
const reviewer: User = { id: 'r', name: 'Reviewer', email: 'r@axisbank.com', department: 'Ops', persona: PERSONA.REVIEWER };

const sop = (patch: Partial<Sop> = {}): Sop => ({
  id: 'SOP-1', name: 'Test', version: 1, category: 'C', subCategory: 'S', status: S.DRAFT, comments: '',
  createdBy: 'm', createdAt: '', updatedAt: '', versions: [], ...patch,
});

describe('status flow', () => {
  it('Draft → Submitted, Modification In Progress → Resubmitted', () => {
    expect(statusAfterSubmit(sop())).toBe(S.SUBMITTED);
    expect(statusAfterSubmit(undefined)).toBe(S.SUBMITTED);
    expect(statusAfterSubmit(sop({ status: S.MODIFICATION_IN_PROGRESS }))).toBe(S.RESUBMITTED);
  });
  it('Save keeps Draft, or Modification In Progress while modifying', () => {
    expect(statusAfterSave(undefined)).toBe(S.DRAFT);
    expect(statusAfterSave(sop({ status: S.MODIFICATION_IN_PROGRESS }))).toBe(S.MODIFICATION_IN_PROGRESS);
  });
  it('maps reviewer decisions', () => {
    expect(statusAfterDecision.APPROVE).toBe(S.APPROVED);
    expect(statusAfterDecision.REJECT).toBe(S.REJECTED);
    expect(statusAfterDecision.REQUEST_MODIFICATION).toBe(S.REQUESTED_MODIFICATION);
  });
});

describe('permissions', () => {
  it('a reviewer never reviews their own SOP', () => {
    const own = sop({ createdBy: 'r', status: S.SUBMITTED });
    expect(canReview(own, reviewer)).toBe(false);
    expect(belongsToTab(own, reviewer, 'review')).toBe(false);
  });
  it('makers cannot review', () => {
    expect(canReview(sop({ createdBy: 'x', status: S.SUBMITTED }), maker)).toBe(false);
  });
  it('shows the right row actions per status', () => {
    expect(getRowActions(sop(), maker, 'mine')).toEqual(['view', 'activity', 'edit']);
    expect(getRowActions(sop({ status: S.REQUESTED_MODIFICATION }), maker, 'mine')).toEqual(['view', 'activity', 'makeChanges']);
    expect(getRowActions(sop({ status: S.SUBMITTED }), maker, 'mine')).toEqual(['view', 'activity']);
    expect(getRowActions(sop({ status: S.RESUBMITTED }), reviewer, 'review')).toEqual(['view', 'activity', 'review']);
  });
});

describe('versioning', () => {
  it('starts at v1 and bumps once per modification cycle', () => {
    expect(nextVersion(undefined, true)).toBe(1);
    expect(nextVersion(sop({ status: S.DRAFT }), true)).toBe(1); // never submitted
    const modifying = sop({ status: S.MODIFICATION_IN_PROGRESS, version: 1, submittedVersion: 1 });
    expect(nextVersion(modifying, true)).toBe(2);
    expect(nextVersion(modifying, false)).toBe(1);
    expect(nextVersion({ ...modifying, version: 2 }, true)).toBe(2); // already bumped in this cycle
  });
});

describe('file validation', () => {
  const file = (name: string, size = 10) => new File([new Uint8Array(size)], name);
  it('accepts Word and PDF only', () => {
    expect(validateSopFile(file('a.pdf'))).toBeNull();
    expect(validateSopFile(file('a.DOCX'))).toBeNull();
    expect(validateSopFile(file('a.doc'))).toBeNull();
    expect(validateSopFile(file('a.xlsx'))).toMatch(/not supported/);
    expect(validateSopFile(file('a.pdf', 0))).toMatch(/empty/);
  });
});
