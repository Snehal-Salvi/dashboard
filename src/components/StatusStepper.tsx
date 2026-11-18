import { Box, Paper, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { STATUS_META } from '../domain/constants';
import { SOP_STATUS as S } from '../types';
import type { Activity, Sop, SopStatus } from '../types';

const FLOW: SopStatus[] = [S.DRAFT, S.SUBMITTED, S.REQUESTED_MODIFICATION, S.MODIFICATION_IN_PROGRESS, S.RESUBMITTED];

/**
 * Where the SOP is in the review flow (from the mockup). Built from real activity, so steps the
 * SOP never went through (e.g. no modification cycle) are shown as skipped, not as "done".
 */
export function StatusStepper({ sop, activity }: { sop: Sop; activity: Activity[] }) {
  const visited = new Set<SopStatus>(activity.map((a) => a.toStatus));
  const final = sop.status === S.APPROVED || sop.status === S.REJECTED;
  const currentIdx = final ? FLOW.length : FLOW.indexOf(sop.status);

  const steps = [
    ...FLOW.map((st, i) => ({
      label: STATUS_META[st].label,
      state: i === currentIdx ? 'current' : i < currentIdx ? (visited.has(st) ? 'done' : 'skipped') : 'todo',
    })),
    {
      label: final ? STATUS_META[sop.status].label : 'Approved / Rejected',
      state: final ? (sop.status === S.APPROVED ? 'approved' : 'rejected') : 'todo',
    },
  ];

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, mb: 3, px: 2, py: 1.5 }}>
      <Box
        component="ol"
        aria-label="Status flow"
        sx={{ m: 0, p: 0, listStyle: 'none', display: 'grid', rowGap: 2, gridTemplateColumns: { xs: 'repeat(3, minmax(0, 1fr))', md: 'repeat(6, minmax(0, 1fr))' } }}
      >
        {steps.map((s, i) => {
          const color =
            s.state === 'approved' || s.state === 'done' ? '#2E7D32'
            : s.state === 'rejected' ? '#97144D'
            : s.state === 'current' ? '#97144D' : '#9AA1AC';
          const filled = s.state === 'done' || s.state === 'approved' || s.state === 'rejected';
          return (
            <Box
              component="li"
              key={s.label}
              aria-current={s.state === 'current' ? 'step' : undefined}
              sx={{
                textAlign: 'center', position: 'relative', px: 0.5, minWidth: 0,
                // Connector lines only when all steps sit on one row.
                '&:not(:last-child)::after': {
                  display: { xs: 'none', md: 'block' },
                  content: '""', position: 'absolute', top: '0.75rem', left: 'calc(50% + 1rem)', right: 'calc(-50% + 1rem)', height: 2,
                  bgcolor: s.state === 'done' ? '#2E7D32' : '#E2E2E2', borderTop: s.state === 'skipped' ? '2px dashed #C9CDD3' : undefined,
                },
              }}
            >
              <Box
                sx={{
                  width: '1.625rem', height: '1.625rem', mx: 'auto', mb: 0.5, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '0.75rem', fontWeight: 900,
                  border: `0.125rem ${s.state === 'skipped' ? 'dashed' : 'solid'} ${color}`, bgcolor: filled ? color : '#fff', color: filled ? '#fff' : color,
                }}
              >
                {s.state === 'done' || s.state === 'approved' ? <CheckIcon sx={{ fontSize: '1rem' }} /> : i + 1}
              </Box>
              <Typography
                variant="caption"
                sx={{ display: 'block', lineHeight: 1.25, color, fontWeight: s.state === 'current' || s.state === 'approved' || s.state === 'rejected' ? 900 : 400 }}
              >
                {s.label}
                {s.state === 'skipped' && <Box component="span" sx={{ display: 'block', fontSize: '0.625rem' }}>(skipped)</Box>}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
