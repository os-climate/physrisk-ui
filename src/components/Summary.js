import * as React from 'react';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Title from './Title';

function preventDefault(event) {
  event.preventDefault();
}

export default function Summary() {
  var text = "Asset info here"
  return (
    <React.Fragment>
      <Title>Asset Name</Title>
      <Typography component="p" variant="h6">
        {text}
      </Typography>
      <Typography color="text.secondary" sx={{ flex: 1 }}>
        Some details
      </Typography>
      <div>
        <Link color="primary" href="#" onClick={preventDefault}>
          View more details
        </Link>
      </div>
    </React.Fragment>
  );
}
