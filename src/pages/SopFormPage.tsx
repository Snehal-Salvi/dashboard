import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Alert, AlertTitle, Autocomplete, Box, Button, Chip, CircularProgress, IconButton, Paper, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { ConfirmDialog, ErrorState, LoadingState, PageHeader, StatusBadge } from '../components/common';
import { FileDropzone } from '../components/FileDropzone';
import { FilePreview } from '../components/FilePreview';
import { useCurrentUser } from '../context/AuthContext';
import { useNotify } from '../context/NotifyContext';
import { api } from '../data/api';
import { STATUS_META } from '../domain/constants';
import { canEdit, nextVersion } from '../domain/workflow';
import { useAsync } from '../hooks/useAsync';
import { SOP_STATUS } from '../types';
import type { Sop, SopFormInput } from '../types';
import { NotFoundPage } from './StatusPages';
import { CATEGORIES } from '../data/seed';

type Errors = Partial<Record<'file' | 'name' | 'category' | 'subCategory' | 'comments' | 'changeNote', string>>;
const MAX_NAME = 120;
const MAX_COMMENTS = 1000;

export function SopFormPage() {
  const { id } = useParams();
  const user = useCurrentUser();
  const { data, loading, error, reload } = useAsync(
    async () => ({ sop: id ? await api.getSop(id) : undefined, all: await api.listSops() }),
    [id],
  );

  if (loading) return <LoadingState label="Loading SOP…" />;
  if (error) return id && /not found/i.test(error) ? <NotFoundPage message={error} /> : <ErrorState message={error} onRetry={reload} />;
  if (data?.sop && !canEdit(data.sop, user)) {
    return (
      <NotFoundPage message={`${data.sop.id} can't be edited while it is "${STATUS_META[data.sop.status].label}", or it isn't your SOP.`} />
    );
  }
  return <SopForm key={id ?? 'new'} sop={data?.sop} allSops={data?.all ?? []} />;
}

function SopForm({ sop, allSops }: { sop?: Sop; allSops: Sop[] }) {
  const user = useCurrentUser();
  const notify = useNotify();
  const navigate = useNavigate();
  const isEdit = !!sop;
  const isModification = sop?.status === SOP_STATUS.MODIFICATION_IN_PROGRESS;

  const initial: SopFormInput = {
    name: sop?.name ?? '', category: sop?.category ?? '', subCategory: sop?.subCategory ?? '', comments: sop?.comments ?? '', changeNote: '', file: null,
  };
  const [form, setForm] = useState<SopFormInput>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState<'save' | 'submit' | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const currentFile = sop?.versions[sop.versions.length - 1]?.file;
  const previewSource = form.file ?? currentFile;
  const version = nextVersion(sop, !!form.file);
  const dirty = JSON.stringify({ ...form, file: !!form.file }) !== JSON.stringify({ ...initial, file: false });

  const isNewVersion = !!sop && version > sop.version;
  // Category master (mockup) + any custom values already in use; sub-categories depend on the category.
  const categories = useMemo(() => [...new Set([...Object.keys(CATEGORIES), ...allSops.map((s) => s.category)])], [allSops]);
  const subCategories = useMemo(
    () => [...new Set([...(CATEGORIES[form.category] ?? []), ...allSops.filter((s) => s.category === form.category).map((s) => s.subCategory)])],
    [allSops, form.category],
  );

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty || saving) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty, saving]);

  const validate = (f: SopFormInput): Errors => {
    const e: Errors = {};
    if (!f.file && !currentFile) e.file = 'Please upload the SOP file (Word or PDF).';
    if (!f.name.trim()) e.name = 'SOP name is required.';
    else if (f.name.trim().length < 3) e.name = 'SOP name must be at least 3 characters.';
    else if (f.name.length > MAX_NAME) e.name = `Keep the name under ${MAX_NAME} characters.`;
    if (!f.category.trim()) e.category = 'Category is required.';
    if (!f.subCategory.trim()) e.subCategory = 'Sub-category is required.';
    if (f.comments.length > MAX_COMMENTS) e.comments = `Comments can be up to ${MAX_COMMENTS} characters.`;
    if (sop && nextVersion(sop, !!f.file) > sop.version && !f.changeNote?.trim()) e.changeNote = 'Describe what changed in this version.';
    return e;
  };

  const set = <K extends keyof SopFormInput>(key: K, value: SopFormInput[K]) => {
    const next = { ...form, [key]: value };
    setForm(next);
    // Re-validate a field once it has shown an error, so the message clears as the user fixes it.
    if (errors[key as keyof Errors]) setErrors((prev) => ({ ...prev, [key]: validate(next)[key as keyof Errors] }));
  };

  const blur = (key: keyof Errors) => setErrors((prev) => ({ ...prev, [key]: validate(form)[key] }));

  const submit = async (mode: 'save' | 'submit') => {
    const e = validate(form);
    setErrors(e);
    if (Object.values(e).some(Boolean)) {
      notify('Please fix the highlighted fields.', 'error');
      const first = (['file', 'name', 'category', 'subCategory', 'changeNote', 'comments'] as const).find((k) => e[k]);
      document.getElementById(`field-${first}`)?.focus();
      return;
    }
    setSaving(mode);
    try {
      const saved = await api.saveSop(user, form, mode === 'submit', sop?.id);
      notify(
        mode === 'submit'
          ? `${saved.id} v${saved.version} ${saved.status === SOP_STATUS.RESUBMITTED ? 'resubmitted' : 'submitted'} for review.`
          : `${saved.id} saved as ${STATUS_META[saved.status].label}.`,
      );
      navigate('/', { replace: true });
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save the SOP.', 'error');
      setSaving(null);
    }
  };

  const cancel = () => (dirty ? setConfirmCancel(true) : navigate('/'));

  return (
    <>
      <PageHeader
        title={isEdit ? (isModification ? 'Make changes to SOP' : 'Edit SOP') : 'Add SOP'}
        subtitle={isEdit ? `${sop.id} · ${sop.name}` : 'Upload a Word or PDF document and fill in the details.'}
        back="/"
        crumbs={[{ label: 'SOPs', to: '/' }, { label: isEdit ? sop.id : 'Add SOP' }]}
        actions={sop && <StatusBadge status={sop.status} size="medium" />}
      />

      {isModification && sop.reviewRemarks && (
        <Alert severity="warning" sx={{ mb: 3, alignItems: 'flex-start' }}>
          <AlertTitle sx={{ fontWeight: 700 }}>Reviewer's remarks — {api.getUser(sop.reviewedBy ?? '')?.name ?? 'Reviewer'}</AlertTitle>
          {sop.reviewRemarks}
          <Typography variant="body2" sx={{ mt: 1 }}>
            Upload the updated file to create <strong>v{sop.version + 1}</strong>, then click <strong>Save &amp; Submit</strong> to resubmit.
          </Typography>
        </Alert>
      )}

      <Box
        component="form"
        noValidate
        onSubmit={(e) => { e.preventDefault(); void submit('submit'); }}
        sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 5fr) minmax(0, 7fr)' }, alignItems: 'start' }}
      >
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="subtitle2" component="h2" sx={{ mb: 1 }}>
                SOP file <Box component="span" sx={{ color: 'error.main' }} aria-hidden>*</Box>
              </Typography>
              <Box id="field-file" tabIndex={-1} sx={{ outline: 'none' }}>
                <FileDropzone
                  hasFile={!!previewSource}
                  error={errors.file}
                  onFile={(file) => { set('file', file); setErrors((p) => ({ ...p, file: undefined })); }}
                  onError={(message) => setErrors((p) => ({ ...p, file: message }))}
                />
              </Box>
              {errors.file && <Typography role="alert" color="error" variant="body2" sx={{ mt: 1 }}>{errors.file}</Typography>}
              {form.file && (
                <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center' }}>
                  <Chip color="primary" variant="outlined" label={`New file: ${form.file.name}`} sx={{ maxWidth: '100%' }} />
                  {currentFile && (
                    <Tooltip title="Keep the current file">
                      <IconButton size="small" aria-label="Remove new file and keep current file" onClick={() => set('file', null)}><CloseIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  )}
                </Stack>
              )}
            </Box>

            <TextField
              id="field-name" label="SOP name" required value={form.name}
              onChange={(e) => set('name', e.target.value)} onBlur={() => blur('name')}
              error={!!errors.name} helperText={errors.name ?? `${form.name.length}/${MAX_NAME}`}
              slotProps={{ htmlInput: { maxLength: MAX_NAME + 20 } }}
            />

            <TextField
              label="Version" value={`v${version}`} disabled
              helperText={!isEdit ? 'Assigned by the system. New SOPs start at v1.' : version > sop.version ? `A new version will be created (v${sop.version} → v${version}).` : 'Set by the system. A new file after review creates the next version.'}
              slotProps={{ input: { readOnly: true } }}
            />

            <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <Autocomplete
                id="field-category" freeSolo options={categories} value={form.category} inputValue={form.category}
                onInputChange={(_, v) => {
                  // Changing the category clears a sub-category that doesn't belong to it.
                  const keep = !CATEGORIES[v] || CATEGORIES[v].includes(form.subCategory);
                  setForm((f) => ({ ...f, category: v, subCategory: keep ? f.subCategory : '' }));
                  if (errors.category) setErrors((p) => ({ ...p, category: v.trim() ? undefined : p.category }));
                }}
                renderInput={(p) => (
                  <TextField {...p} label="Category" required onBlur={() => blur('category')} error={!!errors.category} helperText={errors.category ?? 'Type or pick a category'} />
                )}
              />
              <Autocomplete
                id="field-subCategory" freeSolo options={subCategories} value={form.subCategory} inputValue={form.subCategory}
                onInputChange={(_, v) => set('subCategory', v)}
                renderInput={(p) => (
                  <TextField {...p} label="Sub-category" required onBlur={() => blur('subCategory')} error={!!errors.subCategory} helperText={errors.subCategory ?? 'Type or pick a sub-category'} />
                )}
              />
            </Box>

            {isNewVersion && (
              <TextField
                id="field-changeNote" label={`What changed in v${version}?`} required multiline minRows={2} value={form.changeNote}
                onChange={(e) => set('changeNote', e.target.value)} onBlur={() => blur('changeNote')}
                error={!!errors.changeNote}
                helperText={errors.changeNote ?? 'Required for a new version, so the reviewer can focus on the changes.'}
              />
            )}

            <TextField
              id="field-comments" label="Comments" multiline minRows={3} maxRows={8} value={form.comments}
              onChange={(e) => set('comments', e.target.value)} onBlur={() => blur('comments')}
              error={!!errors.comments}
              helperText={errors.comments ?? `${form.comments.length}/${MAX_COMMENTS} · Optional — notes for the reviewer`}
            />

            <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'flex-end', pt: 1 }}>
              <Button color="inherit" onClick={cancel} disabled={!!saving}>Cancel</Button>
              <Button
                variant="outlined" onClick={() => submit('save')} disabled={!!saving}
                startIcon={saving === 'save' ? <CircularProgress size="1rem" color="inherit" /> : <SaveOutlinedIcon />}
              >
                Save
              </Button>
              <Button
                type="submit" variant="contained" disabled={!!saving}
                startIcon={saving === 'submit' ? <CircularProgress size="1rem" color="inherit" /> : <SendIcon />}
              >
                Save &amp; Submit
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              <strong>Save</strong> keeps it as {isModification ? 'Modification In Progress' : 'Draft'}. <strong>Save &amp; Submit</strong> sends it to a reviewer
              {isModification ? ' as Resubmitted' : ''}.
            </Typography>
          </Stack>
        </Paper>

        <Box sx={{ position: { lg: 'sticky' }, top: { lg: '1rem' }, minWidth: 0 }}>
          <Typography variant="subtitle2" component="h2" sx={{ mb: 1 }}>Preview</Typography>
          {previewSource ? (
            <FilePreview source={previewSource} />
          ) : (
            <Paper variant="outlined" sx={{ height: 'clamp(240px, 50vh, 600px)', display: 'grid', placeItems: 'center', p: 3, textAlign: 'center', bgcolor: '#FAFBFC' }}>
              <Typography color="text.secondary">Upload a file to see its preview here.</Typography>
            </Paper>
          )}
        </Box>
      </Box>

      <ConfirmDialog
        open={confirmCancel}
        title="Discard changes?"
        message="You have unsaved changes. If you leave now, they will be lost."
        confirmLabel="Discard"
        confirmColor="error"
        onConfirm={() => navigate('/')}
        onClose={() => setConfirmCancel(false)}
      />
    </>
  );
}
