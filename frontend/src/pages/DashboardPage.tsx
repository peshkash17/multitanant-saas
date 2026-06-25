import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  FolderOpen,
  People,
  Task,
  TrendingUp,
  PersonAdd,
} from '@mui/icons-material';
import { useOrgStore } from '../stores/org.store';
import { projectsApi } from '../api/projects.api';
import type { Project } from '../api/projects.api';
import { organizationsApi } from '../api/organizations.api';
import type { Member } from '../api/organizations.api';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../utils/api-error';
import { useOrgAdmin } from '../hooks/useOrgAdmin';
import { useOrgRole } from '../hooks/useOrgRole';
import { useIsMobile } from '../hooks/useIsMobile';
import { PageHeader } from '../components/common/PageHeader';

function StatCard({ icon, title, value, color }: { icon: React.ReactNode; title: string; value: number; color: 'primary' | 'success' | 'info' | 'warning' }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              bgcolor: `${color}.main`,
              color: '#fff',
              display: 'flex',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const currentOrg = useOrgStore((s) => s.currentOrg);
  const isAdmin = useOrgAdmin();
  const { canEdit } = useOrgRole();
  const isMobile = useIsMobile();
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'EDITOR' });
  const navigate = useNavigate();

  const loadDashboard = useCallback(async () => {
    if (!currentOrg) return;
    setLoading(true);
    try {
      const [p, m] = await Promise.all([
        projectsApi.list(currentOrg.id),
        organizationsApi.getMembers(currentOrg.id),
      ]);
      setProjects(p);
      setMembers(m);
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleInvite = async () => {
    if (!currentOrg) return;
    setInviteError('');
    setInviteLoading(true);
    try {
      await organizationsApi.inviteMember(currentOrg.id, inviteForm);
      setInviteOpen(false);
      setInviteForm({ email: '', role: 'EDITOR' });
      await loadDashboard();
    } catch (err: unknown) {
      setInviteError(getApiErrorMessage(err, 'Failed to invite member'));
    } finally {
      setInviteLoading(false);
    }
  };

  if (!currentOrg) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Create or select an organization to get started.
        </Typography>
      </Box>
    );
  }

  const activeProjects = projects.filter((p) => p.status === 'ACTIVE');
  const completedProjects = projects.filter((p) => p.status === 'COMPLETED');

  return (
    <Box>
      <PageHeader
        title={`${currentOrg.name} Dashboard`}
        subtitle="Overview of projects, progress, and team activity"
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard icon={<FolderOpen />} title="Total Projects" value={projects.length} color="primary" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard icon={<TrendingUp />} title="Active Projects" value={activeProjects.length} color="success" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard icon={<Task />} title="Completed" value={completedProjects.length} color="info" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard icon={<People />} title="Members" value={members.length} color="warning" />
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Recent Projects
                </Typography>
                {projects.slice(0, 5).map((project) => (
                  <Box
                    key={project.id}
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      justifyContent: 'space-between',
                      gap: 1,
                      py: 1.5,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover', borderRadius: 1 },
                      px: 1,
                    }}
                    onClick={() => navigate(`/projects/${project.id}/tasks`)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <FolderOpen color="primary" />
                      <Typography variant="body1">{project.name}</Typography>
                    </Box>
                    <Chip
                      label={project.status}
                      size="small"
                      color={
                        project.status === 'ACTIVE'
                          ? 'success'
                          : project.status === 'COMPLETED'
                          ? 'default'
                          : 'warning'
                      }
                    />
                  </Box>
                ))}
                {projects.length === 0 && (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                    {canEdit
                      ? 'No projects yet. Create one from the Projects page.'
                      : 'No projects in this organization yet.'}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Team Members
                  </Typography>
                  {isAdmin && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PersonAdd />}
                      onClick={() => {
                        setInviteError('');
                        setInviteOpen(true);
                      }}
                    >
                      Invite
                    </Button>
                  )}
                </Box>
                <List dense>
                  {members.map((m) => (
                    <ListItem key={m.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                          {m.user?.name?.[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={m.user?.name}
                        secondary={m.user?.email}
                        slotProps={{
                          secondary: { sx: { wordBreak: 'break-all' } },
                        }}
                      />
                      <Chip
                        label={m.role}
                        size="small"
                        color={m.role === 'ADMIN' ? 'error' : m.role === 'EDITOR' ? 'primary' : 'default'}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle>Invite Member</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {inviteError && <Alert severity="error">{inviteError}</Alert>}
          <TextField
            label="Email"
            type="email"
            value={inviteForm.email}
            onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
            autoFocus
            fullWidth
            helperText="User must already have a registered account"
          />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={inviteForm.role}
              label="Role"
              onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))}
            >
              <MenuItem value="EDITOR">Editor — can manage projects and tasks</MenuItem>
              <MenuItem value="VIEWER">Viewer — read-only access</MenuItem>
              <MenuItem value="ADMIN">Admin — full organization access</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleInvite}
            disabled={inviteLoading || !inviteForm.email.trim()}
          >
            {inviteLoading ? <CircularProgress size={18} /> : 'Send Invite'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
