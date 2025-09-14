import React from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import { API_BASE } from '../api';

export default function Admin() {
  const theme = useTheme();
  
  const handleDownloadBackup = () => {
    window.open(`${API_BASE}/admin/backup`, '_blank');
  };

  const handleDownloadSource = () => {
    window.open(`${API_BASE}/admin/download-source`, '_blank');
  };

  return (
    <Box sx={{ 
      p: 3,
      backgroundColor: theme.palette.background.default,
      minHeight: '100vh'
    }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Painel de Administração
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column', maxWidth: 400 }}>
        <Button 
          variant="contained" 
          onClick={handleDownloadBackup}
          size="large"
        >
          Download Backup do Sistema
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={handleDownloadSource}
          size="large"
        >
          Download Código Fonte
        </Button>
      </Box>
    </Box>
  );
}
