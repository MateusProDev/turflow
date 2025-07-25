import React, { memo } from "react";
import { CircularProgress, Box, Typography } from '@mui/material';

const Spinner = memo(({ 
  height = "70vh",
  size = 40, 
  message = "Carregando...", 
  showMessage = true,
  color = "primary" 
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      height={height}
      gap={2}
      style={{
        position: 'relative',
        zIndex: 1
      }}
    >
      <CircularProgress 
        size={size} 
        color={color}
        thickness={4}
      />
      {showMessage && (
        <Typography 
          variant="body2" 
          color="text.secondary"
          style={{ 
            fontSize: '14px',
            fontWeight: 500,
            textAlign: 'center'
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
});

Spinner.displayName = 'Spinner';

export default Spinner;
