import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Avatar,
  Alert,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../stores/auth.store';
import { useOrgStore } from '../stores/org.store';
import { apiClient } from '../api/client';
import { getApiErrorMessage } from '../utils/api-error';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  avatarUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
});
type FormData = z.infer<typeof schema>;

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const organizations = useOrgStore((s) => s.organizations);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name || '', avatarUrl: user?.avatarUrl || '' },
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    setSuccess(false);
    try {
      const response = await apiClient.put('/users/me', data);
      updateUser(response.data);
      setSuccess(true);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Update failed'));
    }
  };

  return (
    <Box sx={{ maxWidth: 600, width: '100%' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
        Profile
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'center', sm: 'flex-start' },
              textAlign: { xs: 'center', sm: 'left' },
              gap: 3,
              mb: 3,
            }}
          >
            <Avatar
              src={user?.avatarUrl}
              sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}
            >
              {user?.name?.[0]}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{user?.name}</Typography>
              <Typography color="text.secondary">{user?.email}</Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {success && <Alert severity="success" sx={{ mb: 2 }}>Profile updated successfully!</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              label="Full Name"
              fullWidth
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              label="Email"
              fullWidth
              value={user?.email}
              disabled
              helperText="Email cannot be changed"
            />
            <TextField
              label="Avatar URL"
              fullWidth
              {...register('avatarUrl')}
              error={!!errors.avatarUrl}
              helperText={errors.avatarUrl?.message}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              sx={{ alignSelf: 'flex-start' }}
            >
              {isSubmitting ? <CircularProgress size={20} /> : 'Save Changes'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            My Organizations
          </Typography>
          {organizations.map((org) => (
            <Box
              key={org.id}
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                gap: 1,
                py: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography>{org.name}</Typography>
              <Chip
                label={(org as { role?: string }).role || 'MEMBER'}
                size="small"
                color={(org as { role?: string }).role === 'ADMIN' ? 'error' : 'primary'}
              />
            </Box>
          ))}
          {organizations.length === 0 && (
            <Typography color="text.secondary">Not a member of any organization.</Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
