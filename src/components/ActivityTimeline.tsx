import { Avatar, Box, Chip, Stack, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { api } from '../data/api';
import { ACTION_LABEL } from '../domain/constants';
import { ACTIVITY_ACTION as A } from '../types';
import type { Activity } from '../types';
import { formatDateTime } from '../utils/format';
import { EmptyState, StatusBadge } from './common';
import { ICONS } from './activityIcons';


/** Newest-first activity timeline (requirements §8). Used on the Activity page and in the list's drawer. */
export function ActivityTimeline({ items, dense }: { items: Activity[]; dense?: boolean }) {
  if (items.length === 0) return <EmptyState title="No activity yet" />;
  return (
    <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }} aria-label="Activity, newest first">
      {items.map((a, i) => <TimelineItem key={a.id} activity={a} last={i === items.length - 1} dense={dense} />)}
    </Box>
  );
}

function TimelineItem({ activity: a, last, dense }: { activity: Activity; last: boolean; dense?: boolean }) {
  const by = api.getUser(a.byUserId);
  const meta = ICONS[a.action];
  const label = a.action === A.SUBMITTED && !a.fromStatus ? 'Created & submitted for review' : ACTION_LABEL[a.action];

  return (
    <Box component="li" sx={{ display: 'grid', gridTemplateColumns: '2.5rem minmax(0, 1fr)', columnGap: { xs: 1.5, sm: 2 } }}>
      {/* Rail */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ width: '2.25rem', height: '2.25rem', bgcolor: `${meta.color}1A`, color: meta.color, border: `2px solid ${meta.color}` }} aria-hidden>
          {meta.icon}
        </Avatar>
        {!last && <Box sx={{ flex: 1, width: 2, bgcolor: 'divider', my: 0.5 }} />}
      </Box>

      {/* Content */}
      <Box sx={{ pb: last ? 0 : 3, minWidth: 0 }}>
        <Stack direction={dense ? 'column' : { xs: 'column', sm: 'row' }} spacing={dense ? 0.25 : { xs: 0.25, sm: 1 }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'baseline' } }}>
          <Typography sx={{ fontWeight: 700, color: meta.color }}>{label}</Typography>
          <Typography variant="body2" color="text.secondary" component="time" dateTime={a.at} sx={{ whiteSpace: 'nowrap' }}>
            {formatDateTime(a.at)}
          </Typography>
        </Stack>

        <Typography variant="body2" sx={{ mt: 0.5, wordBreak: 'break-word' }}>
          by <strong>{by?.name ?? 'Unknown user'}</strong>{' '}
          <Box component="span" sx={{ color: 'text.secondary' }}>({by?.email ?? a.byUserId})</Box>
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center', flexWrap: 'wrap', gap: 1, '& > *': { m: '0 !important' } }}>
          {a.fromStatus ? <StatusBadge status={a.fromStatus} /> : <Chip size="small" label="New" variant="outlined" />}
          <ArrowForwardIcon fontSize="small" sx={{ color: 'text.secondary' }} aria-label="to" />
          <StatusBadge status={a.toStatus} />
          <Chip size="small" variant="outlined" label={`Version v${a.version}`} sx={{ fontWeight: 700 }} />
          {a.fileChange && (
            <Chip size="small" color="primary" label={`File replaced: v${a.fileChange.from} → v${a.fileChange.to}`} sx={{ fontWeight: 700 }} />
          )}
        </Stack>

        {a.remarks && (
          <Box sx={{ mt: 1.25, p: 1.5, bgcolor: 'background.default', borderLeft: `3px solid ${meta.color}`, borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              {a.action === A.APPROVED || a.action === A.REJECTED || a.action === A.MODIFICATION_REQUESTED ? 'Reviewer remarks' : 'Comments'}
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{a.remarks}</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
