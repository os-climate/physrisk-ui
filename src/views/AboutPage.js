import { React } from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';

export default function AboutPage() {
  const theme = useTheme();  
  return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={12} lg={12}>
          <Paper
            sx={{
              p: 2,
              bottom: "10px",
              color: theme.palette.text.primary,
              display: "block",
              fontSize: "13px",
              lineHeight: "13px",
            }}
          >
            The OS-Climate Physical Risk app is intended to be a reference UI: a place to test visualizations and receive feedback. 
          </Paper>
        </Grid>
      </Grid>
    );
  }
  