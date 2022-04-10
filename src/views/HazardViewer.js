import { useState } from 'react';
import Chart from '../components/Chart';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import ScatterMap from '../components/ScatterMap';
import Summary from '../components/Summary';
import AssetTable from '../components/AssetTable';

export default function HazardViewer() {
  
  const [, setLng] = useState(0);
  
  const handleClick = (e) => {
    setLng(e.lngLat.lng)
  };
  
  return (
        <Grid container spacing={3}>
        {/* Map */}
        <Grid item xs={12} md={12} lg={12}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <ScatterMap onClick={handleClick} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={8} lg={9}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 240,
            }}
          >
            <Chart />
          </Paper>
        </Grid>
        {/* Summary */}
        <Grid item xs={12} md={4} lg={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 240,
            }}
          >
            <Summary />
          </Paper>
        </Grid>
        {/* Asset table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <AssetTable />
          </Paper>
        </Grid>
      </Grid>
    );
  }
  
