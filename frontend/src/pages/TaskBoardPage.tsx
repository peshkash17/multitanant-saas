import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Tooltip,
  Avatar,
  Stack,
} from '@mui/material';
import { Add, Delete, Edit, ArrowBack } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useOrgStore } from '../stores/org.store';
import { tasksApi, Task } from '../api/tasks.api';
import { projectsApi, Project } from '../api/projects.api';
import { organizationsApi, Member } from '../api/organizations.api';
import { useFormDraft } from '../hooks/useFormDraft';
import { getApiErrorMessage } from '../utils/api-error';
import { useIsMobile } from '../hooks/useIsMobile';
import { useOrgRole } from '../hooks/useOrgRole';
import { PageHeader } from '../components/common/PageHeader';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useConfirmDialog } from '../hooks/useConfirmDialog';

const COLUMNS = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const;
const COLUMN_LABELS: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};
const COLUMN_COLORS: Record<string, string> = {
  TODO: '#6366f1',
  IN_PROGRESS: '#0ea5e9',
  IN_REVIEW: '#f59e0b',
  DONE: '#22c55e',
};
const PRIORITY_COLORS: Record<string, 'default' | 'info' | 'warning' | 'error'> = {
  LOW: 'default',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'error',
};

const taskSchema = z.object({
  title: z.string().min(1, 'Title required').max(200),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});
type TaskFormData = z.infer<typeof taskSchema>;

export function TaskBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const currentOrg = useOrgStore((s) => s.currentOrg);
  const { canEdit, isViewer } = useOrgRole();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [initialStatus, setInitialStatus] = useState<string>('TODO');
  const [error, setError] = useState('');
  const isMobile = useIsMobile();
  const confirmDialog = useConfirmDialog();

  const form = useForm<TaskFormData>({ resolver: zodResolver(taskSchema) });
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset } = form;
  const emptyTaskForm: TaskFormData = {
    title: '',
    description: '',
    priority: 'MEDIUM',
    assigneeId: '',
    dueDate: '',
  };
  const isCreateMode = dialogOpen && !editTask;
  const { clearFormDraft, restoreFormDraft, persistFormDraft } = useFormDraft(
    form,
    `task-draft-${projectId}`,
    isCreateMode,
  );

  const fetchData = async () => {
    if (!currentOrg || !projectId) return;
    setLoading(true);
    try {
      const [t, p, m] = await Promise.all([
        tasksApi.list(currentOrg.id, projectId),
        projectsApi.getOne(currentOrg.id, projectId),
        organizationsApi.getMembers(currentOrg.id),
      ]);
      setTasks(t);
      setProject(p);
      setMembers(m);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [currentOrg?.id, projectId]);

  const openCreate = async (status = 'TODO') => {
    setEditTask(null);
    setInitialStatus(status);
    const restored = await restoreFormDraft(emptyTaskForm);
    if (!restored) {
      reset(emptyTaskForm);
    }
    setDialogOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    reset({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assigneeId: task.assigneeId || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (!editTask) {
      void persistFormDraft();
    }
    setDialogOpen(false);
  };

  const onSubmit = async (data: TaskFormData) => {
    if (!currentOrg || !projectId) return;
    setError('');
    try {
      const payload = {
        ...data,
        assigneeId: data.assigneeId || undefined,
        dueDate: data.dueDate || undefined,
      };
      if (editTask) {
        await tasksApi.update(currentOrg.id, projectId, editTask.id, payload);
      } else {
        await tasksApi.create(currentOrg.id, projectId, { ...payload, status: initialStatus as any });
      }
      await clearFormDraft();
      setDialogOpen(false);
      fetchData();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Operation failed'));
    }
  };

  const handleDelete = (task: Task) => {
    if (!currentOrg || !projectId) return;
    confirmDialog.ask({
      title: 'Delete task',
      message: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        await tasksApi.delete(currentOrg.id, projectId, task.id);
        await fetchData();
      },
    });
  };

  const handleStatusChange = async (task: Task, newStatus: string) => {
    if (!currentOrg || !projectId) return;
    await tasksApi.update(currentOrg.id, projectId, task.id, { status: newStatus as any });
    fetchData();
  };

  if (!currentOrg) return null;

  return (
    <Box>
      <PageHeader
        title={project?.name || 'Task Board'}
        subtitle={isViewer ? 'View tasks in read-only mode' : 'Drag tasks through your workflow'}
        badge={isViewer ? 'View only' : undefined}
        action={
          canEdit ? (
            <Button
              variant="contained"
              size={isMobile ? 'small' : 'medium'}
              startIcon={<Add />}
              onClick={() => openCreate()}
            >
              Add Task
            </Button>
          ) : undefined
        }
      />
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/projects')}
        size="small"
        sx={{ mb: 2 }}
      >
        Back to Projects
      </Button>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 2,
            mx: { xs: -1.5, sm: 0 },
            px: { xs: 1.5, sm: 0 },
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col);
            return (
              <Box
                key={col}
                sx={{
                  minWidth: { xs: 260, sm: 280 },
                  flex: { xs: '0 0 260px', sm: '0 0 280px' },
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  p: { xs: 1.5, sm: 2 },
                  border: '1px solid',
                  borderColor: 'divider',
                  borderTop: '3px solid',
                  borderTopColor: COLUMN_COLORS[col],
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                    {COLUMN_LABELS[col]}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label={colTasks.length} size="small" />
                    {canEdit && (
                      <IconButton size="small" onClick={() => openCreate(col)}>
                        <Add fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
                <Stack spacing={1.5}>
                  {colTasks.map((task) => (
                    <Card
                      key={task.id}
                      sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                    >
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {task.title}
                          </Typography>
                          {canEdit && (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton size="small" onClick={() => openEdit(task)}>
                                <Edit sx={{ fontSize: 14 }} />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => handleDelete(task)}>
                                <Delete sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Box>
                          )}
                        </Box>
                        {task.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            {task.description.slice(0, 80)}
                            {task.description.length > 80 ? '...' : ''}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Chip
                            label={task.priority}
                            size="small"
                            color={PRIORITY_COLORS[task.priority]}
                            sx={{ fontSize: '0.65rem' }}
                          />
                          {task.assignee && (
                            <Tooltip title={task.assignee.name}>
                              <Avatar
                                sx={{ width: 20, height: 20, fontSize: '0.7rem', bgcolor: 'secondary.main' }}
                              >
                                {task.assignee.name[0]}
                              </Avatar>
                            </Tooltip>
                          )}
                        </Box>
                        {task.dueDate && (
                          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </Typography>
                        )}
                        {canEdit ? (
                          <FormControl size="small" fullWidth sx={{ mt: 1 }}>
                            <Select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task, e.target.value)}
                              sx={{ fontSize: '0.75rem' }}
                            >
                              {COLUMNS.map((c) => (
                                <MenuItem key={c} value={c} sx={{ fontSize: '0.75rem' }}>
                                  {COLUMN_LABELS[c]}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <Chip
                            label={COLUMN_LABELS[task.status]}
                            size="small"
                            sx={{ mt: 1, fontSize: '0.7rem' }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            );
          })}
        </Box>
      )}

      {canEdit && (
        <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>{editTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box
            component="form"
            id="task-form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
          >
            <TextField
              label="Title"
              fullWidth
              {...register('title')}
              error={!!errors.title}
              helperText={errors.title?.message}
              autoFocus
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              {...register('description')}
            />
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select label="Priority" {...field}>
                    {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => (
                      <MenuItem key={p} value={p}>{p}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            <Controller
              name="assigneeId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Assignee</InputLabel>
                  <Select label="Assignee" {...field}>
                    <MenuItem value="">Unassigned</MenuItem>
                    {members.map((m) => (
                      <MenuItem key={m.userId} value={m.userId}>{m.user?.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            <TextField
              label="Due Date"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              {...register('dueDate')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            type="submit"
            form="task-form"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={18} /> : editTask ? 'Update' : 'Create'}
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
