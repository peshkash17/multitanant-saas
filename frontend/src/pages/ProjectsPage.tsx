import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Tooltip,
  alpha,
} from '@mui/material';
import { Add, Edit, Delete, OpenInNew, FolderOpen } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useOrgStore } from '../stores/org.store';
import { projectsApi } from '../api/projects.api';
import type { Project } from '../api/projects.api';
import { useFormDraft } from '../hooks/useFormDraft';
import { getApiErrorMessage } from '../utils/api-error';
import { useIsMobile } from '../hooks/useIsMobile';
import { useOrgRole } from '../hooks/useOrgRole';
import { PageHeader } from '../components/common/PageHeader';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useConfirmDialog } from '../hooks/useConfirmDialog';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'default'> = {
  ACTIVE: 'success',
  ARCHIVED: 'warning',
  COMPLETED: 'default',
};

const STATUS_ACCENT: Record<string, string> = {
  ACTIVE: '#22c55e',
  ARCHIVED: '#f59e0b',
  COMPLETED: '#64748b',
};

export function ProjectsPage() {
  const currentOrg = useOrgStore((s) => s.currentOrg);
  const { canEdit, isViewer } = useOrgRole();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [error, setError] = useState('');
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const confirmDialog = useConfirmDialog();

  const fetchProjects = async () => {
    if (!currentOrg) return;
    setLoading(true);
    try {
      const data = await projectsApi.list(currentOrg.id);
      setProjects(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, [currentOrg?.id]);

  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = form;
  const emptyProjectForm = { name: '', description: '' };
  const isCreateMode = dialogOpen && !editProject;
  const { clearFormDraft, restoreFormDraft, persistFormDraft } = useFormDraft(
    form,
    'create-project-draft',
    isCreateMode,
  );

  const closeDialog = () => {
    if (!editProject) {
      void persistFormDraft();
    }
    setDialogOpen(false);
  };

  const openCreate = async () => {
    setEditProject(null);
    const restored = await restoreFormDraft(emptyProjectForm);
    if (!restored) {
      reset(emptyProjectForm);
    }
    setDialogOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditProject(project);
    reset({ name: project.name, description: project.description || '' });
    setDialogOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    if (!currentOrg) return;
    setError('');
    try {
      if (editProject) {
        await projectsApi.update(currentOrg.id, editProject.id, data);
      } else {
        await projectsApi.create(currentOrg.id, data);
      }
      await clearFormDraft();
      setDialogOpen(false);
      fetchProjects();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Operation failed'));
    }
  };

  const handleDelete = (project: Project) => {
    if (!currentOrg) return;
    confirmDialog.ask({
      title: 'Delete project',
      message: `Are you sure you want to delete "${project.name}"? All tasks in this project will also be removed.`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        await projectsApi.delete(currentOrg.id, project.id);
        await fetchProjects();
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

  return (
    <Box>
      <PageHeader
        title="Projects"
        subtitle={
          isViewer
            ? 'Browse projects in read-only mode'
            : 'Organize work across your team'
        }
        badge={isViewer ? 'View only' : undefined}
        action={
          canEdit ? (
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
              New Project
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  '&:hover': {
                    boxShadow: (t) =>
                      t.palette.mode === 'light'
                        ? '0 12px 24px -8px rgb(99 102 241 / 0.18)'
                        : '0 12px 24px -8px rgb(0 0 0 / 0.4)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box
                  sx={{
                    height: 4,
                    bgcolor: STATUS_ACCENT[project.status] ?? '#6366f1',
                  }}
                />
                <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, minWidth: 0 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                          color: 'primary.main',
                          flexShrink: 0,
                        }}
                      >
                        <FolderOpen fontSize="small" />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }} noWrap>
                        {project.name}
                      </Typography>
                    </Box>
                    <Chip
                      label={project.status}
                      size="small"
                      color={STATUS_COLORS[project.status]}
                    />
                  </Box>
                  {project.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {project.description}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.disabled">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<OpenInNew />}
                    onClick={() => navigate(`/projects/${project.id}/tasks`)}
                    sx={{ mr: 'auto' }}
                  >
                    Open Board
                  </Button>
                  {canEdit && (
                    <>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(project)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(project)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
          {projects.length === 0 && (
            <Grid size={12}>
              <Box
                sx={{
                  textAlign: 'center',
                  py: 8,
                  px: 3,
                  borderRadius: 3,
                  border: '1px dashed',
                  borderColor: 'divider',
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.03),
                }}
              >
                <FolderOpen sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">
                  {canEdit
                    ? 'No projects yet. Create your first project to get started.'
                    : 'No projects in this organization yet.'}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {canEdit && (
        <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth fullScreen={isMobile}>
          <DialogTitle>{editProject ? 'Edit Project' : 'Create Project'}</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box
              component="form"
              id="project-form"
              onSubmit={handleSubmit(onSubmit)}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
            >
              <TextField
                label="Project Name"
                fullWidth
                {...register('name')}
                error={!!errors.name}
                helperText={errors.name?.message}
                autoFocus
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                {...register('description')}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button
              type="submit"
              form="project-form"
              variant="contained"
              disabled={isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={18} /> : editProject ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

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
