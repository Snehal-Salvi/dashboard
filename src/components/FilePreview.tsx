import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/DownloadOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { api } from '../data/api';
import type { SopFile } from '../types';
import { formatBytes } from '../utils/format';

type Kind = 'pdf' | 'docx' | 'doc' | 'other';
const kindOf = (name: string): Kind => {
  const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase();
  return ext === 'pdf' || ext === 'docx' || ext === 'doc' ? ext : 'other';
};

/**
 * Previews an SOP document. PDFs use the browser's viewer, .docx is rendered client-side
 * with docx-preview (lazy-loaded), legacy .doc falls back to download (browsers cannot render it).
 */
export function FilePreview({ source, height = 'clamp(420px, 72vh, 960px)' }: { source: File | SopFile; height?: string }) {
  const name = source.name;
  const kind = kindOf(name);
  const docxRef = useRef<HTMLDivElement>(null);

  // Stored files are fetched; a just-picked local File is previewed directly.
  const [remote, setRemote] = useState<{ key: string; blob?: Blob; error?: string } | null>(null);
  useEffect(() => {
    if (source instanceof File) return;
    let active = true;
    api.getFileBlob(source)
      .then((blob) => active && setRemote({ key: source.key, blob }))
      .catch((e: Error) => active && setRemote({ key: source.key, error: e.message }));
    return () => {
      active = false;
    };
  }, [source]);

  const isLocal = source instanceof File;
  const current = !isLocal && remote?.key === source.key ? remote : null;
  const blob: Blob | null = isLocal ? source : (current?.blob ?? null);

  // Object URL for the PDF viewer / download link (revoked when the blob changes).
  const url = useMemo(() => {
    if (!blob) return null;
    const typed = kind === 'pdf' && blob.type !== 'application/pdf' ? new Blob([blob], { type: 'application/pdf' }) : blob;
    return URL.createObjectURL(typed);
  }, [blob, kind]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  // Render .docx into the container (docx-preview is lazy-loaded only when needed).
  const [docx, setDocx] = useState<{ blob: Blob; error?: string } | null>(null);
  useEffect(() => {
    if (!blob || kind !== 'docx' || !docxRef.current) return;
    const el = docxRef.current;
    let active = true;
    import('docx-preview')
      .then(({ renderAsync }) => renderAsync(blob, el, undefined, { inWrapper: true, breakPages: true, ignoreLastRenderedPageBreak: true }))
      .then(() => active && setDocx({ blob }))
      .catch(() => active && setDocx({ blob, error: 'This Word file could not be previewed. You can still download it.' }));
    return () => {
      active = false;
      el.innerHTML = '';
    };
  }, [blob, kind]);

  const rendering = kind === 'docx' && !!blob && docx?.blob !== blob;
  const error = current?.error ?? (docx?.blob === blob ? docx?.error : undefined) ?? null;

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <Stack direction="row" spacing={1} sx={{ px: 2, py: 1.25, alignItems: 'center', borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
        <DescriptionOutlinedIcon color="primary" fontSize="small" aria-hidden />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" noWrap title={name}>{name}</Typography>
          <Typography variant="caption" color="text.secondary">{kind.toUpperCase()} · {formatBytes(source.size)}</Typography>
        </Box>
        {url && (
          <>
            {kind === 'pdf' && (
              <Button size="small" href={url} target="_blank" rel="noopener" startIcon={<OpenInNewIcon />} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                Open
              </Button>
            )}
            <Button size="small" href={url} download={name} startIcon={<DownloadIcon />}>Download</Button>
          </>
        )}
      </Stack>

      <Box sx={{ position: 'relative', height, bgcolor: '#E9EBEE', overflow: 'auto' }}>
        {error && <Alert severity="warning" sx={{ m: 2 }}>{error}</Alert>}
        {!error && !blob && <Centered><CircularProgress aria-label="Loading document" /></Centered>}
        {!error && url && kind === 'pdf' && (
          <Box component="iframe" src={url} title={`Preview of ${name}`} sx={{ border: 0, width: '100%', height: '100%', display: 'block' }} />
        )}
        {kind === 'docx' && (
          <>
            {rendering && <Centered><CircularProgress aria-label="Rendering document" /></Centered>}
            <Box ref={docxRef} sx={{ '& .docx-wrapper': { bgcolor: 'transparent', p: { xs: 1, sm: 3 } }, '& .docx-wrapper > section.docx': { maxWidth: '100%', boxShadow: 1, mb: 2 } }} />
          </>
        )}
        {blob && (kind === 'doc' || kind === 'other') && (
          <Centered>
            <Stack spacing={1.5} sx={{ alignItems: 'center', textAlign: 'center', p: 3, maxWidth: '23.75rem' }}>
              <DescriptionOutlinedIcon sx={{ fontSize: '3.5rem' }} color="primary" />
              <Typography sx={{ fontWeight: 700 }}>Preview isn't available for legacy .doc files</Typography>
              <Typography color="text.secondary" variant="body2">Browsers can't render the old Word format. Download the file to view it, or upload a .docx / PDF.</Typography>
            </Stack>
          </Centered>
        )}
      </Box>
    </Paper>
  );
}

const Centered = ({ children }: { children: ReactNode }) => (
  <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>{children}</Box>
);
