import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Business } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { useOrgStore } from '../stores/org.store';
import { authApi } from '../api/auth.api';
import { useFormDraft } from '../hooks/useFormDraft';
import { getApiErrorMessage } from '../utils/api-error';
import { AuthShell } from '../components/common/AuthShell';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const registeredEmail = (location.state as { email?: string } | null)?.email;
  const justRegistered = Boolean((location.state as { registered?: boolean } | null)?.registered);
  const login = useAuthStore((s) => s.login);
  const resetOrgs = useOrgStore((s) => s.reset);
  const fetchOrganizations = useOrgStore((s) => s.fetchOrganizations);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;
  const { clearFormDraft } = useFormDraft(form, 'login-draft');

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const response = await authApi.login(data);
      resetOrgs();
      login(response);
      clearFormDraft();
      await fetchOrganizations();
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Login failed'));
    }
  };

  return (
    <AuthShell>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 3,
            mx: 'auto',
            mb: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          }}
        >
          <Business sx={{ fontSize: 28, color: '#fff' }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sign in to your workspace
        </Typography>
      </Box>

          {justRegistered && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Account created{registeredEmail ? ` for ${registeredEmail}` : ''}. Sign in to continue.
            </Alert>
          )}

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Email"
          type="email"
          fullWidth
          {...register('email')}
          error={!!errors.email}
          helperText={errors.email?.message}
          autoComplete="email"
        />
        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          fullWidth
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
          autoComplete="current-password"
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={isSubmitting}
          sx={{ mt: 0.5 }}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Sign In'}
        </Button>
      </Box>

      <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
        Don&apos;t have an account?{' '}
        <Link component={RouterLink} to="/register">
          Create one
        </Link>
      </Typography>
    </AuthShell>
  );
}
