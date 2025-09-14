import React from 'react';
import { Box, Typography } from '@mui/material';

export default function TestePage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}
    >
      <Typography variant="h3" sx={{ color: '#1f2937' }}>
        Página de Teste - React está funcionando!
      </Typography>
    </Box>
  );
}
