import React from 'react';
import { Box, Typography, Button, Card, CardContent, Alert } from '@mui/material';
import { Download, Backup, Code } from '@mui/icons-material';

export default function Admin() {
  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const handleDownloadBackup = () => {
    window.open(`${API}/admin/backup`, '_blank');
  };

  const handleDownloadSource = () => {
    window.open(`${API}/admin/download-source`, '_blank');
  };

  return (
    <Box sx={{ background: '#f8fafb', minHeight: '100vh', p: 4 }}>
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Painel de Administração
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Área restrita para administradores do sistema
        </Typography>

        <Alert severity="warning" sx={{ mb: 3 }}>
          Esta área contém funcionalidades críticas do sistema. Use com cuidado.
        </Alert>

        <Box sx={{ display: 'grid', gap: 3 }}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Backup color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">Backup do Sistema</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Download completo do banco de dados e arquivos.
              </Typography>
              <Button variant="contained" startIcon={<Download />} onClick={handleDownloadBackup}>
                Download Backup
              </Button>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Code color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">Código Fonte</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Download do código fonte completo em ZIP.
              </Typography>
              <Button variant="outlined" startIcon={<Download />} onClick={handleDownloadSource}>
                Download Código
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
