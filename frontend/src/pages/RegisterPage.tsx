import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Business } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { useFormDraft } from '../hooks/useFormDraft';
import { getApiErrorMessage } from '../utils/api-error';
import { AuthShell } from '../components/common/AuthShell';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;
  const { clearFormDraft } = useFormDraft(form, 'register-draft');

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await authApi.register(data);
      clearFormDraft();
      navigate('/login', { replace: true, state: { registered: true, email: data.email } });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Registration failed'));
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
          Create your account
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Get started with WorkSpace
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Full Name"
          fullWidth
          {...register('name')}
          error={!!errors.name}
          helperText={errors.name?.message}
        />
        <TextField
          label="Email"
          type="email"
          fullWidth
          {...register('email')}
          error={!!errors.email}
          helperText={errors.email?.message}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={isSubmitting}
          sx={{ mt: 0.5 }}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Create Account'}
        </Button>
      </Box>

      <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
        Already have an account?{' '}
        <Link component={RouterLink} to="/login">
          Sign in
        </Link>
      </Typography>
    </AuthShell>
  );
}
