import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import {
  Alert, Avatar, Box, Button, Chip, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, List,
  Divider, Link, ListItemAvatar, ListItemButton, ListItemText, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import { AxisLogo } from '../components/AxisLogo';
import { useAuth } from '../context/AuthContext';
import { api } from '../data/api';
import { PERSONA_LABEL } from '../domain/constants';
import { brand } from '../theme';
import { initials } from '../utils/format';
import { PERSONA } from '../types';

type DemoPersona = 'MAKER' | 'REVIEWER';
/** Demo persona (as in the mockup) → the demo SSO account it signs in as. */
const DEMO_ACCOUNT: Record<DemoPersona, string> = {
  REVIEWER: api.users.find((u) => u.persona === PERSONA.REVIEWER)!.id,
  MAKER: api.users.find((u) => u.persona === PERSONA.MAKER)!.id,
};

/** Simulated bank SSO: "Sign in with SSO" → identity-provider account picker → redirect back. */
export function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [persona, setPersona] = useState<DemoPersona>('REVIEWER');
  const demoUser = api.getUser(DEMO_ACCOUNT[persona])!;

  const from = (location.state as { from?: string } | null)?.from ?? '/';
  if (user) return <Navigate to={from} replace />;

  const choose = async (id: string) => {
    setPending(id);
    setError(null);
    try {
      await signIn(id);
      navigate(from, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed.');
      setPending(null);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh', bgcolor: 'background.default',
        background: { md: `linear-gradient(160deg, ${brand.burgundy} 0%, ${brand.burgundyDark} 100%) left top / 50% 100% no-repeat, ${brand.section}` },
      }}
    >
    <Box sx={{ minHeight: '100dvh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
      {/* Brand panel */}
      <Box
        sx={{
          bgcolor: { xs: brand.burgundy, md: 'transparent' }, color: '#fff', p: { xs: 3, sm: 5, md: 8 }, display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', gap: 4, position: 'relative', overflow: 'hidden',
          backgroundImage: {
            xs: `radial-gradient(circle at 85% 15%, rgba(255,255,255,0.12) 0, transparent 40%), linear-gradient(160deg, ${brand.burgundy} 0%, ${brand.burgundyDark} 100%)`,
            md: 'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.12) 0, transparent 40%)',
          },
        }}
      >
        <AxisLogo height={40} sx={{ alignSelf: 'flex-start' }} />
        <Box sx={{ maxWidth: '32.5rem' }}>
          <Typography variant="overline" sx={{ opacity: 0.85, letterSpacing: '0.12em' }}>GRAP · Grievance Resolution Automation Program</Typography>
          <Typography component="p" sx={{ fontWeight: 900, fontSize: 'clamp(1.8rem, 1.2rem + 2.4vw, 3rem)', lineHeight: 1.1, mt: 1 }}>
            SOP Management
          </Typography>
          <Typography sx={{ mt: 2, opacity: 0.9, fontSize: '1.05rem' }}>
            Upload SOPs, send them for review and publish approved procedures to the GRAP knowledge base.
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ opacity: 0.75, display: { xs: 'none', md: 'block' } }}>
          © Axis Bank Ltd. For authorised bank users only.
        </Typography>
      </Box>

      {/* Sign-in card */}
      <Box sx={{ display: 'grid', placeItems: 'center', p: { xs: 2, sm: 4 } }}>
        <Paper variant="outlined" sx={{ width: '100%', maxWidth: '28.75rem', p: { xs: 3, sm: 5 }, borderRadius: 3 }}>
          <Stack spacing={3}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: '3rem', height: '3rem', borderRadius: 2, bgcolor: brand.burgundyTint, color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                <LockOutlinedIcon />
              </Box>
              <Box
                component="span"
                sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 900, letterSpacing: '0.08em', borderRadius: 1.5, px: 1.5, py: 0.75, fontSize: '0.9375rem' }}
              >
                GRAP
              </Box>
            </Stack>
            <Box>
              <Typography variant="h1" component="h1">SOP Management</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: { sm: 'nowrap' } }}>
                {/* One line on tablet/desktop; on very small phones it wraps, keeping "Axis Bank" together. */}
                Grievance Resolution Automation Program · Axis{'\u00A0'}Bank
              </Typography>
            </Box>
            {error && <Alert severity="error">{error}</Alert>}
            <Box>
              <Button
                fullWidth size="large" variant="contained" onClick={() => choose(demoUser.id)} disabled={!!pending} sx={{ minHeight: '3rem' }}
                startIcon={pending ? <CircularProgress size="1.125rem" color="inherit" /> : <VerifiedUserOutlinedIcon />}
              >
                {pending ? 'Signing in with Axis SSO…' : 'Sign in with Axis SSO'}
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center', display: 'block', fontSize: '0.75rem', whiteSpace: { sm: 'nowrap' } }}>
                Use your bank Microsoft account. No separate password{'\u00A0'}needed.
              </Typography>
            </Box>

            <Divider sx={{ borderStyle: 'dashed' }} />

            <Box>
              <Typography id="demo-persona-label" variant="subtitle2" sx={{ mb: 1 }}>Demo persona</Typography>
              <ToggleButtonGroup
                exclusive fullWidth size="small" color="primary" value={persona}
                onChange={(_, v: DemoPersona | null) => v && setPersona(v)}
                aria-labelledby="demo-persona-label" disabled={!!pending}
              >
                <ToggleButton value="MAKER" sx={{ textTransform: 'none', fontWeight: 700 }}>Maker</ToggleButton>
                <ToggleButton value="REVIEWER" sx={{ textTransform: 'none', fontWeight: 700 }}>Reviewer</ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }} aria-live="polite">
                Signs in as <strong>{demoUser.name}</strong>{demoUser.persona ? ` (${PERSONA_LABEL[demoUser.persona]})` : ' (no persona assigned)'}.{' '}
                <Link component="button" type="button" variant="body2" onClick={() => setPickerOpen(true)} disabled={!!pending} sx={{ fontWeight: 700, verticalAlign: 'baseline' }}>
                  Choose a specific account
                </Link>
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>

    </Box>

      {/* Simulated identity provider */}
      <Dialog open={pickerOpen} onClose={() => !pending && setPickerOpen(false)} fullWidth maxWidth="xs" aria-labelledby="sso-title">
        <DialogTitle id="sso-title" sx={{ pr: 6 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box sx={{ color: 'primary.main' }}><AxisLogo height={22} /></Box>
            <Typography sx={{ fontWeight: 700 }}>Choose an account</Typography>
          </Stack>
          <IconButton aria-label="Close" onClick={() => setPickerOpen(false)} disabled={!!pending} sx={{ position: 'absolute', right: 8, top: '0.5rem' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 1 }}>
          <List>
            {api.users.map((u) => (
              <ListItemButton key={u.id} onClick={() => choose(u.id)} disabled={!!pending} sx={{ borderRadius: 2 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: u.persona ? 'primary.main' : 'grey.500', fontWeight: 700 }}>{initials(u.name)}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={u.name}
                  secondary={u.email}
                  slotProps={{ primary: { sx: { fontWeight: 700 } }, secondary: { sx: { wordBreak: 'break-all' } } }}
                />
                {pending === u.id ? (
                  <CircularProgress size="1.375rem" aria-label="Signing in" />
                ) : (
                  <Chip size="small" label={u.persona ? PERSONA_LABEL[u.persona] : 'No persona'} variant={u.persona ? 'filled' : 'outlined'} sx={{ ml: 1, fontWeight: 700 }} />
                )}
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
