import { useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router';
import { Alert, Box, Button, Divider, List, ListItemButton, ListItemText, Paper, Stack, Typography } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import BuildCircleOutlinedIcon from '@mui/icons-material/BuildCircleOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import { ErrorState, LoadingState, PageHeader } from '../components/common';
import { DocumentPanel } from '../components/DocumentPanel';
import { StatusStepper } from '../components/StatusStepper';
import { SopDetails } from '../components/SopDetails';
import { useCurrentUser } from '../context/AuthContext';
import { useNotify } from '../context/NotifyContext';
import { api } from '../data/api';
import { canEdit, canMakeChanges, canReview, isOwner } from '../domain/workflow';
import { useAsync } from '../hooks/useAsync';
import { SOP_STATUS } from '../types';
import { formatDateTime } from '../utils/format';
import { NotFoundPage } from './StatusPages';

/** SOP details + file preview (row action "View"). Shows only the actions allowed for this user/status. */
export function SopViewPage() {
  const { id = '' } = useParams();
  const user = useCurrentUser();
  const notify = useNotify();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(async () => ({ sop: await api.getSop(id), activity: await api.getActivity(id) }), [id]);
  const sop = data?.sop;
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <LoadingState label="Loading SOP…" />;
  if (error || !sop) return /not found/i.test(error ?? '') ? <NotFoundPage message={error!} /> : <ErrorState message={error ?? 'Not found'} onRetry={reload} />;

  const shown = sop.versions.find((v) => v.version === selectedVersion) ?? sop.versions[sop.versions.length - 1];
  const reviewer = sop.reviewedBy ? api.getUser(sop.reviewedBy) : undefined;

  const makeChanges = async () => {
    setBusy(true);
    try {
      await api.startModification(user, sop.id);
      notify(`${sop.id} is now "Modification In Progress".`, 'info');
      navigate(`/sops/${sop.id}/edit`);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not start modification.', 'error');
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title={sop.name}
        subtitle={`${sop.id} · Latest version v${sop.version}`}
        back={isOwner(sop, user) ? '/' : '/?tab=review'}
        crumbs={[{ label: 'SOPs', to: isOwner(sop, user) ? '/' : '/?tab=review' }, { label: sop.id }]}
        actions={
          <>
            <Button component={RouterLink} to={`/sops/${sop.id}/activity`} startIcon={<HistoryIcon />} variant="outlined">Activity</Button>
            {canEdit(sop, user) && <Button component={RouterLink} to={`/sops/${sop.id}/edit`} startIcon={<EditOutlinedIcon />} variant="contained">Edit</Button>}
            {canMakeChanges(sop, user) && <Button onClick={makeChanges} disabled={busy} startIcon={<BuildCircleOutlinedIcon />} variant="contained">Make changes</Button>}
            {canReview(sop, user) && <Button component={RouterLink} to={`/sops/${sop.id}/review`} startIcon={<RateReviewOutlinedIcon />} variant="contained">Review</Button>}
          </>
        }
      />

      {sop.reviewRemarks && (sop.status === SOP_STATUS.REQUESTED_MODIFICATION || sop.status === SOP_STATUS.REJECTED || sop.status === SOP_STATUS.APPROVED) && (
        <Alert severity={sop.status === SOP_STATUS.APPROVED ? 'success' : sop.status === SOP_STATUS.REJECTED ? 'error' : 'warning'} sx={{ mb: 3 }}>
          <strong>{reviewer?.name ?? 'Reviewer'}:</strong> {sop.reviewRemarks}
        </Alert>
      )}
      {sop.status === SOP_STATUS.APPROVED && !sop.reviewRemarks && <Alert severity="success" sx={{ mb: 3 }}>Approved and published to the GRAP knowledge base.</Alert>}

      <StatusStepper sop={sop} activity={data!.activity} />

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 7fr) minmax(0, 5fr)' }, alignItems: 'start' }}>
        <Box sx={{ minWidth: 0 }}>
          {shown.version !== sop.version && (
            <Alert severity="info" sx={{ mb: 1.5 }} action={<Button color="inherit" size="small" onClick={() => setSelectedVersion(null)}>Show latest</Button>}>
              You are viewing an older version (v{shown.version}).
            </Alert>
          )}
          <DocumentPanel key={shown.version} sop={sop} version={shown} />
        </Box>
        <Stack spacing={3}>
          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
            <SopDetails sop={sop} />
          </Paper>
          <Paper variant="outlined" sx={{ borderRadius: 3 }}>
            <Typography variant="h3" component="h2" sx={{ px: 3, pt: 2.5, pb: 1 }}>Versions</Typography>
            <Divider />
            <List aria-label="File versions">
              {[...sop.versions].reverse().map((v) => (
                <ListItemButton key={v.version} selected={v.version === shown.version} onClick={() => setSelectedVersion(v.version)} sx={{ px: 3 }}>
                  <ListItemText
                    primary={`v${v.version}${v.version === sop.version ? ' (latest)' : ''}`}
                    secondary={`${v.file.name} · ${formatDateTime(v.uploadedAt)}`}
                    slotProps={{ primary: { sx: { fontWeight: 700 } }, secondary: { sx: { wordBreak: 'break-all' } } }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        </Stack>
      </Box>
    </>
  );
}
