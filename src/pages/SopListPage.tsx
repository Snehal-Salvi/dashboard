import { useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router';
import {
  Badge, Box, Button, Card, Chip, Pagination, CardActionArea, Drawer, IconButton, InputAdornment, MenuItem, Paper, Skeleton, Stack, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Tabs, TextField,
  Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import TuneIcon from '@mui/icons-material/Tune';
import FilterAltOffOutlinedIcon from '@mui/icons-material/FilterAltOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import HistoryIcon from '@mui/icons-material/History';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import BuildCircleOutlinedIcon from '@mui/icons-material/BuildCircleOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import { ActivityDrawer } from '../components/ActivityDrawer';
import { EmptyState, ErrorState, PageHeader, StatusBadge } from '../components/common';
import { useCurrentUser } from '../context/AuthContext';
import { useNotify } from '../context/NotifyContext';
import { api } from '../data/api';
import { STATUS_META } from '../domain/constants';
import { belongsToTab, getRowActions, isReviewer } from '../domain/workflow';
import type { RowAction } from '../domain/workflow';
import { useAsync, useDebounced } from '../hooks/useAsync';
import { SOP_STATUS } from '../types';
import type { Sop, SopFilters, SopStatus, SopTab, User } from '../types';
import { formatDate, toDateInput } from '../utils/format';
import { brand } from '../theme';

type SortKey = 'id' | 'name' | 'status' | 'createdAt' | 'updatedAt';
const PAGE_SIZES = [10, 25, 50];
const EMPTY_FILTERS: SopFilters = { search: '', category: '', subCategory: '', status: '', from: '', to: '' };
const FILTER_KEYS = Object.keys(EMPTY_FILTERS) as (keyof SopFilters)[];

export function SopListPage() {
  const user = useCurrentUser();
  const notify = useNotify();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md')); // filter bar inline
  const showTable = useMediaQuery('(min-width: 1180px)'); // full table only when all columns fit
  // Fixed dashboard (only the table body scrolls) when the screen is big enough; otherwise normal page scroll.
  const fixedLayout = useMediaQuery('(min-width: 1180px) and (min-height: 600px)');
  const reviewer = isReviewer(user);

  // All list state lives in the URL → shareable, survives refresh/back button.
  const [params, setParams] = useSearchParams();
  const tab: SopTab = reviewer && params.get('tab') === 'review' ? 'review' : 'mine';
  const filters = Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) ?? ''])) as unknown as SopFilters;
  const sortKey = (params.get('sort') as SortKey) || 'updatedAt';
  const sortDir = params.get('dir') === 'asc' ? 'asc' : 'desc';
  const page = Number(params.get('page') ?? 0);
  const pageSize = PAGE_SIZES.includes(Number(params.get('size'))) ? Number(params.get('size')) : 10;

  const update = (patch: Record<string, string | number>, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v === '' || v === undefined ? next.delete(k) : next.set(k, String(v))));
    if (resetPage) next.delete('page');
    setParams(next, { replace: true });
  };

  const [searchInput, setSearchInput] = useState(filters.search);
  const [syncedSearch, setSyncedSearch] = useState(filters.search);
  if (filters.search !== syncedSearch) {
    // The header search (or "Clear") changed the URL → reflect it in this box.
    setSyncedSearch(filters.search);
    setSearchInput(filters.search);
  }
  const debouncedSearch = useDebounced(searchInput, 300);
  useEffect(() => {
    if (debouncedSearch !== filters.search) update({ search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const { data: sops, loading, error, reload } = useAsync(() => api.listSops(), []);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activityFor, setActivityFor] = useState<string | null>(null);

  const tabSops = useMemo(() => (sops ?? []).filter((s) => belongsToTab(s, user, tab)), [sops, user, tab]);
  const reviewCount = useMemo(() => (sops ?? []).filter((s) => belongsToTab(s, user, 'review')).length, [sops, user]);
  const mineCount = useMemo(() => (sops ?? []).filter((s) => belongsToTab(s, user, 'mine')).length, [sops, user]);

  const categories = useMemo(() => unique(tabSops.map((s) => s.category)), [tabSops]);
  const subCategories = useMemo(
    () => unique(tabSops.filter((s) => !filters.category || s.category === filters.category).map((s) => s.subCategory)),
    [tabSops, filters.category],
  );

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const rows = tabSops.filter((s) => {
      const created = toDateInput(s.createdAt);
      return (!q || s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
        && (!filters.category || s.category === filters.category)
        && (!filters.subCategory || s.subCategory === filters.subCategory)
        && (!filters.status || s.status === filters.status)
        && (!filters.from || created >= filters.from)
        && (!filters.to || created <= filters.to);
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    return rows.sort((a, b) => {
      const av = sortKey === 'status' ? STATUS_META[a.status].label : a[sortKey];
      const bv = sortKey === 'status' ? STATUS_META[b.status].label : b[sortKey];
      return av.localeCompare(bv, undefined, { numeric: true }) * dir;
    });
  }, [tabSops, filters.search, filters.category, filters.subCategory, filters.status, filters.from, filters.to, sortKey, sortDir]);

  const safePage = Math.min(page, Math.max(0, Math.ceil(filtered.length / pageSize) - 1));
  const pageRows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const activeFilterCount = (['category', 'subCategory', 'status', 'from', 'to'] as const).filter((k) => filters[k]).length;
  const hasAnyFilter = activeFilterCount > 0 || !!filters.search;
  const dateError = filters.from && filters.to && filters.from > filters.to ? '"From" date must be before "To" date' : '';

  const clearFilters = () => {
    setSearchInput('');
    update(Object.fromEntries(FILTER_KEYS.map((k) => [k, ''])));
  };

  const handleAction = async (action: RowAction, sop: Sop) => {
    if (action === 'view') return navigate(`/sops/${sop.id}`);
    if (action === 'activity') return setActivityFor(sop.id);
    if (action === 'edit') return navigate(`/sops/${sop.id}/edit`);
    if (action === 'review') return navigate(`/sops/${sop.id}/review`);
    // makeChanges: Requested Modification → Modification In Progress, then open the editor
    setBusyId(sop.id);
    try {
      await api.startModification(user, sop.id);
      notify(`${sop.id} is now "Modification In Progress".`, 'info');
      navigate(`/sops/${sop.id}/edit`);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not start modification.', 'error');
      reload();
    } finally {
      setBusyId(null);
    }
  };

  // Persona-specific summary tiles (from the mockup). Clicking a tile applies the matching tab/filter.
  const mine = (sops ?? []).filter((s) => belongsToTab(s, user, 'mine'));
  const count = (...st: SopStatus[]) => mine.filter((s) => st.includes(s.status)).length;
  type Stat = { label: string; value: number; hint: string; color: string; tab?: SopTab; status?: SopStatus };
  const stats: Stat[] = [
    ...(reviewer ? [{ label: 'Waiting for my review', value: reviewCount, hint: 'Submitted / Resubmitted by others', color: '#97144D', tab: 'review' as SopTab }] : []),
    { label: 'My drafts', value: count(SOP_STATUS.DRAFT), hint: 'Not yet submitted', color: STATUS_META.DRAFT.fg, status: SOP_STATUS.DRAFT },
    ...(!reviewer ? [{ label: 'In review', value: count(SOP_STATUS.SUBMITTED, SOP_STATUS.RESUBMITTED), hint: 'Submitted / Resubmitted', color: STATUS_META.SUBMITTED.fg, status: SOP_STATUS.SUBMITTED }] : []),
    { label: 'Needs my changes', value: count(SOP_STATUS.REQUESTED_MODIFICATION, SOP_STATUS.MODIFICATION_IN_PROGRESS), hint: 'Modification requested / in progress', color: STATUS_META.REQUESTED_MODIFICATION.fg, status: SOP_STATUS.REQUESTED_MODIFICATION },
    { label: 'Approved (live)', value: count(SOP_STATUS.APPROVED), hint: 'Published to the knowledge base', color: STATUS_META.APPROVED.fg, status: SOP_STATUS.APPROVED },
  ];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const filterFields = (
    <>
      <TextField select label="Category" value={filters.category} onChange={(e) => update({ category: e.target.value, subCategory: '' })}>
        <MenuItem value="">All categories</MenuItem>
        {categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
      </TextField>
      <TextField select label="Sub-category" value={filters.subCategory} onChange={(e) => update({ subCategory: e.target.value })}>
        <MenuItem value="">All sub-categories</MenuItem>
        {subCategories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
      </TextField>
      <TextField select label="Status" value={filters.status} onChange={(e) => update({ status: e.target.value })}>
        <MenuItem value="">All statuses</MenuItem>
        {Object.entries(STATUS_META).map(([k, m]) => <MenuItem key={k} value={k}>{m.label}</MenuItem>)}
      </TextField>
      <TextField
        type="date" label="Created from" value={filters.from} onChange={(e) => update({ from: e.target.value })}
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: filters.to || undefined } }}
      />
      <TextField
        type="date" label="Created to" value={filters.to} onChange={(e) => update({ to: e.target.value })}
        error={!!dateError} helperText={dateError || undefined}
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: filters.from || undefined } }}
      />
    </>
  );

  const from = filtered.length ? safePage * pageSize + 1 : 0;
  const to = Math.min(filtered.length, (safePage + 1) * pageSize);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  return (
    // Desktop: header, greeting, tiles, tabs and filters stay put; only the table body scrolls.
    <Box sx={fixedLayout ? { flex: '1 1 0% !important', minHeight: 0, display: 'flex', flexDirection: 'column' } : undefined}>
      <PageHeader
        compact={fixedLayout}
        title={`${greeting}, ${user.name.split(' ')[0]}`}
        subtitle={
          reviewer
            ? loading ? 'Loading your review queue…' : <>You have <strong>{reviewCount}</strong> SOP{reviewCount === 1 ? '' : 's'} waiting for your review.</>
            : 'Upload SOPs, send them for review and track their status.'
        }
        actions={
          <Button
            variant="contained" size="large" startIcon={<AddCircleOutlineIcon />} component={RouterLink} to="/sops/new"
            sx={{
              px: 3, borderRadius: '0.75rem', fontSize: '1rem', boxShadow: '0 0.375rem 1rem rgba(151, 20, 77, 0.28)',
              transition: 'transform .15s, box-shadow .15s',
              '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 0.5rem 1.25rem rgba(151, 20, 77, 0.35)' },
            }}
          >
            Add SOP
          </Button>
        }
      />

      {/* Status summary */}
      <Box sx={{ display: 'grid', gap: fixedLayout ? 1.5 : 2, mb: fixedLayout ? 1.5 : 3, flexShrink: 0, gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' } }}>
        {stats.map((s) => (
          <Card key={s.label} sx={{ borderLeft: `4px solid ${s.color}` }}>
            <CardActionArea
              onClick={() => update({ tab: s.tab === 'review' ? 'review' : '', status: s.status ?? '', category: '', subCategory: '' })}
              aria-label={`${s.label}: ${s.value}. Show these SOPs`}
              sx={{ px: { xs: 1.5, sm: 2 }, py: fixedLayout ? 0.75 : { xs: 1.5, sm: 2 }, height: '100%' }}
            >
              <Typography variant="body2" color="text.secondary" noWrap sx={{ fontWeight: 700 }}>{s.label}</Typography>
              {loading ? <Skeleton width="2.5rem" height="2.25rem" /> : <Typography color="text.primary" sx={{ fontWeight: 900, fontSize: fixedLayout ? '1.4rem' : '2rem', lineHeight: 1.2 }}>{s.value}</Typography>}
              <Typography variant="caption" color="text.secondary" noWrap component="p">{s.hint}</Typography>
            </CardActionArea>
          </Card>
        ))}
      </Box>

      <Paper
        variant="outlined"
        sx={{ borderRadius: 3, overflow: 'hidden', ...(fixedLayout && { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }) }}
      >
        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, v: SopTab) => update({ tab: v === 'mine' ? '' : v, status: '', category: '', subCategory: '' })}
          aria-label="SOP lists"
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ px: { xs: 1, sm: 2 }, borderBottom: 1, borderColor: 'divider', flexShrink: 0, minHeight: '2.75rem', '& .MuiTab-root': { minHeight: '2.75rem', py: 1 } }}
        >
          <Tab value="mine" label={<TabLabel text="My SOPs" count={mineCount} />} />
          {reviewer && <Tab value="review" label={<TabLabel text="For My Review" count={reviewCount} highlight />} />}
        </Tabs>

        {/* Search + filters */}
        <Box sx={{ px: { xs: 1.5, sm: 2 }, py: fixedLayout ? 1.25 : { xs: 1.5, sm: 2 }, borderBottom: 1, borderColor: 'divider', bgcolor: '#FAFBFC', flexShrink: 0 }}>
          <Box
            sx={{
              display: 'grid', gap: 1.5, alignItems: 'start',
              gridTemplateColumns: { xs: '1fr auto', md: 'repeat(3, minmax(8.75rem, 1fr)) repeat(2, minmax(9.5rem, 1fr)) auto' },
            }}
          >
            {!isDesktop && <TextField
              placeholder="Search by SOP name or ID"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              slotProps={{
                htmlInput: { 'aria-label': 'Search by SOP name or ID' },
                input: {
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                  endAdornment: searchInput ? (
                    <InputAdornment position="end">
                      <IconButton size="small" aria-label="Clear search" onClick={() => setSearchInput('')}><ClearIcon fontSize="small" /></IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
            />}
            {isDesktop ? (
              <>
                {filterFields}
                <Button variant="outlined" onClick={clearFilters} disabled={!hasAnyFilter} startIcon={<FilterAltOffOutlinedIcon />} sx={{ whiteSpace: 'nowrap', minHeight: '2.5rem' }}>Clear filters</Button>
              </>
            ) : (
              <Badge badgeContent={activeFilterCount} color="primary">
                <Button variant="outlined" startIcon={<TuneIcon />} onClick={() => setDrawerOpen(true)} sx={{ minHeight: '2.5rem' }}>Filters</Button>
              </Badge>
            )}
          </Box>
          {isDesktop && filters.search && (
            <Chip label={`Search: "${filters.search}"`} onDelete={() => update({ search: '' })} color="primary" variant="outlined" sx={{ fontWeight: 700, mt: 1.5 }} />
          )}
        </Box>

        {/* Results (the only part that scrolls on desktop) */}
        <Box sx={fixedLayout ? { flex: 1, minHeight: 0, overflow: 'auto' } : undefined}>
          {error ? (
            <Box sx={{ p: 2 }}><ErrorState message={error} onRetry={reload} /></Box>
          ) : loading ? (
            <LoadingRows />
          ) : filtered.length === 0 ? (
            hasAnyFilter ? (
              <EmptyState title="No SOPs match your filters" message="Try a different search term or clear the filters." action={<Button variant="outlined" onClick={clearFilters} startIcon={<FilterAltOffOutlinedIcon />}>Clear filters</Button>} />
            ) : tab === 'review' ? (
              <EmptyState title="No SOPs to review" message="You're all caught up. SOPs submitted or resubmitted by other users will appear here." />
            ) : (
              <EmptyState
                title="You haven't uploaded any SOPs yet"
                message="Upload a Word or PDF SOP to get started."
                action={<Button variant="contained" startIcon={<AddIcon />} component={RouterLink} to="/sops/new">Add SOP</Button>}
              />
            )
          ) : showTable ? (
            <SopTable
              rows={pageRows} user={user} tab={tab} busyId={busyId} onAction={handleAction}
              sortKey={sortKey} sortDir={sortDir}
              onSort={(k) => update({ sort: k, dir: sortKey === k && sortDir === 'desc' ? 'asc' : 'desc' }, false)}
            />
          ) : (
            <Box sx={{ p: 1.5, display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' } }}>
              {pageRows.map((s) => <SopCard key={s.id} sop={s} user={user} tab={tab} busy={busyId === s.id} onAction={handleAction} />)}
            </Box>
          )}
        </Box>

        {/* Pagination */}
        {!loading && !error && filtered.length > 0 && (
          <Stack
            component="nav"
            aria-label="Pagination"
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 1.25, sm: 2 }}
            sx={{ px: 2, py: 1, borderTop: 1, borderColor: 'divider', bgcolor: '#FAFBFC', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}
          >
            <Typography role="status" variant="body2" color="text.secondary">
              Showing <strong>{from}–{to}</strong> of <strong>{filtered.length}</strong> SOP{filtered.length === 1 ? '' : 's'}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', rowGap: 1 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" component="label" htmlFor="rows-per-page">Rows per page</Typography>
                <TextField
                  select id="rows-per-page" value={pageSize} onChange={(e) => update({ size: e.target.value })}
                  sx={{ width: '4.75rem' }} slotProps={{ select: { 'aria-label': 'Rows per page' } as object }}
                >
                  {PAGE_SIZES.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                </TextField>
              </Stack>
              <Pagination
                count={pageCount} page={safePage + 1} onChange={(_, p) => update({ page: p - 1 }, false)}
                color="primary" shape="rounded" variant="outlined" siblingCount={1}
                showFirstButton={pageCount > 3} showLastButton={pageCount > 3}
              />
            </Stack>
          </Stack>
        )}
      </Paper>

      <ActivityDrawer sopId={activityFor} onClose={() => setActivityFor(null)} />

      {/* Mobile / tablet filter drawer */}
      <Drawer anchor="bottom" open={drawerOpen} onClose={() => setDrawerOpen(false)} slotProps={{ paper: { sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '85dvh' } } }}>
        <Box sx={{ p: 2.5 }} role="dialog" aria-label="Filters">
          <Typography variant="h3" sx={{ mb: 2 }}>Filters</Typography>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>{filterFields}</Box>
          <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
            <Button fullWidth variant="outlined" onClick={clearFilters} disabled={!hasAnyFilter} startIcon={<FilterAltOffOutlinedIcon />}>Clear all</Button>
            <Button fullWidth variant="contained" onClick={() => setDrawerOpen(false)}>Show {filtered.length} result{filtered.length === 1 ? '' : 's'}</Button>
          </Stack>
        </Box>
      </Drawer>
    </Box>
  );
}

const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));

function TabLabel({ text, count, highlight }: { text: string; count: number; highlight?: boolean }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <span>{text}</span>
      <Box
        component="span"
        aria-label={`${count} items`}
        sx={{
          minWidth: '1.375rem', height: '1.375rem', px: 0.75, borderRadius: 11, fontSize: '0.75rem', fontWeight: 900, display: 'inline-grid', placeItems: 'center',
          bgcolor: highlight && count > 0 ? 'primary.main' : brand.section, color: highlight && count > 0 ? '#fff' : 'text.secondary',
        }}
      >
        {count}
      </Box>
    </Stack>
  );
}

const ACTION_META: Record<RowAction, { label: string; icon: ReactElement }> = {
  view: { label: 'View', icon: <VisibilityOutlinedIcon fontSize="small" /> },
  activity: { label: 'Activity', icon: <HistoryIcon fontSize="small" /> },
  edit: { label: 'Edit', icon: <EditOutlinedIcon fontSize="small" /> },
  makeChanges: { label: 'Make changes', icon: <BuildCircleOutlinedIcon fontSize="small" /> },
  review: { label: 'Review', icon: <RateReviewOutlinedIcon fontSize="small" /> },
};

function RowActions({ sop, user, tab, busy, onAction, full }: { sop: Sop; user: User; tab: SopTab; busy: boolean; onAction: (a: RowAction, s: Sop) => void; full?: boolean }) {
  const actions = getRowActions(sop, user, tab);
  const primary = actions.filter((a) => a !== 'view' && a !== 'activity');
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', justifyContent: full ? 'flex-start' : 'flex-end', flexWrap: full ? 'wrap' : 'nowrap', gap: 0.5, '& > *': { m: '0 !important' } }}>
      {(['view', 'activity'] as const).map((a) =>
        full ? (
          <Button key={a} size="small" startIcon={ACTION_META[a].icon} onClick={() => onAction(a, sop)}>{ACTION_META[a].label}</Button>
        ) : (
          <Tooltip key={a} title={ACTION_META[a].label}>
            <IconButton size="small" aria-label={`${ACTION_META[a].label} ${sop.id}`} onClick={() => onAction(a, sop)}>{ACTION_META[a].icon}</IconButton>
          </Tooltip>
        ),
      )}
      {primary.map((a) =>
        full ? (
          <Button
            key={a} size="small" variant="outlined" startIcon={ACTION_META[a].icon}
            onClick={() => onAction(a, sop)} disabled={busy} aria-label={`${ACTION_META[a].label} ${sop.id}`} sx={{ whiteSpace: 'nowrap' }}
          >
            {ACTION_META[a].label}
          </Button>
        ) : (
          <Tooltip key={a} title={ACTION_META[a].label}>
            <span>
              <IconButton
                size="small" color="primary" disabled={busy} aria-label={`${ACTION_META[a].label} ${sop.id}`} onClick={() => onAction(a, sop)}
                sx={{ bgcolor: 'rgba(151, 20, 77, 0.08)', '&:hover': { bgcolor: 'rgba(151, 20, 77, 0.16)' } }}
              >
                {ACTION_META[a].icon}
              </IconButton>
            </span>
          </Tooltip>
        ),
      )}
    </Stack>
  );
}

function SopTable({ rows, user, tab, busyId, onAction, sortKey, sortDir, onSort }: {
  rows: Sop[]; user: User; tab: SopTab; busyId: string | null; onAction: (a: RowAction, s: Sop) => void;
  sortKey: SortKey; sortDir: 'asc' | 'desc'; onSort: (k: SortKey) => void;
}) {
  const sortable = (key: SortKey, label: string) => (
    <TableSortLabel active={sortKey === key} direction={sortKey === key ? sortDir : 'asc'} onClick={() => onSort(key)}>{label}</TableSortLabel>
  );
  return (
    <TableContainer sx={{ overflow: 'visible' }}>
      <Table stickyHeader size="small" sx={{ minWidth: '56rem', '& td, & th': { px: 1.5, py: 1 }, '& th': { py: 1, lineHeight: 1.3 } }} aria-label={tab === 'mine' ? 'My SOPs' : 'SOPs for my review'}>
        <TableHead>
          <TableRow>
            <TableCell sortDirection={sortKey === 'name' ? sortDir : false}>{sortable('name', 'SOP name / ID')}</TableCell>
            <TableCell>Version</TableCell>
            <TableCell sx={{ whiteSpace: 'normal !important', minWidth: '7.5rem' }}>Category / Sub-category</TableCell>
            <TableCell sortDirection={sortKey === 'status' ? sortDir : false}>{sortable('status', 'Status')}</TableCell>
            <TableCell>Uploaded by</TableCell>
            <TableCell sortDirection={sortKey === 'updatedAt' ? sortDir : false}>{sortable('updatedAt', 'Last updated')}</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((s) => (
            <TableRow key={s.id} hover>
              <TableCell sx={{ minWidth: '13.75rem' }}>
                <Typography component={RouterLink} to={`/sops/${s.id}`} sx={{ color: 'text.primary', fontWeight: 700, textDecoration: 'none', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}>
                  {s.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{s.id}</Typography>
              </TableCell>
              <TableCell>v{s.version}</TableCell>
              <TableCell sx={{ minWidth: '9.375rem' }}>
                {s.category}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{s.subCategory}</Typography>
              </TableCell>
              <TableCell><StatusBadge status={s.status} /></TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{api.getUser(s.createdBy)?.name}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                {formatDate(s.updatedAt)}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Created {formatDate(s.createdAt)}</Typography>
              </TableCell>
              <TableCell align="right"><RowActions sop={s} user={user} tab={tab} busy={busyId === s.id} onAction={onAction} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function SopCard({ sop, user, tab, busy, onAction }: { sop: Sop; user: User; tab: SopTab; busy: boolean; onAction: (a: RowAction, s: Sop) => void }) {
  return (
    <Card component="article" aria-label={`${sop.id} ${sop.name}`} sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>{sop.id} · v{sop.version}</Typography>
        <StatusBadge status={sop.status} />
      </Stack>
      <Typography component={RouterLink} to={`/sops/${sop.id}`} sx={{ color: 'text.primary', fontWeight: 700, fontSize: '1.05rem', textDecoration: 'none', wordBreak: 'break-word', display: 'block' }}>
        {sop.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{sop.category} › {sop.subCategory}</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1.5, fontSize: '0.8125rem' }}>
        <Meta label="Uploaded by" value={api.getUser(sop.createdBy)?.name ?? '—'} />
        <Meta label="Last updated" value={formatDate(sop.updatedAt)} />
        <Meta label="Created" value={formatDate(sop.createdAt)} />
      </Box>
      <Box sx={{ mt: 1.5, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
        <RowActions sop={sop} user={user} tab={tab} busy={busy} onAction={onAction} full />
      </Box>
    </Card>
  );
}

const Meta = ({ label, value }: { label: string; value: string }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{label}</Typography>
    <Typography variant="body2" noWrap title={value} sx={{ fontWeight: 700 }}>{value}</Typography>
  </Box>
);

function LoadingRows() {
  return (
    <Stack spacing={1} sx={{ p: 2 }} role="status" aria-label="Loading SOPs">
      {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} variant="rounded" height={48} />)}
    </Stack>
  );
}
