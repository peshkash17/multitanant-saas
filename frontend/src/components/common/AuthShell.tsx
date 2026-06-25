import { Box, Card, CardContent } from '@mui/material';
import type { ReactNode } from 'react';

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        position: 'relative',
        overflow: 'hidden',
        background: (theme) =>
          theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #eef2ff 0%, #f8fafc 45%, #ecfeff 100%)'
            : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #0f172a 100%)',
        '&::before': {
          content: '""',
          position: 'absolute',
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: (theme) =>
            theme.palette.mode === 'light'
              ? 'radial-gradient(circle, rgb(99 102 241 / 0.12) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgb(99 102 241 / 0.2) 0%, transparent 70%)',
          top: -120,
          right: -120,
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: (theme) =>
            theme.palette.mode === 'light'
              ? 'radial-gradient(circle, rgb(20 184 166 / 0.1) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgb(20 184 166 / 0.15) 0%, transparent 70%)',
          bottom: -80,
          left: -80,
          pointerEvents: 'none',
        },
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 420,
          position: 'relative',
          zIndex: 1,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: (theme) =>
            theme.palette.mode === 'light'
              ? '0 25px 50px -12px rgb(99 102 241 / 0.15)'
              : '0 25px 50px -12px rgb(0 0 0 / 0.45)',
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>{children}</CardContent>
      </Card>
    </Box>
  );
}
