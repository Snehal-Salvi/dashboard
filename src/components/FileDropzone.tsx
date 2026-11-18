import { useId, useRef, useState } from 'react';
import { Box, Button, Link, Stack, Typography } from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB, validateSopFile } from '../domain/workflow';

interface Props {
  hasFile: boolean;
  error?: string;
  onFile: (file: File) => void;
  onError: (message: string) => void;
}

/** Drag & drop or click to pick a Word/PDF file. Keyboard accessible (it's a real button + hidden input). */
export function FileDropzone({ hasFile, error, onFile, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const hintId = useId();

  const handle = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const err = validateSopFile(file);
    if (err) onError(err);
    else onFile(file);
  };

  return (
    <Box
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handle(e.dataTransfer.files); }}
      sx={{
        border: '2px dashed', borderRadius: 2, p: { xs: 2, sm: 3 }, textAlign: 'center', transition: 'all .15s',
        borderColor: error ? 'error.main' : dragOver ? 'primary.main' : 'divider',
        bgcolor: dragOver ? 'rgba(151,20,77,0.05)' : error ? 'rgba(211,47,47,0.04)' : 'background.default',
      }}
    >
      <Stack spacing={1} sx={{ alignItems: 'center' }}>
        <CloudUploadOutlinedIcon color={error ? 'error' : 'primary'} sx={{ fontSize: '2.5rem' }} aria-hidden />
        <Typography sx={{ fontWeight: 700 }}>{hasFile ? 'Replace the SOP file' : 'Drag & drop your SOP file here'}</Typography>
        <Typography id={hintId} variant="body2" color="text.secondary">
          Word (.doc, .docx) or PDF (.pdf), up to {MAX_FILE_SIZE_MB} MB
        </Typography>
        <Button variant="outlined" onClick={() => inputRef.current?.click()} aria-describedby={hintId}>
          {hasFile ? 'Choose another file' : 'Browse files'}
        </Button>
        <Link href="/samples/Fees-and-Charges-Reversal-SOP.docx" download variant="caption">
          No file handy? Download a sample .docx
        </Link>
      </Stack>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={[...ALLOWED_EXTENSIONS, 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].join(',')}
        onChange={(e) => { handle(e.target.files); e.target.value = ''; }}
        aria-label="SOP file"
      />
    </Box>
  );
}
