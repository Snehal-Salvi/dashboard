import { useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router';
import { Alert, Box, Button, Chip, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import HighlightOffIcon from '@mui/icons-material/HighlightOffOutlined';
import EditNoteIcon from '@mui/icons-material/EditNote';
import HistoryIcon from '@mui/icons-material/History';
import { ConfirmDialog, ErrorState, LoadingState, PageHeader } from '../components/common';
import { SopDetails } from '../components/SopDetails';
import { useCurrentUser } from '../context/AuthContext';
import { useNotify } from '../context/NotifyContext';
import { api } from '../data/api';
import { STATUS_META } from '../domain/constants';
import { canReview, isOwner, remarksRequired } from '../domain/workflow';
import { useAsync } from '../hooks/useAsync';
import type { Activity, ReviewDecision, Sop } from '../types';
import { DocumentPanel } from '../components/DocumentPanel';
import { StatusStepper } from '../components/StatusStepper';
import { NotFoundPage } from './StatusPages';

const MAX_REMARKS = 1000;

const DECISIONS: Record<ReviewDecision, { label: string; past: string; color: 'success' | 'error' | 'primary'; confirm: boolean }> = {
  APPROVE: { label: 'Approve', past: 'approved and published to the knowledge base', color: 'success', confirm: true },
  REQUEST_MODIFICATION: { label: 'Request Modification', past: 'sent back to the creator for modification', color: 'primary', confirm: true },
  REJECT: { label: 'Reject', past: 'rejected', color: 'error', confirm: true },
};

export function SopReviewPage() {
  const { id = '' } = useParams();
  const user = useCurrentUser();
  const { data, loading, error, reload } = useAsync(async () => ({ sop: await api.getSop(id), activity: await api.getActivity(id) }), [id]);
  const sop = data?.sop;

  if (loading) return <LoadingState label="Loading SOP…" />;
  if (error || !sop) return /not found/i.test(error ?? '') ? <NotFoundPage message={error!} /> : <ErrorState message={error ?? 'Not found'} onRetry={reload} />;
  if (!canReview(sop, user)) {
    return (
      <NotFoundPage
        message={isOwner(sop, user)
          ? 'You cannot review your own SOP. Another reviewer has to review it.'
          : `${sop.id} is "${STATUS_META[sop.status].label}" and is not awaiting review.`}
      />
    );
  }
  return <ReviewForm sop={sop} activity={data!.activity} />;
}

const QUICK_REMARKS = [
  { label: 'Escalation matrix missing', text: 'Please add the escalation matrix.' },
  { label: 'TAT mismatch', text: 'TAT does not match the CTST master.' },
  { label: 'Template outdated', text: 'Please use the latest SOP template.' },
];

function ReviewForm({ sop, activity }: { sop: Sop; activity: Activity[] }) {
  const user = useCurrentUser();
  const notify = useNotify();
  const navigate = useNavigate();
  const [remarks, setRemarks] = useState('');
  const [remarksError, setRemarksError] = useState('');
  const [pending, setPending] = useState<ReviewDecision | null>(null);
  const [saving, setSaving] = useState(false);

  const start = (d: ReviewDecision) => {
    if (remarksRequired(d) && !remarks.trim()) {
      setRemarksError(`Remarks are mandatory to ${DECISIONS[d].label.toLowerCase()}. Tell the creator what needs to change or why.`);
      document.getElementById('review-remarks')?.focus();
      return;
    }
    if (remarks.length > MAX_REMARKS) return;
    setRemarksError('');
    if (DECISIONS[d].confirm) setPending(d);
    else void decide(d);
  };

  const decide = async (d: ReviewDecision) => {
    setSaving(true);
    try {
      await api.reviewSop(user, sop.id, d, remarks);
      notify(`${sop.id} v${sop.version} ${DECISIONS[d].past}.`, d === 'REJECT' ? 'info' : 'success');
      navigate('/?tab=review', { replace: true });
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not save the decision.', 'error');
      setSaving(false);
      setPending(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Review SOP"
        subtitle={`${sop.id} · v${sop.version} · submitted by ${api.getUser(sop.createdBy)?.name}`}
        back="/?tab=review"
        crumbs={[{ label: 'SOPs', to: '/' }, { label: 'For My Review', to: '/?tab=review' }, { label: sop.id }]}
        actions={<Button component={RouterLink} to={`/sops/${sop.id}/activity`} startIcon={<HistoryIcon />}>Activity</Button>}
      />

      <StatusStepper sop={sop} activity={activity} />

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 7fr) minmax(0, 5fr)' }, alignItems: 'start' }}>
        {/* Left: document preview / compare */}
        <DocumentPanel sop={sop} />

        {/* Right: details + decision */}
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
          <SopDetails sop={sop} />
          {sop.reviewRemarks && (
            <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>
              <strong>Previous review remarks:</strong> {sop.reviewRemarks}
            </Alert>
          )}
          <Divider sx={{ my: 3 }} />
          <Typography variant="h3" component="h2" sx={{ mb: 1.5 }}>Your decision</Typography>
          <TextField
            id="review-remarks"
            label="Remarks"
            multiline minRows={4} maxRows={10}
            value={remarks}
            onChange={(e) => { setRemarks(e.target.value); if (remarksError && e.target.value.trim()) setRemarksError(''); }}
            error={!!remarksError || remarks.length > MAX_REMARKS}
            helperText={remarksError || (remarks.length > MAX_REMARKS ? `Up to ${MAX_REMARKS} characters.` : `Mandatory for Reject and Request Modification · ${remarks.length}/${MAX_REMARKS}`)}
            disabled={saving}
          />
          <Stack direction="row" sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Quick remarks:</Typography>
            {QUICK_REMARKS.map((q) => (
              <Chip
                key={q.label} label={q.label} size="small" variant="outlined" clickable disabled={saving}
                onClick={() => { setRemarks((r) => (r.trim() ? `${r.trim()} ${q.text}` : q.text)); setRemarksError(''); }}
              />
            ))}
          </Stack>
          <Stack spacing={1.5} sx={{ mt: 2.5 }}>
            <Button size="large" variant="contained" color="success" startIcon={<CheckCircleOutlineIcon />} onClick={() => start('APPROVE')} disabled={saving}>
              Approve &amp; publish
            </Button>
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <Button variant="outlined" startIcon={<EditNoteIcon />} onClick={() => start('REQUEST_MODIFICATION')} disabled={saving}>
                Request Modification
              </Button>
              <Button variant="outlined" color="error" startIcon={<HighlightOffIcon />} onClick={() => start('REJECT')} disabled={saving}>
                Reject
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Box>

      <ConfirmDialog
        open={!!pending}
        loading={saving}
        title={pending === 'APPROVE' ? `Approve ${sop.id}?` : pending === 'REJECT' ? `Reject ${sop.id}?` : `Request modification on ${sop.id}?`}
        message={
          pending === 'APPROVE'
            ? <>“{sop.name}” v{sop.version} will be <strong>approved and published</strong> to the GRAP knowledge base.</>
            : pending === 'REJECT'
              ? <>“{sop.name}” v{sop.version} will be <strong>rejected</strong>. The creator will see your remarks. This cannot be undone.</>
              : <>“{sop.name}” will be <strong>sent back to {api.getUser(sop.createdBy)?.name}</strong> with your remarks.</>
        }
        confirmLabel={pending === 'APPROVE' ? 'Approve' : pending === 'REJECT' ? 'Reject' : 'Send back'}
        confirmColor={pending === 'APPROVE' ? 'success' : pending === 'REJECT' ? 'error' : 'primary'}
        onConfirm={() => pending && decide(pending)}
        onClose={() => setPending(null)}
      />
    </>
  );
}
