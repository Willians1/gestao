import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowBack, Home } from '@mui/icons-material';

export default function PageLayout({
  title,
  subtitle,
  children,
  actions = null,
  showBackButton = true,
  showHomeButton = true,
}) {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 3,
      }}
    >
      <Box
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 3,
          backdropFilter: 'blur(10px)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            p: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {showBackButton && (
              <IconButton
                onClick={() => navigate(-1)}
                sx={{
                  color: 'white',
                  background: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.3)',
                  },
                }}
              >
                <ArrowBack />
              </IconButton>
            )}

            {showHomeButton && (
              <IconButton
                onClick={() => navigate('/')}
                sx={{
                  color: 'white',
                  background: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.3)',
                  },
                }}
              >
                <Home />
              </IconButton>
            )}

            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mb: subtitle ? 0.5 : 0,
                }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography
                  variant="body1"
                  sx={{
                    opacity: 0.9,
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>

          {actions && <Box sx={{ display: 'flex', gap: 1 }}>{actions}</Box>}
        </Box>

        {/* Content */}
        <Box sx={{ p: 3 }}>{children}</Box>
      </Box>
    </Box>
  );
}
