import { useState } from 'react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useOrgStore } from '../../stores/org.store';
import { organizationsApi } from '../../api/organizations.api';

export function OrgSwitcher() {
  const { organizations, currentOrg, setCurrentOrg, addOrganization } = useOrgStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '' });

  const handleCreate = async () => {
    setLoading(true);
    try {
      const org = await organizationsApi.create(form);
      addOrganization({ ...org, role: 'ADMIN' });
      setOpen(false);
      setForm({ name: '', slug: '' });
    } finally {
      setLoading(false);
    }
  };

  if (organizations.length === 0) {
    return (
      <Box>
        <Typography variant="caption" color="text.secondary">No organizations</Typography>
        <Button
          size="small"
          startIcon={<Add />}
          onClick={() => setOpen(true)}
          fullWidth
          sx={{ mt: 1 }}
        >
          Create Org
        </Button>
        <CreateOrgDialog
          open={open}
          form={form}
          setForm={setForm}
          loading={loading}
          onClose={() => setOpen(false)}
          onCreate={handleCreate}
        />
      </Box>
    );
  }

  return (
    <Box>
      <FormControl fullWidth size="small">
        <Select
          value={currentOrg?.id || ''}
          onChange={(e) => {
            const org = organizations.find((o) => o.id === e.target.value);
            if (org) setCurrentOrg(org);
          }}
          displayEmpty
        >
          {organizations.map((org) => (
            <MenuItem key={org.id} value={org.id}>
              {org.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button
        size="small"
        startIcon={<Add />}
        onClick={() => setOpen(true)}
        fullWidth
        sx={{ mt: 1 }}
        variant="outlined"
      >
        New Org
      </Button>
      <CreateOrgDialog
        open={open}
        form={form}
        setForm={setForm}
        loading={loading}
        onClose={() => setOpen(false)}
        onCreate={handleCreate}
      />
    </Box>
  );
}

function CreateOrgDialog({
  open,
  form,
  setForm,
  loading,
  onClose,
  onCreate,
}: any) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Create Organization</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <TextField
          label="Name"
          value={form.name}
          onChange={(e) =>
            setForm((f: any) => ({
              ...f,
              name: e.target.value,
              slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            }))
          }
          autoFocus
          fullWidth
        />
        <TextField
          label="Slug"
          value={form.slug}
          onChange={(e) => setForm((f: any) => ({ ...f, slug: e.target.value }))}
          fullWidth
          helperText="Lowercase letters, numbers, hyphens only"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onCreate}
          variant="contained"
          disabled={loading || !form.name || !form.slug}
        >
          {loading ? <CircularProgress size={18} /> : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
