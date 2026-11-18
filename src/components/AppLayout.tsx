import { useState } from 'react';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router';
import {
  AppBar, Avatar, Box, Chip, Container, Divider, IconButton, ListItemIcon, Menu, MenuItem, Stack, Toolbar, Tooltip, Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotifyContext';
import { api } from '../data/api';
import { PERSONA_LABEL } from '../domain/constants';
import { brand } from '../theme';
import { initials } from '../utils/format';
import { AxisLogo } from './AxisLogo';
import { ConfirmDialog } from './common';
import { GlobalSearch, NotificationsMenu } from './HeaderWidgets';

/** Sticky burgundy header (like axis.bank.in) + page container. */
export function AppLayout() {
  const { user, signOut } = useAuth();
  const notify = useNotify();
  const navigate = useNavigate();
  const location = useLocation();
  // The dashboard fills exactly one screen (its table scrolls); other pages grow and scroll normally.
  const isDashboard = location.pathname === '/';
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!user) return null;
  const personaLabel = user.persona ? PERSONA_LABEL[user.persona] : 'No access';

  const handleSignOut = () => {
    setAnchor(null);
    signOut();
    navigate('/login', { replace: true });
  };

  const handleReset = async () => {
    await api.resetDemoData();
    setConfirmReset(false);
    notify('Demo data has been reset.', 'info');
    navigate('/', { replace: true });
    window.location.reload();
  };

  return (
    // App shell: header stays on screen, the page area scrolls (the SOP list scrolls only its table body).
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box
        component="a"
        href="#main"
        sx={{
          position: 'absolute', left: '0.5rem', top: '-10rem', zIndex: 2000, bgcolor: '#fff', color: 'primary.main', px: 2, py: 1, borderRadius: 1, fontWeight: 700,
          '&:focus': { top: '0.5rem' },
        }}
      >
        Skip to content
      </Box>

      <AppBar position="static" elevation={0} sx={{ bgcolor: brand.burgundy, borderBottom: `3px solid ${brand.burgundyDark}` }}>
        <Toolbar disableGutters sx={{ minHeight: { xs: '3.75rem', sm: '3.75rem' } }}>
          <Container maxWidth={false} sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 }, px: { xs: 1.5, sm: 3 } }}>
          <Box component={RouterLink} to="/" aria-label="GRAP home" sx={{ display: 'flex', alignItems: 'center', color: '#fff', textDecoration: 'none', gap: { xs: 1, sm: 2 }, minWidth: 0 }}>
            <AxisLogo height={30} sx={{ height: { xs: '1.5rem', sm: '1.875rem' } }} />
            <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.35)', my: 1.5, display: { xs: 'none', sm: 'block' } }} />
            <Box sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 0 }}>
              <Typography noWrap sx={{ fontWeight: 900, lineHeight: 1.1 }}>GRAP</Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }} noWrap>SOP Management</Typography>
            </Box>
          </Box>

          {user.persona && <GlobalSearch />}
          <Box sx={{ flex: 1 }} />

          <Stack direction="row" spacing={{ xs: 0.75, sm: 1.5 }} sx={{ alignItems: 'center', minWidth: 0 }}>
            {user.persona && <NotificationsMenu />}
            <Box sx={{ textAlign: 'right', display: { xs: 'none', lg: 'block' }, minWidth: 0 }}>
              <Typography noWrap sx={{ fontWeight: 700, lineHeight: 1.2 }}>{user.name}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }} noWrap>{user.email}</Typography>
            </Box>
            <Chip
              label={personaLabel}
              size="small"
              sx={{ bgcolor: '#fff', color: brand.burgundy, fontWeight: 900 }}
            />
            <Tooltip title="Account">
              <IconButton
                onClick={(e) => setAnchor(e.currentTarget)}
                aria-label={`Account menu for ${user.name}`}
                aria-haspopup="menu"
                aria-expanded={!!anchor}
                sx={{ p: 0.25, border: '2px solid rgba(255,255,255,0.6)' }}
              >
                <Avatar sx={{ width: '2.25rem', height: '2.25rem', bgcolor: '#fff', color: brand.burgundy, fontWeight: 900, fontSize: '0.9375rem' }}>{initials(user.name)}</Avatar>
              </IconButton>
            </Tooltip>
          </Stack>
          </Container>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 1, minWidth: '16.25rem', maxWidth: 'calc(100vw - 16px)' } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ fontWeight: 700 }}>{user.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>{user.email}</Typography>
          <Typography variant="body2" color="text.secondary">{user.department}</Typography>
          <Chip label={personaLabel} size="small" color="primary" sx={{ mt: 1, fontWeight: 700 }} />
        </Box>
        <Divider />
        <MenuItem onClick={() => { setAnchor(null); setConfirmReset(true); }}>
          <ListItemIcon><RestartAltIcon fontSize="small" /></ListItemIcon>
          Reset demo data
        </MenuItem>
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Container component="main" id="main" tabIndex={-1} maxWidth={false} sx={{ flex: isDashboard ? '1 1 0%' : '1 0 auto', minHeight: isDashboard ? 0 : undefined, display: 'flex', flexDirection: 'column', py: { xs: 2.5, md: 2 }, px: { xs: 2, sm: 3 }, outline: 'none', '& > *': { flexShrink: 0 } }}>
          <Outlet />
        </Container>

        {!isDashboard && (
          <Box component="footer" sx={{ py: 2, px: 3, textAlign: 'center', borderTop: 1, borderColor: 'divider', bgcolor: '#fff' }}>
            <Typography variant="caption" color="text.secondary">
              Axis Bank RetailOps · GRAP SOP Management · Proof of concept (SSO and backend are simulated)
            </Typography>
          </Box>
        )}
      </Box>

      <ConfirmDialog
        open={confirmReset}
        title="Reset demo data?"
        message="All SOPs, uploaded files and activity will be restored to the original sample data."
        confirmLabel="Reset"
        onConfirm={handleReset}
        onClose={() => setConfirmReset(false)}
      />
    </Box>
  );
}
