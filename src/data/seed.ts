// Demo data aligned with the GRAP mockup (SOP IDs, people, grievance categories), so every
// status, tab and action can be shown right after sign-in. Dates are relative to "now".

import { ACTIVITY_ACTION as A, PERSONA, SOP_STATUS as S } from '../types';
import type { Activity, Sop, SopFile, User } from '../types';

export const USERS: User[] = [
  { id: 'u1', name: 'Priya Singh', email: 'priya.singh@axisbank.com', department: 'GRAP – Grievance Redressal', persona: PERSONA.REVIEWER },
  { id: 'u2', name: 'Mohith Kumar', email: 'mohith.kumar@axisbank.com', department: 'GRAP – Nodal Desk', persona: PERSONA.MAKER },
  { id: 'u3', name: 'Anu Jha', email: 'anu.jha@axisbank.com', department: 'GRAP – Legal & Statutory', persona: PERSONA.REVIEWER },
  { id: 'u4', name: 'Rahul Mehta', email: 'rahul.mehta@axisbank.com', department: 'GRAP – Process Excellence', persona: PERSONA.REVIEWER },
  { id: 'u5', name: 'Sneha Iyer', email: 'sneha.iyer@axisbank.com', department: 'GRAP – Cards Desk', persona: PERSONA.MAKER },
  { id: 'u6', name: 'Vikram Rao', email: 'vikram.rao@axisbank.com', department: 'Treasury Operations', persona: null },
];

/** Category master (from the mockup). Sub-categories depend on the category. */
export const CATEGORIES: Record<string, string[]> = {
  Cards: ['Credit Card Dispute', 'Chargeback', 'Fees & Charges'],
  Payments: ['UPI', 'NEFT/RTGS', 'IMPS'],
  Loans: ['Closure', 'EMI', 'Documents'],
  ATM: ['Cash Shortage', 'Card Retained'],
  'Legal & Statutory': ['Legal Notice', 'Statutory Notice'],
};

const daysAgo = (d: number, h = 10, m = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - d);
  date.setHours(h, m, 0, 0);
  // Keep "today" events in the past (and in order) whatever time the demo is opened.
  const latest = Date.now() - (24 - h) * 60_000 - (60 - m) * 1000;
  return new Date(Math.min(date.getTime(), latest)).toISOString();
};

const pdf = (id: string, v: number): SopFile => ({
  name: `${id}-v${v}.pdf`, mimeType: 'application/pdf', size: 2600, source: 'static', key: `/samples/${id}-v${v}.pdf`,
});

type Step = [daysAgo: number, action: Activity['action'], by: string, from: Sop['status'] | null, to: Sop['status'], version: number, remarks?: string];
interface SeedSop { id: string; name: string; category: string; subCategory: string; createdBy: string; comments: string; steps: Step[] }

const SEED: SeedSop[] = [
  {
    id: 'SOP-0012', name: 'Credit Card Dispute Handling', category: 'Cards', subCategory: 'Credit Card Dispute', createdBy: 'u1',
    comments: 'Updated TAT to 30 days and added L3 escalation.',
    steps: [
      [65, A.CREATED, 'u1', null, S.DRAFT, 1],
      [65, A.SUBMITTED, 'u1', S.DRAFT, S.SUBMITTED, 1],
      [63, A.MODIFICATION_REQUESTED, 'u4', S.SUBMITTED, S.REQUESTED_MODIFICATION, 1, 'Align the dispute TAT with the RBI master direction.'],
      [62, A.MODIFICATION_STARTED, 'u1', S.REQUESTED_MODIFICATION, S.MODIFICATION_IN_PROGRESS, 1],
      [61, A.RESUBMITTED, 'u1', S.MODIFICATION_IN_PROGRESS, S.RESUBMITTED, 2, 'TAT aligned to RBI master direction.'],
      [8, A.MODIFICATION_REQUESTED, 'u4', S.RESUBMITTED, S.REQUESTED_MODIFICATION, 2, 'Reduce TAT to 30 days and add an L3 escalation.'],
      [7, A.MODIFICATION_STARTED, 'u1', S.REQUESTED_MODIFICATION, S.MODIFICATION_IN_PROGRESS, 2],
      [6, A.RESUBMITTED, 'u1', S.MODIFICATION_IN_PROGRESS, S.RESUBMITTED, 3, 'Updated TAT to 30 days and added L3 escalation.'],
      [3, A.APPROVED, 'u4', S.RESUBMITTED, S.APPROVED, 3, 'Looks good. Publishing to the knowledge base.'],
    ],
  },
  {
    id: 'SOP-0018', name: 'UPI Failed Transaction Refund', category: 'Payments', subCategory: 'UPI', createdBy: 'u1',
    comments: 'Covers auto-reversal and manual refund for failed UPI debits.',
    steps: [[4, A.CREATED, 'u1', null, S.DRAFT, 1], [3, A.SUBMITTED, 'u1', S.DRAFT, S.SUBMITTED, 1]],
  },
  {
    id: 'SOP-0021', name: 'Loan Closure – Document Return', category: 'Loans', subCategory: 'Documents', createdBy: 'u1',
    comments: 'Draft – awaiting inputs from the Loans team.',
    steps: [[1, A.CREATED, 'u1', null, S.DRAFT, 1]],
  },
  {
    id: 'SOP-0009', name: 'ATM Cash Shortage', category: 'ATM', subCategory: 'Cash Shortage', createdBy: 'u1',
    comments: 'Added reconciliation steps for cash-shortage complaints.',
    steps: [
      [20, A.SUBMITTED, 'u1', null, S.SUBMITTED, 1],
      [18, A.MODIFICATION_REQUESTED, 'u3', S.SUBMITTED, S.REQUESTED_MODIFICATION, 1, 'Add the switch-log check before raising the claim.'],
      [17, A.MODIFICATION_STARTED, 'u1', S.REQUESTED_MODIFICATION, S.MODIFICATION_IN_PROGRESS, 1],
      [16, A.RESUBMITTED, 'u1', S.MODIFICATION_IN_PROGRESS, S.RESUBMITTED, 2, 'Added switch-log check.'],
      [1, A.MODIFICATION_REQUESTED, 'u3', S.RESUBMITTED, S.REQUESTED_MODIFICATION, 2, 'Please add the escalation matrix and the 5-day TAT for branch reconciliation.'],
    ],
  },
  {
    id: 'SOP-0024', name: 'Legal Notice Handling', category: 'Legal & Statutory', subCategory: 'Legal Notice', createdBy: 'u3',
    comments: 'Added escalation matrix.',
    steps: [
      [9, A.SUBMITTED, 'u3', null, S.SUBMITTED, 1],
      [5, A.MODIFICATION_REQUESTED, 'u4', S.SUBMITTED, S.REQUESTED_MODIFICATION, 1, 'Please add the escalation matrix for notices from courts.'],
      [2, A.MODIFICATION_STARTED, 'u3', S.REQUESTED_MODIFICATION, S.MODIFICATION_IN_PROGRESS, 1],
      [0, A.RESUBMITTED, 'u3', S.MODIFICATION_IN_PROGRESS, S.RESUBMITTED, 2, 'Added escalation matrix.'],
    ],
  },
  {
    id: 'SOP-0025', name: 'Statutory Notice – LEA Requests', category: 'Legal & Statutory', subCategory: 'Statutory Notice', createdBy: 'u2',
    comments: 'Handling of Law Enforcement Agency requests and account freezes.',
    steps: [[2, A.SUBMITTED, 'u2', null, S.SUBMITTED, 1]],
  },
  {
    id: 'SOP-0016', name: 'Card Chargeback Process', category: 'Cards', subCategory: 'Chargeback', createdBy: 'u5',
    comments: 'Network chargeback timelines as per Visa / Mastercard / RuPay rules.',
    steps: [[5, A.SUBMITTED, 'u5', null, S.SUBMITTED, 1]],
  },
  {
    id: 'SOP-0011', name: 'NEFT Return Handling', category: 'Payments', subCategory: 'NEFT/RTGS', createdBy: 'u1',
    comments: 'NEFT returns and customer communication.',
    steps: [
      [14, A.SUBMITTED, 'u1', null, S.SUBMITTED, 1],
      [13, A.REJECTED, 'u4', S.SUBMITTED, S.REJECTED, 1, 'Duplicates SOP-0007; please update that SOP instead.'],
    ],
  },
  {
    id: 'SOP-0027', name: 'EMI Bounce Charges', category: 'Loans', subCategory: 'EMI', createdBy: 'u1',
    comments: 'Bounce charge levy and waiver process.',
    steps: [
      [6, A.SUBMITTED, 'u1', null, S.SUBMITTED, 1],
      [2, A.MODIFICATION_REQUESTED, 'u3', S.SUBMITTED, S.REQUESTED_MODIFICATION, 1, 'Add waiver DOP limits.'],
      [0, A.MODIFICATION_STARTED, 'u1', S.REQUESTED_MODIFICATION, S.MODIFICATION_IN_PROGRESS, 1],
    ],
  },
  {
    id: 'SOP-0029', name: 'IMPS Failed Credit Reversal', category: 'Payments', subCategory: 'IMPS', createdBy: 'u2',
    comments: 'Reversal of IMPS debits where the beneficiary was not credited.',
    steps: [
      [7, A.SUBMITTED, 'u2', null, S.SUBMITTED, 1],
      [1, A.MODIFICATION_REQUESTED, 'u1', S.SUBMITTED, S.REQUESTED_MODIFICATION, 1, 'Add the T+1 auto-reversal rule and customer compensation as per the RBI TAT circular.'],
    ],
  },
  {
    id: 'SOP-0030', name: 'Debit Card Retained at ATM', category: 'ATM', subCategory: 'Card Retained', createdBy: 'u2',
    comments: '',
    steps: [[0, A.CREATED, 'u2', null, S.DRAFT, 1]],
  },
];

export function buildSeed(): { sops: Sop[]; activities: Activity[] } {
  const sops: Sop[] = [];
  const activities: Activity[] = [];

  for (const s of SEED) {
    const last = s.steps[s.steps.length - 1];
    const maxVersion = Math.max(...s.steps.map((st) => st[5]));
    const lastReview = [...s.steps].reverse().find((st) => st[1] === A.MODIFICATION_REQUESTED || st[1] === A.REJECTED || st[1] === A.APPROVED);
    const versionDay = (v: number) => s.steps.find((st) => st[5] === v)?.[0] ?? s.steps[0][0];

    sops.push({
      id: s.id, name: s.name, category: s.category, subCategory: s.subCategory, comments: s.comments,
      createdBy: s.createdBy, status: last[4], version: maxVersion,
      createdAt: daysAgo(s.steps[0][0], 10), updatedAt: daysAgo(last[0], 9 + s.steps.length, 15),
      reviewRemarks: lastReview?.[6], reviewedBy: lastReview?.[2],
      submittedVersion: last[4] === S.DRAFT ? undefined : maxVersion,
      versions: Array.from({ length: maxVersion }, (_, i) => ({ version: i + 1, file: pdf(s.id, i + 1), uploadedAt: daysAgo(versionDay(i + 1), 10) })),
    });

    s.steps.forEach(([d, action, by, from, to, version, remarks], i) => {
      const prevVersion = i > 0 ? s.steps[i - 1][5] : version;
      activities.push({
        id: `${s.id}-a${i}`, sopId: s.id, at: daysAgo(d, 10 + i, 5 * i), action, byUserId: by,
        fromStatus: from, toStatus: to, remarks, version,
        fileChange: version !== prevVersion ? { from: prevVersion, to: version } : undefined,
      });
    });
  }
  return { sops, activities };
}
