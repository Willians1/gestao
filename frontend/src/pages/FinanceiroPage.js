import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  IconButton,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import {
  Assignment,
  AttachMoney,
  Store,
  CalendarMonth,
  Inventory,
  ArrowBack,
  Home,
} from '@mui/icons-material';

export default function FinanceiroPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const financeiroCards = [
    {
      title: 'Contratos',
      icon: <Assignment sx={{ fontSize: 35, color: '#fff' }} />,
      backgroundColor: '#5C6BC0', // Azul
      route: '/contratos',
      description: 'Gestão de Contratos',
    },
    {
      title: 'Despesas',
      icon: <AttachMoney sx={{ fontSize: 35, color: '#fff' }} />,
      backgroundColor: '#EF5350', // Vermelho
      route: '/despesas',
      description: 'Controle de Despesas',
    },
    {
      title: 'Fornecedores',
      icon: <Store sx={{ fontSize: 35, color: '#fff' }} />,
      backgroundColor: '#26A69A', // Verde
      route: '/fornecedores',
      description: 'Cadastro de Fornecedores',
    },
    {
      title: 'Resumo Mensal',
      icon: <CalendarMonth sx={{ fontSize: 35, color: '#fff' }} />,
      backgroundColor: '#FF7043', // Laranja
      route: '/resumo-mensal',
      description: 'Relatórios Mensais',
    },
    {
      title: 'Valor Materiais',
      icon: <Inventory sx={{ fontSize: 35, color: '#fff' }} />,
      backgroundColor: '#AB47BC', // Roxo
      route: '/valor-materiais',
      description: 'Preços de Materiais',
    },
  ];

  const handleCardClick = (route) => {
    navigate(route);
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #26A69A 0%, #4DB6AC 100%)',
        minHeight: '100vh',
        p: { xs: 2, sm: 3, md: 4 },
      }}
    >
      {/* Header com navegação */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton
            onClick={handleBack}
            sx={{
              color: '#fff',
              mr: 1,
              backgroundColor: 'rgba(255,255,255,0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)',
              },
            }}
          >
            <ArrowBack />
          </IconButton>

          <Breadcrumbs
            sx={{
              '& .MuiBreadcrumbs-separator': { color: '#fff' },
              flexGrow: 1,
            }}
          >
            <Link
              onClick={handleBack}
              sx={{
                color: '#fff',
                opacity: 0.8,
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                '&:hover': { opacity: 1 },
              }}
            >
              <Home sx={{ mr: 0.5, fontSize: 18 }} />
              Dashboard
            </Link>
            <Typography sx={{ color: '#fff', fontWeight: 600 }}>Financeiro</Typography>
          </Breadcrumbs>
        </Box>

        <Box sx={{ textAlign: 'center', color: '#fff' }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 1,
              fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
            }}
          >
            Gestão Financeira
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              opacity: 0.9,
              fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
            }}
          >
            Selecione uma opção para gerenciar
          </Typography>
        </Box>
      </Box>

      {/* Cards Grid */}
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Grid container spacing={3} sx={{ flexDirection: { xs: 'column', sm: 'row' } }}>
          {financeiroCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                onClick={() => handleCardClick(card.route)}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: 'scale(1)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: '0 12px 35px rgba(0,0,0,0.2)',
                  },
                  '&:active': {
                    transform: 'scale(0.98)',
                  },
                  borderRadius: 4,
                  overflow: 'hidden',
                  background: theme.palette.background.paper,
                  border: 'none',
                  minHeight: { xs: 140, sm: 160 },
                }}
              >
                <CardContent
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    p: { xs: 2, sm: 3 },
                    height: '100%',
                    justifyContent: 'center',
                  }}
                >
                  {/* Ícone */}
                  <Avatar
                    sx={{
                      width: { xs: 50, sm: 60 },
                      height: { xs: 50, sm: 60 },
                      backgroundColor: card.backgroundColor,
                      mb: 2,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    }}
                  >
                    {card.icon}
                  </Avatar>

                  {/* Título */}
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      mb: 0.5,
                      lineHeight: 1.2,
                    }}
                  >
                    {card.title}
                  </Typography>

                  {/* Descrição (multiline clamp 2 linhas, centralizada) */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: { xs: '0.72rem', sm: '0.75rem' },
                      mt: 0.5,
                      textAlign: 'center',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                    title={card.description}
                  >
                    {card.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Footer */}
      <Box sx={{ textAlign: 'center', mt: 6 }}>
        <Button
          onClick={handleBack}
          variant="outlined"
          sx={{
            color: '#fff',
            borderColor: 'rgba(255,255,255,0.5)',
            fontSize: '0.9rem',
            textTransform: 'none',
            '&:hover': {
              borderColor: '#fff',
              backgroundColor: 'rgba(255,255,255,0.1)',
            },
          }}
        >
          Voltar ao Dashboard
        </Button>
      </Box>
    </Box>
  );
}
