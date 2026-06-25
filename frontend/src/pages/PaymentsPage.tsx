import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Add, CheckCircle, Replay } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useOrgStore } from '../stores/org.store';
import { paymentsApi, Payment, PaymentStatus } from '../api/payments.api';
import { useOrgAdmin } from '../hooks/useOrgAdmin';
import { useIsMobile } from '../hooks/useIsMobile';
import { getApiErrorMessage } from '../utils/api-error';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useConfirmDialog } from '../hooks/useConfirmDialog';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR'] as const;

const schema = z.object({
  amount: z.number({ error: 'Amount is required' }).min(0.01, 'Amount must be at least 0.01'),
  currency: z.enum(CURRENCIES),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STATUS_COLORS: Record<PaymentStatus, 'default' | 'warning' | 'success' | 'error'> = {
  PENDING: 'warning',
  COMPLETED: 'success',
  FAILED: 'error',
  REFUNDED: 'default',
};

function formatAmount(amount: number | string, currency: string) {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(value);
}

function PaymentActions({
  payment,
  loadingId,
  onVerify,
  onRefund,
}: {
  payment: Payment;
  loadingId: string | null;
  onVerify: (p: Payment) => void;
  onRefund: (p: Payment) => void;
}) {
  const busy = loadingId === payment.id;

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
      {payment.status === 'PENDING' && (
        <Button
          size="small"
          variant="outlined"
          startIcon={busy ? <CircularProgress size={14} /> : <CheckCircle />}
          disabled={busy}
          onClick={() => onVerify(payment)}
        >
          Verify
        </Button>
      )}
      {payment.status === 'COMPLETED' && (
        <Button
          size="small"
          variant="outlined"
          color="warning"
          startIcon={busy ? <CircularProgress size={14} /> : <Replay />}
          disabled={busy}
          onClick={() => onRefund(payment)}
        >
          Refund
        </Button>
      )}
    </Stack>
  );
}

function PaymentCard({
  payment,
  loadingId,
  onVerify,
  onRefund,
}: {
  payment: Payment;
  loadingId: string | null;
  onVerify: (p: Payment) => void;
  onRefund: (p: Payment) => void;
}) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {formatAmount(payment.amount, payment.currency)}
          </Typography>
          <Chip label={payment.status} size="small" color={STATUS_COLORS[payment.status]} />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Provider: {payment.provider || 'mock'}
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 2 }}>
          {new Date(payment.createdAt).toLocaleString()}
        </Typography>
        <PaymentActions
          payment={payment}
          loadingId={loadingId}
          onVerify={onVerify}
          onRefund={onRefund}
        />
      </CardContent>
    </Card>
  );
}

export function PaymentsPage() {
  const currentOrg = useOrgStore((s) => s.currentOrg);
  const isAdmin = useOrgAdmin();
  const isMobile = useIsMobile();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const confirmDialog = useConfirmDialog();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 99.99, currency: 'USD', description: '' },
  });
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset } = form;

  const loadPayments = useCallback(async () => {
    if (!currentOrg || !isAdmin) return;
    setLoading(true);
    try {
      const data = await paymentsApi.list(currentOrg.id);
      setPayments(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to load payments'));
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id, isAdmin]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const onCreate = async (data: FormData) => {
    if (!currentOrg) return;
    setError('');
    setSuccess('');
    try {
      await paymentsApi.create(currentOrg.id, data);
      setDialogOpen(false);
      reset({ amount: 99.99, currency: 'USD', description: '' });
      setSuccess('Payment created successfully');
      await loadPayments();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to create payment'));
    }
  };

  const handleVerify = async (payment: Payment) => {
    if (!currentOrg) return;
    setActionLoadingId(payment.id);
    setError('');
    setSuccess('');
    try {
      await paymentsApi.verify(currentOrg.id, payment.id);
      setSuccess('Payment verified');
      await loadPayments();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Verification failed'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRefund = (payment: Payment) => {
    if (!currentOrg) return;
    confirmDialog.ask({
      title: 'Refund payment',
      message: `Refund ${formatAmount(payment.amount, payment.currency)}? This cannot be undone.`,
      confirmLabel: 'Refund',
      confirmColor: 'warning',
      onConfirm: async () => {
        setActionLoadingId(payment.id);
        setError('');
        setSuccess('');
        try {
          await paymentsApi.refund(currentOrg.id, payment.id);
          setSuccess('Payment refunded');
          await loadPayments();
        } catch (err: unknown) {
          setError(getApiErrorMessage(err, 'Refund failed'));
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  };

  if (!currentOrg) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="text.secondary">Select an organization first.</Typography>
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Box sx={{ maxWidth: 480, mx: 'auto', py: 4 }}>
        <Alert severity="info">
          Payments are available to organization admins only.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Payments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Mock payment provider — create, verify, and refund
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => { setError(''); setDialogOpen(true); }}
          sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
        >
          New Payment
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : payments.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">No payments yet. Create your first payment.</Typography>
          </CardContent>
        </Card>
      ) : isMobile ? (
        <Stack spacing={2}>
          {payments.map((payment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              loadingId={actionLoadingId}
              onVerify={handleVerify}
              onRefund={handleRefund}
            />
          ))}
        </Stack>
      ) : (
        <TableContainer component={Card} sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Provider</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {formatAmount(payment.amount, payment.currency)}
                  </TableCell>
                  <TableCell>
                    <Chip label={payment.status} size="small" color={STATUS_COLORS[payment.status]} />
                  </TableCell>
                  <TableCell>{payment.provider || 'mock'}</TableCell>
                  <TableCell>{new Date(payment.createdAt).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <PaymentActions
                      payment={payment}
                      loadingId={actionLoadingId}
                      onVerify={handleVerify}
                      onRefund={handleRefund}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Create Payment</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            id="payment-form"
            onSubmit={handleSubmit(onCreate)}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
          >
            <TextField
              label="Amount"
              type="number"
              fullWidth
              {...register('amount', { valueAsNumber: true })}
              error={!!errors.amount}
              helperText={errors.amount?.message}
              autoFocus
              slotProps={{
                htmlInput: { step: '0.01', min: '0.01' },
              }}
            />
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.currency}>
                  <InputLabel>Currency</InputLabel>
                  <Select label="Currency" {...field}>
                    {CURRENCIES.map((c) => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              {...register('description')}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button type="submit" form="payment-form" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={18} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.options?.title ?? ''}
        message={confirmDialog.options?.message ?? ''}
        confirmLabel={confirmDialog.options?.confirmLabel}
        confirmColor={confirmDialog.options?.confirmColor}
        loading={confirmDialog.loading}
        onConfirm={confirmDialog.confirm}
        onCancel={confirmDialog.close}
      />
    </Box>
  );
}
