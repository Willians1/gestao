import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { Science, AcUnit, Home, NavigateNext } from '@mui/icons-material';

export default function TestesLojaMenu() {
  const theme = useTheme();
  const navigate = useNavigate();

  const testesCards = [
    {
      title: 'Gerador',
      icon: <Science sx={{ fontSize: 40, color: '#fff' }} />,
      backgroundColor: '#EF5350', // Vermelho
      route: '/testes-loja',
      description: '',
    },
    {
      title: 'Ar Condicionado',
      icon: <AcUnit sx={{ fontSize: 40, color: '#fff' }} />,
      backgroundColor: '#29B6F6', // Azul céu
      route: '/testes-ar-condicionado',
      description: '',
    },
  ];

  const handleCardClick = (route) => {
    navigate(route);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        p: { xs: 2, sm: 3, md: 4 },
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            url("data:image/svg+xml,${encodeURIComponent(`
              <svg viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <style>
                    .thors-text { font-family: 'Arial Black', Arial, sans-serif; font-weight: 900; font-size: 140px; fill: #1e293b; letter-spacing: -5px; }
                    .circuit-line { stroke: #f59e0b; stroke-width: 3; fill: none; stroke-linecap: round; }
                  </style>
                </defs>
                <text x="50%" y="50%" text-anchor="middle" class="thors-text" opacity="0.03">THORS</text>
                <circle cx="150" cy="150" r="3" fill="#f59e0b" opacity="0.6"/>
                <circle cx="750" cy="450" r="2" fill="#3b82f6" opacity="0.4"/>
                <circle cx="650" cy="100" r="2" fill="#10b981" opacity="0.5"/>
                <line x1="150" y1="150" x2="200" y2="120" class="circuit-line" opacity="0.3"/>
                <line x1="200" y1="120" x2="250" y2="140" class="circuit-line" opacity="0.3"/>
                <line x1="650" y1="100" x2="700" y2="150" class="circuit-line" opacity="0.2"/>
              </svg>
            `)}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: 0,
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Breadcrumb */}
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
          <Link
            underline="hover"
            color="inherit"
            href="#"
            onClick={() => navigate('/')}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Home sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          <Typography color="text.primary">Testes de Loja</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 900,
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
              background: 'linear-gradient(45deg, #1e293b 30%, #475569 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
              letterSpacing: '-0.02em',
            }}
          >
            TESTES DE LOJA
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              fontSize: { xs: '1rem', sm: '1.25rem' },
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            Selecione o tipo de teste que deseja realizar
          </Typography>
        </Box>

        {/* Cards Grid */}
        <Grid container spacing={{ xs: 3, sm: 4, md: 6 }} justifyContent="center">
          {testesCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                onClick={() => handleCardClick(card.route)}
                sx={{
                  height: '200px',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                    borderColor: 'primary.main',
                  },
                }}
              >
                <CardContent
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: { xs: 2, sm: 3 },
                    textAlign: 'center',
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: card.backgroundColor,
                      width: { xs: 60, sm: 70, md: 80 },
                      height: { xs: 60, sm: 70, md: 80 },
                      mb: 3,
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    {card.icon}
                  </Avatar>

                  <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.5rem' },
                      color: 'text.primary',
                      mb: 1,
                    }}
                  >
                    {card.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.85rem', sm: '0.9rem' },
                      lineHeight: 1.4,
                    }}
                  >
                    {card.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Back Button */}
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Voltar ao Dashboard
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
