import { ACTIVITY_ACTION, PERSONA, SOP_STATUS } from '../types';
import type { ActivityAction, Persona, SopStatus } from '../types';

/** Badge colours: soft background + dark text keeps WCAG AA contrast; label text means colour is never the only cue. */
export const STATUS_META: Record<SopStatus, { label: string; bg: string; fg: string }> = {
  [SOP_STATUS.DRAFT]: { label: 'Draft', bg: '#ECEFF3', fg: '#3B4452' },
  [SOP_STATUS.SUBMITTED]: { label: 'Submitted', bg: '#E3EEFC', fg: '#0B4A9A' },
  [SOP_STATUS.REQUESTED_MODIFICATION]: { label: 'Requested Modification', bg: '#FFF1D6', fg: '#8A4B00' },
  [SOP_STATUS.MODIFICATION_IN_PROGRESS]: { label: 'Modification In Progress', bg: '#F1E6FB', fg: '#5B2A8C' },
  [SOP_STATUS.RESUBMITTED]: { label: 'Resubmitted', bg: '#DDF3F4', fg: '#0B5E66' },
  [SOP_STATUS.APPROVED]: { label: 'Approved', bg: '#E2F4E3', fg: '#1E6B26' },
  [SOP_STATUS.REJECTED]: { label: 'Rejected', bg: '#FDE5EE', fg: '#97144D' },
};

export const ACTION_LABEL: Record<ActivityAction, string> = {
  [ACTIVITY_ACTION.CREATED]: 'Created',
  [ACTIVITY_ACTION.SAVED]: 'Saved',
  [ACTIVITY_ACTION.SUBMITTED]: 'Submitted for review',
  [ACTIVITY_ACTION.MODIFICATION_REQUESTED]: 'Modification requested',
  [ACTIVITY_ACTION.MODIFICATION_STARTED]: 'Modification started',
  [ACTIVITY_ACTION.RESUBMITTED]: 'Resubmitted for review',
  [ACTIVITY_ACTION.APPROVED]: 'Approved & published',
  [ACTIVITY_ACTION.REJECTED]: 'Rejected',
};

export const PERSONA_LABEL: Record<Persona, string> = {
  [PERSONA.MAKER]: 'Maker',
  [PERSONA.REVIEWER]: 'Reviewer',
};
