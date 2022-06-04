import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';
import AssetTable from '../components/AssetTable';

export default function AssetViewer() {
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
          Asset viewer goes here.   
        </Paper>
      </Grid>
      {/* Asset table */}
      <Grid item xs={12} md={12} lg={12}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
          <AssetTable/>
        </Paper>
      </Grid>
    </Grid>
    );
  }
