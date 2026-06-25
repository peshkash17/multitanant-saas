import React from 'react';
import {
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Chip,
} from '@mui/material';
import { NotificationsNone } from '@mui/icons-material';
import { useNotificationStore } from '../../stores/notification.store';

interface Props {
  anchor: HTMLElement | null;
  onClose: () => void;
}

export function NotificationPanel({ anchor, onClose }: Props) {
  const { notifications, markAllAsRead, clearAll } = useNotificationStore();

  return (
    <Popover
      open={Boolean(anchor)}
      anchorEl={anchor}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{
        paper: {
          sx: { width: { xs: 'calc(100vw - 32px)', sm: 360 }, maxWidth: 360 },
        },
      }}
    >
      <Box>
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Notifications
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" onClick={markAllAsRead}>
              Mark all read
            </Button>
            <Button size="small" color="error" onClick={clearAll}>
              Clear
            </Button>
          </Box>
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <NotificationsNone sx={{ fontSize: 48, color: 'text.disabled' }} />
            <Typography color="text.secondary">No notifications</Typography>
          </Box>
        ) : (
          <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
            {notifications.map((n) => (
              <React.Fragment key={n.id}>
                <ListItem sx={{ bgcolor: n.read ? 'transparent' : 'action.hover' }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={n.type.replace(/_/g, ' ')}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontSize: '0.65rem' }}
                        />
                        {!n.read && (
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main' }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2">{n.message}</Typography>
                        <Typography variant="caption" color="text.disabled">
                          {new Date(n.timestamp).toLocaleTimeString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Popover>
  );
}
