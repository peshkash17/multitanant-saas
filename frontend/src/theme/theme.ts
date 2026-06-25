import { createTheme, alpha } from '@mui/material/styles';

export const getTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: '#6366f1',
        light: '#818cf8',
        dark: '#4f46e5',
      },
      secondary: {
        main: '#14b8a6',
        light: '#2dd4bf',
        dark: '#0d9488',
      },
      background: {
        default: mode === 'light' ? '#f1f5f9' : '#0f172a',
        paper: mode === 'light' ? '#ffffff' : '#1e293b',
      },
      divider: mode === 'light' ? '#e2e8f0' : '#334155',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700, letterSpacing: '-0.02em' },
      h2: { fontWeight: 700, letterSpacing: '-0.02em' },
      h3: { fontWeight: 600, letterSpacing: '-0.01em' },
      h4: { fontWeight: 600, letterSpacing: '-0.01em' },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: mode === 'light' ? '#cbd5e1 transparent' : '#475569 transparent',
          },
        },
      },
      MuiDialog: {
        defaultProps: {
          fullWidth: true,
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 10,
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          },
          contained: {
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: '1px solid',
            borderColor: mode === 'light' ? '#e2e8f0' : '#334155',
            boxShadow:
              mode === 'light'
                ? '0 1px 3px 0 rgb(0 0 0 / 0.06)'
                : '0 1px 3px 0 rgb(0 0 0 / 0.25)',
            transition: 'box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 500, borderRadius: 8 },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: '1px solid',
            borderColor: mode === 'light' ? '#e2e8f0' : '#334155',
            backgroundImage: 'none',
            backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            marginInline: 8,
            marginBottom: 4,
            '&.Mui-selected': {
              backgroundColor: alpha('#6366f1', mode === 'light' ? 0.1 : 0.18),
              color: mode === 'light' ? '#4f46e5' : '#a5b4fc',
              '& .MuiListItemIcon-root': {
                color: mode === 'light' ? '#4f46e5' : '#a5b4fc',
              },
              '&:hover': {
                backgroundColor: alpha('#6366f1', mode === 'light' ? 0.14 : 0.22),
              },
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backdropFilter: 'blur(8px)',
            backgroundColor: alpha(mode === 'light' ? '#ffffff' : '#1e293b', 0.85),
          },
        },
      },
    },
  });
