// Small shared building blocks: status badge, page header, empty/error/loading states, confirm dialog.

import type { ReactNode } from 'react';
import {
  Alert, Box, Breadcrumbs, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Link, Stack, Typography,
} from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import { Link as RouterLink, useNavigate } from 'react-router';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { STATUS_META } from '../domain/constants';
import type { SopStatus } from '../types';

export function StatusBadge({ status, size = 'small' }: { status: SopStatus; size?: 'small' | 'medium' }) {
  const meta = STATUS_META[status];
  return (
    <Chip
      label={meta.label}
      size={size}
      sx={{
        bgcolor: meta.bg, color: meta.fg, fontWeight: 700, borderRadius: 1.5,
        border: `1px solid ${meta.fg}26`, maxWidth: '100%',
        '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
      }}
    />
  );
}

/** "← Back": previous page if we came from inside the app, otherwise `fallback`. */
export function BackButton({ fallback = '/' }: { fallback?: string }) {
  const navigate = useNavigate();
  const canGoBack = ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0;
  return (
    <Button
      variant="outlined" size="small" color="inherit" startIcon={<ArrowBackIcon />}
      onClick={() => (canGoBack ? navigate(-1) : navigate(fallback))}
      sx={{ borderColor: 'divider', bgcolor: '#fff', color: 'text.primary', fontWeight: 700, '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: '#fff' } }}
    >
      Back
    </Button>
  );
}

export function PageHeader({
  title, subtitle, crumbs, actions, back, compact,
}: {
  title: ReactNode; subtitle?: ReactNode; crumbs?: { label: string; to?: string }[]; actions?: ReactNode;
  /** Show a Back button; the value is where to go if there is no in-app history. */
  back?: string;
  compact?: boolean;
}) {
  return (
    <Box sx={{ mb: compact ? 1.5 : 3, flexShrink: 0 }}>
      {(back || crumbs) && (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
          {back && <BackButton fallback={back} />}
          {crumbs && (
        <Breadcrumbs aria-label="Breadcrumb" sx={{ fontSize: '0.875rem' }}>
          {crumbs.map((c) =>
            c.to ? (
              <Link key={c.label} component={RouterLink} to={c.to} underline="hover" color="inherit">{c.label}</Link>
            ) : (
              <Typography key={c.label} color="text.primary" aria-current="page" sx={{ fontSize: '0.875rem' }}>{c.label}</Typography>
            ),
          )}
        </Breadcrumbs>
          )}
        </Stack>
      )}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h1" sx={{ wordBreak: 'break-word', ...(compact && { fontSize: '1.6rem' }) }}>{title}</Typography>
          {subtitle && <Typography color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
        </Box>
        {actions && <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, '& > *': { m: '0 !important' } }}>{actions}</Stack>}
      </Stack>
    </Box>
  );
}

export function EmptyState({ title, message, action }: { title: string; message?: string; action?: ReactNode }) {
  return (
    <Stack role="status" spacing={1.5} sx={{ alignItems: 'center', textAlign: 'center', py: 8, px: 2 }}>
      <Box sx={{ width: '4rem', height: '4rem', borderRadius: '50%', bgcolor: 'primary.main', color: '#fff', display: 'grid', placeItems: 'center', opacity: 0.9 }}>
        <InboxOutlinedIcon fontSize="large" />
      </Box>
      <Typography variant="h3">{title}</Typography>
      {message && <Typography color="text.secondary" sx={{ maxWidth: '26.25rem' }}>{message}</Typography>}
      {action}
    </Stack>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <Stack role="status" aria-live="polite" spacing={2} sx={{ alignItems: 'center', py: 8 }}>
      <CircularProgress />
      <Typography color="text.secondary">{label}</Typography>
    </Stack>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert severity="error" action={onRetry && <Button color="inherit" size="small" onClick={onRetry}>Retry</Button>}>
      {message}
    </Alert>
  );
}

export function ConfirmDialog({
  open, title, message, confirmLabel, confirmColor = 'primary', loading, onConfirm, onClose,
}: {
  open: boolean; title: string; message: ReactNode; confirmLabel: string;
  confirmColor?: 'primary' | 'error' | 'success'; loading?: boolean; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} aria-labelledby="confirm-title" maxWidth="xs" fullWidth>
      <DialogTitle id="confirm-title" sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent><DialogContentText component="div">{message}</DialogContentText></DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">Cancel</Button>
        <Button
          variant="contained" color={confirmColor} onClick={onConfirm} disabled={loading} autoFocus
          startIcon={loading ? <CircularProgress size="1rem" color="inherit" /> : undefined}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
