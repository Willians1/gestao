import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';

// Layout base para todas as páginas do sistema
export default function LayoutBase({ children, titulo, subtitulo }) {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 3,
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 3,
            p: 4,
            backdropFilter: 'blur(10px)',
            minHeight: 'calc(100vh - 48px)',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 4,
              pb: 2,
              borderBottom: '2px solid #e5e7eb',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => navigate('/')}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  borderColor: '#3b82f6',
                  color: '#3b82f6',
                  '&:hover': {
                    backgroundColor: '#3b82f6',
                    color: 'white',
                  },
                }}
              >
                Dashboard
              </Button>

              <Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: '#1f2937',
                    mb: 0.5,
                  }}
                >
                  {titulo}
                </Typography>
                {subtitulo && (
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#6b7280',
                      fontWeight: 400,
                    }}
                  >
                    {subtitulo}
                  </Typography>
                )}
              </Box>
            </Box>

            <Button
              variant="outlined"
              color="error"
              onClick={() => navigate('/login')}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: 600,
              }}
            >
              Sair
            </Button>
          </Box>

          {/* Conteúdo da página */}
          <Box sx={{ mt: 3 }}>{children}</Box>

          {/* Footer */}
          <Box
            sx={{
              textAlign: 'center',
              mt: 6,
              pt: 3,
              borderTop: '1px solid #e5e7eb',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: '#6b7280',
                fontWeight: 500,
              }}
            >
              Sistema de Gestão de Obras © 2024
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
