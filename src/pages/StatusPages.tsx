import { Link as RouterLink, useNavigate } from 'react-router';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../context/AuthContext';
import { brand } from '../theme';

/** Shown to users who signed in via SSO but have no GRAP persona (requirements §3). */
export function NoAccessPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', py: { xs: 4, md: 8 } }}>
      <Paper variant="outlined" sx={{ maxWidth: '32.5rem', width: '100%', p: { xs: 3, sm: 5 }, textAlign: 'center', borderRadius: 3 }}>
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <Box sx={{ width: '4rem', height: '4rem', borderRadius: '50%', bgcolor: brand.burgundyTint, color: 'primary.main', display: 'grid', placeItems: 'center' }}>
            <BlockIcon fontSize="large" />
          </Box>
          <Typography variant="h1" component="h1">Access not assigned</Typography>
          <Typography color="text.secondary">
            Hi {user?.name.split(' ')[0]}, you are signed in, but no GRAP persona (Maker or Reviewer) is assigned to your account yet.
            Please contact your RetailOps administrator to request access.
          </Typography>
          <Button variant="contained" onClick={() => { signOut(); navigate('/login', { replace: true }); }}>
            Sign out
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export function NotFoundPage({ message = 'The page you are looking for does not exist.' }: { message?: string }) {
  return (
    <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', py: 8 }}>
      <Typography variant="h1">Not found</Typography>
      <Typography color="text.secondary">{message}</Typography>
      <Button component={RouterLink} to="/" variant="contained" startIcon={<ArrowBackIcon />}>Back to SOPs</Button>
    </Stack>
  );
}
