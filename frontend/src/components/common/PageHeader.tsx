import { Box, Typography, Chip } from '@mui/material';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  badge?: string;
}

export function PageHeader({ title, subtitle, action, badge }: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'flex-start' },
        justifyContent: 'space-between',
        gap: 2,
        mb: 3,
      }}
    >
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, fontSize: { xs: '1.35rem', sm: '1.75rem' } }}
          >
            {title}
          </Typography>
          {badge && (
            <Chip label={badge} size="small" variant="outlined" color="default" />
          )}
        </Box>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && (
        <Box sx={{ flexShrink: 0, alignSelf: { xs: 'stretch', sm: 'center' } }}>
          {action}
        </Box>
      )}
    </Box>
  );
}
