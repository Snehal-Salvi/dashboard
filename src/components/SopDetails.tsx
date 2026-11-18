import type { ReactNode } from 'react';
import { Box, Chip, Divider, Stack, Typography } from '@mui/material';
import { api } from '../data/api';
import type { Sop } from '../types';
import { formatDateTime } from '../utils/format';
import { StatusBadge } from './common';

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography component="dt" variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {label}
    </Typography>
    <Typography component="dd" sx={{ m: 0, mt: 0.25, wordBreak: 'break-word' }}>{children}</Typography>
  </Box>
);

export function SopDetails({ sop }: { sop: Sop }) {
  const creator = api.getUser(sop.createdBy);
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1, '& > *': { m: '0 !important' } }}>
        <Chip label={sop.id} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
        <Chip label={`v${sop.version}`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
        <StatusBadge status={sop.status} />
      </Stack>
      <Typography variant="h2" component="p" sx={{ wordBreak: 'break-word' }}>{sop.name}</Typography>
      <Divider />
      <Box component="dl" sx={{ m: 0, display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))' }}>
        <Field label="Category">{sop.category}</Field>
        <Field label="Sub-category">{sop.subCategory}</Field>
        <Field label="Uploaded by">
          {creator?.name ?? 'Unknown'}
          {creator && <Typography component="span" variant="body2" color="text.secondary" sx={{ display: "block" }}>{creator.email}</Typography>}
        </Field>
        <Field label="Version">v{sop.version}</Field>
        <Field label="Created">{formatDateTime(sop.createdAt)}</Field>
        <Field label="Last updated">{formatDateTime(sop.updatedAt)}</Field>
      </Box>
      <Box component="dl" sx={{ m: 0 }}>
        <Field label="Creator's comments">
          {sop.comments ? sop.comments : <Typography component="span" color="text.secondary">No comments</Typography>}
        </Field>
      </Box>
    </Stack>
  );
}
