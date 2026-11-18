import { Link as RouterLink, useParams } from 'react-router';
import { Button, Paper, Stack } from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { ErrorState, LoadingState, PageHeader, StatusBadge } from '../components/common';
import { api } from '../data/api';
import { useAsync } from '../hooks/useAsync';
import { NotFoundPage } from './StatusPages';

/** Full-page activity history (also available as a drawer from the SOP list). */
export function SopActivityPage() {
  const { id = '' } = useParams();
  const { data, loading, error, reload } = useAsync(async () => ({ sop: await api.getSop(id), items: await api.getActivity(id) }), [id]);

  if (loading) return <LoadingState label="Loading activity…" />;
  if (error || !data) return /not found/i.test(error ?? '') ? <NotFoundPage message={error!} /> : <ErrorState message={error ?? 'Error'} onRetry={reload} />;
  const { sop, items } = data;

  return (
    <>
      <PageHeader
        title="SOP activity"
        subtitle={<>{sop.id} · {sop.name} · <strong>v{sop.version}</strong></>}
        back={`/sops/${sop.id}`}
        crumbs={[{ label: 'SOPs', to: '/' }, { label: sop.id, to: `/sops/${sop.id}` }, { label: 'Activity' }]}
        actions={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <StatusBadge status={sop.status} size="medium" />
            <Button component={RouterLink} to={`/sops/${sop.id}`} startIcon={<VisibilityOutlinedIcon />} variant="outlined">View SOP</Button>
          </Stack>
        }
      />
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        <ActivityTimeline items={items} />
      </Paper>
    </>
  );
}
