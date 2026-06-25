import { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  useTheme,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  FolderOpen,
  Task as TaskIcon,
  Person,
  Brightness4,
  Brightness7,
  Notifications,
  ExitToApp,
  Business,
  Payment,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { useThemeStore } from '../../stores/theme.store';
import { useNotificationStore } from '../../stores/notification.store';
import { useOrgAdmin } from '../../hooks/useOrgAdmin';
import { useOrgRole } from '../../hooks/useOrgRole';
import { OrgSwitcher } from './OrgSwitcher';
import { NotificationPanel } from '../common/NotificationPanel';

const DRAWER_WIDTH = 240;

const baseNavItems = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { label: 'Projects', icon: <FolderOpen />, path: '/projects' },
  { label: 'Profile', icon: <Person />, path: '/profile' },
];

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  useTheme();

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { mode, toggleTheme } = useThemeStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isAdmin = useOrgAdmin();
  const { role } = useOrgRole();

  const roleLabel =
    role === 'ADMIN' ? 'Admin' : role === 'EDITOR' ? 'Editor' : role === 'VIEWER' ? 'Viewer' : null;

  const navItems = isAdmin
    ? [
        ...baseNavItems.slice(0, 2),
        { label: 'Payments', icon: <Payment />, path: '/payments' },
        ...baseNavItems.slice(2),
      ]
    : baseNavItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        sx={{
          background: (t) =>
            t.palette.mode === 'light'
              ? 'linear-gradient(135deg, #eef2ff 0%, #ffffff 100%)'
              : 'linear-gradient(135deg, #1e1b4b 0%, #1e293b 100%)',
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            mr: 1.5,
          }}
        >
          <Business sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.25rem' } }} color="primary.main">
          WorkSpace
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ px: 2, py: 1.5 }}>
        <OrgSwitcher />
        {roleLabel && (
          <Chip
            label={roleLabel}
            size="small"
            sx={{ mt: 1, width: '100%', justifyContent: 'flex-start' }}
            color={role === 'ADMIN' ? 'error' : role === 'EDITOR' ? 'primary' : 'default'}
            variant="outlined"
          />
        )}
      </Box>
      <Divider />
      <List>
        {navItems.map(({ label, icon, path }) => (
          <ListItem key={path} disablePadding>
            <ListItemButton
              selected={location.pathname.startsWith(path)}
              onClick={() => { navigate(path); setMobileOpen(false); }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{icon}</ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { xs: '100%', sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ px: { xs: 1.5, sm: 2 } }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Toggle theme">
            <IconButton onClick={toggleTheme} color="inherit">
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              onClick={(e) => setNotifAnchor(e.currentTarget)}
            >
              <Badge badgeContent={unreadCount} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="Account">
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar
                sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
                src={user?.avatarUrl}
              >
                {user?.name?.[0]}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 2, md: 3 },
          width: { xs: '100%', sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          maxWidth: '100%',
          overflowX: 'hidden',
          mt: { xs: '56px', sm: '64px' },
        }}
      >
        <Outlet />
      </Box>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null); }}>
          <ListItemIcon><Person fontSize="small" /></ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon><ExitToApp fontSize="small" /></ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      <NotificationPanel
        anchor={notifAnchor}
        onClose={() => setNotifAnchor(null)}
      />
    </Box>
  );
}
