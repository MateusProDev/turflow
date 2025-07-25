import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log do erro para debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="60vh"
          p={3}
        >
          <Paper
            elevation={3}
            style={{
              padding: '2rem',
              textAlign: 'center',
              maxWidth: '500px',
              width: '100%'
            }}
          >
            <ErrorOutline
              style={{
                fontSize: '4rem',
                color: '#f44336',
                marginBottom: '1rem'
              }}
            />
            
            <Typography variant="h5" gutterBottom color="error">
              Ops! Algo deu errado
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              {this.props.fallbackMessage || 
               "Ocorreu um erro inesperado. Tente recarregar a página."}
            </Typography>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box
                mt={2}
                p={2}
                bgcolor="grey.100"
                borderRadius={1}
                textAlign="left"
              >
                <Typography variant="caption" component="pre" style={{ whiteSpace: 'pre-wrap' }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </Typography>
              </Box>
            )}
            
            <Box mt={3} display="flex" gap={2} justifyContent="center">
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={() => window.location.reload()}
                color="primary"
              >
                Recarregar Página
              </Button>
              
              {this.props.onRetry && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    this.setState({ hasError: false, error: null, errorInfo: null });
                    this.props.onRetry();
                  }}
                >
                  Tentar Novamente
                </Button>
              )}
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
