import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import {
  Avatar, Badge, Box, IconButton, InputBase, ListItemText, Menu, MenuItem, Tooltip, Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import CloseIcon from '@mui/icons-material/Close';
import { ICONS } from './activityIcons';
import { useCurrentUser } from '../context/AuthContext';
import { api } from '../data/api';
import { ACTION_LABEL } from '../domain/constants';
import { canReview } from '../domain/workflow';
import { useAsync, useDebounced } from '../hooks/useAsync';
import { ACTIVITY_ACTION as A } from '../types';
import { formatDateTime } from '../utils/format';

/** Header search (from the mockup). Drives the `search` param of the SOP list, so it works from any page. */
export function GlobalSearch() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const onList = location.pathname === '/';
  const paramValue = onList ? (params.get('search') ?? '') : '';

  const [value, setValue] = useState(paramValue);
  // Keep the box in sync when the list clears its filters (adjust state during render, no effect).
  const [synced, setSynced] = useState(paramValue);
  if (paramValue !== synced) {
    setSynced(paramValue);
    setValue(paramValue);
  }

  const debounced = useDebounced(value, 300);
  useEffect(() => {
    if (debounced === paramValue) return;
    if (!onList && !debounced) return;
    const next = new URLSearchParams(onList ? params : undefined);
    if (debounced) next.set('search', debounced);
    else next.delete('search');
    next.delete('page');
    navigate({ pathname: '/', search: next.toString() }, { replace: onList });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <Box
      role="search"
      sx={{
        display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, px: 1.5, height: '2.5rem', borderRadius: 2, flex: 1, maxWidth: 'max(26.25rem, 32%)',
        bgcolor: 'rgba(255,255,255,0.14)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)',
        '&:focus-within': { bgcolor: '#fff', color: 'text.primary', borderColor: '#fff' },
      }}
    >
      <SearchIcon fontSize="small" aria-hidden />
      <InputBase
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search SOP name or ID"
        inputProps={{ 'aria-label': 'Search SOP name or ID' }}
        sx={{ color: 'inherit', flex: 1, '& input::placeholder': { color: 'inherit', opacity: 0.85 } }}
      />
    </Box>
  );
}

const SEEN_KEY = (userId: string) => `grap.notif.seen.${userId}`;

/** Bell with recent events relevant to the user (decisions on my SOPs, SOPs waiting for my review). */
export function NotificationsMenu() {
  const user = useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [seen, setSeen] = useState(() => localStorage.getItem(SEEN_KEY(user.id)) ?? '');
  const [highlightSince, setHighlightSince] = useState(seen);
  const { data } = useAsync(() => api.getNotifications(user), [user.id, location.key]);
  const items = data ?? [];
  const unread = items.filter((n) => n.activity.at > seen).length;

  const open = (el: HTMLElement) => {
    setAnchor(el);
    setHighlightSince(seen);
    const latest = items[0]?.activity.at;
    if (latest) {
      localStorage.setItem(SEEN_KEY(user.id), latest);
      setSeen(latest);
    }
  };

  const describe = (action: string, mine: boolean, by: string) => {
    if (!mine) return action === A.RESUBMITTED ? `resubmitted by ${by} · waiting for review` : `submitted by ${by} · waiting for review`;
    return `${ACTION_LABEL[action as keyof typeof ACTION_LABEL].toLowerCase()} by ${by}`;
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          onClick={(e) => open(e.currentTarget)}
          aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
          aria-haspopup="menu"
          sx={{ color: '#fff' }}
        >
          <Badge badgeContent={unread} color="warning" max={9}><NotificationsNoneIcon /></Badge>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 1, width: '27rem', maxWidth: 'calc(100vw - 1rem)', maxHeight: '32rem' } }, list: { sx: { py: 0 } } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 2, pr: 1, py: 1, position: 'sticky', top: 0, bgcolor: '#fff', zIndex: 1, borderBottom: 1, borderColor: 'divider' }}>
          <NotificationsNoneIcon color="primary" fontSize="small" aria-hidden />
          <Typography sx={{ fontWeight: 700, flex: 1 }}>Notifications</Typography>
          <Tooltip title="Close">
            <IconButton size="small" aria-label="Close notifications" onClick={() => setAnchor(null)}><CloseIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Box>
        {items.length === 0 && <Typography sx={{ px: 2, py: 3 }} color="text.secondary">You're all caught up.</Typography>}
        {items.map(({ activity: a, sop }) => {
          const by = api.getUser(a.byUserId)?.name ?? 'Someone';
          const mine = sop.createdBy === user.id;
          return (
            <MenuItem
              key={a.id}
              onClick={() => { setAnchor(null); navigate(canReview(sop, user) ? `/sops/${sop.id}/review` : `/sops/${sop.id}`); }}
              sx={{ whiteSpace: 'normal', alignItems: 'flex-start', py: 1.25, borderLeft: 3, borderColor: a.at > highlightSince ? 'primary.main' : 'transparent' }}
            >
              <Avatar sx={{ width: '2.25rem', height: '2.25rem', mr: 1.5, mt: 0.25, bgcolor: `${ICONS[a.action].color}1A`, color: ICONS[a.action].color }} aria-hidden>
                {ICONS[a.action].icon}
              </Avatar>
              <ListItemText
                sx={{ m: 0 }}
                primary={<><strong>{sop.name}</strong> v{a.version}</>}
                secondary={<>{describe(a.action, mine, by)}<br />{formatDateTime(a.at)}</>}
              />
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
