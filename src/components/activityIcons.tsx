import type { ReactElement } from 'react';
import NoteAddOutlinedIcon from '@mui/icons-material/NoteAddOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import SendIcon from '@mui/icons-material/Send';
import EditNoteIcon from '@mui/icons-material/EditNote';
import BuildCircleOutlinedIcon from '@mui/icons-material/BuildCircleOutlined';
import ReplayIcon from '@mui/icons-material/Replay';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { ACTIVITY_ACTION as A } from '../types';
import type { ActivityAction } from '../types';

/** Icon + colour per activity action (timeline and notifications). */
export const ICONS: Record<ActivityAction, { icon: ReactElement; color: string }> = {
  [A.CREATED]: { icon: <NoteAddOutlinedIcon fontSize="small" />, color: '#3B4452' },
  [A.SAVED]: { icon: <SaveOutlinedIcon fontSize="small" />, color: '#3B4452' },
  [A.SUBMITTED]: { icon: <SendIcon fontSize="small" />, color: '#0B4A9A' },
  [A.MODIFICATION_REQUESTED]: { icon: <EditNoteIcon fontSize="small" />, color: '#8A4B00' },
  [A.MODIFICATION_STARTED]: { icon: <BuildCircleOutlinedIcon fontSize="small" />, color: '#5B2A8C' },
  [A.RESUBMITTED]: { icon: <ReplayIcon fontSize="small" />, color: '#0B5E66' },
  [A.APPROVED]: { icon: <CheckCircleIcon fontSize="small" />, color: '#1E6B26' },
  [A.REJECTED]: { icon: <CancelIcon fontSize="small" />, color: '#97144D' },
};
