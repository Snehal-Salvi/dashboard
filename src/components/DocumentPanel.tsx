import { useState } from 'react';
import { Box, Paper, Tab, Tabs, Typography } from '@mui/material';
import type { Sop, SopVersion } from '../types';
import { FilePreview } from './FilePreview';
import { EmptyState } from './common';

/**
 * "Document" + "Compare with previous version" tabs (from the mockup). Compare shows the previous
 * and current files side by side, so reviewers can check what changed.
 */
export function DocumentPanel({ sop, version }: { sop: Sop; version?: SopVersion }) {
  const [tab, setTab] = useState<'doc' | 'compare'>('doc');
  const current = version ?? sop.versions[sop.versions.length - 1];
  const previous = sop.versions.find((v) => v.version === current.version - 1);

  return (
    <Box sx={{ minWidth: 0 }}>
      <Paper variant="outlined" sx={{ borderRadius: 3, mb: 1.5, px: 1 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="Document view" variant="scrollable" allowScrollButtonsMobile>
          <Tab value="doc" label={`Document (v${current.version})`} />
          <Tab value="compare" label="Compare with previous version" />
        </Tabs>
      </Paper>

      {tab === 'doc' ? (
        <FilePreview source={current.file} />
      ) : !previous ? (
        <Paper variant="outlined" sx={{ borderRadius: 3 }}>
          <EmptyState title="Nothing to compare" message={`This is version ${current.version} – there is no previous version.`} />
        </Paper>
      ) : (
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' } }}>
          {[previous, current].map((v) => (
            <Box key={v.version} sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.75, color: v === current ? 'primary.main' : 'text.secondary' }}>
                {v === current ? `v${v.version} · current` : `v${v.version} · previous`}
              </Typography>
              <FilePreview source={v.file} height="clamp(380px, 65vh, 860px)" />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
