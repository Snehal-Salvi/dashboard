import { Link as RouterLink } from 'react-router';
import { Box, Button, Drawer, IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { api } from '../data/api';
import { useAsync } from '../hooks/useAsync';
import { ActivityTimeline } from './ActivityTimeline';
import { ErrorState, LoadingState, StatusBadge } from './common';

/** Side drawer with an SOP's activity, opened from the list (as in the mockup). */
export function ActivityDrawer({ sopId, onClose }: { sopId: string | null; onClose: () => void }) {
  return (
    <Drawer
      anchor="right"
      open={!!sopId}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: '30rem' }, maxWidth: '100vw' }, role: 'dialog', 'aria-labelledby': 'activity-drawer-title' } as object }}
    >
      {sopId && <DrawerBody sopId={sopId} onClose={onClose} />}
    </Drawer>
  );
}

function DrawerBody({ sopId, onClose }: { sopId: string; onClose: () => void }) {
  const { data, loading, error, reload } = useAsync(async () => ({ sop: await api.getSop(sopId), items: await api.getActivity(sopId) }), [sopId]);
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Stack direction="row" spacing={1} sx={{ p: 2, pl: 3, alignItems: 'flex-start', borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, bgcolor: '#fff', zIndex: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography id="activity-drawer-title" variant="h3" component="h2">Activity – {sopId}</Typography>
          {data && <Typography color="text.secondary" sx={{ wordBreak: 'break-word' }}>{data.sop.name} · v{data.sop.version}</Typography>}
          {data && <Box sx={{ mt: 1 }}><StatusBadge status={data.sop.status} /></Box>}
        </Box>
        <IconButton onClick={onClose} aria-label="Close activity"><CloseIcon /></IconButton>
      </Stack>
      <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
        {loading ? <LoadingState label="Loading activity…" /> : error ? <ErrorState message={error} onRetry={reload} /> : <ActivityTimeline items={data!.items} dense />}
      </Box>
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button fullWidth component={RouterLink} to={`/sops/${sopId}/activity`} startIcon={<OpenInFullIcon />}>Open full page</Button>
      </Box>
    </Box>
  );
}
