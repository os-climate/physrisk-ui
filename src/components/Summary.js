import * as React from 'react';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Title from './Title';
import { Box } from '@mui/material';

function preventDefault(event) {
  event.preventDefault();
}

export default function Summary(props) {
  const { modelName, modelDescription } = props
  return (
    <React.Fragment>
      <Title>Hazard model</Title>
      <Typography component="p" variant="h6">
        {modelName}
      </Typography>
      <Typography color="text.secondary" sx={{ flex: 1, overflow: "auto" }}>
        {modelDescription}
      </Typography>
      <Box sx={{ mt: 1 }}>
        <Link color="primary" href="#" onClick={preventDefault}>
          View more details
        </Link>
      </Box>
    </React.Fragment>
  );
}
