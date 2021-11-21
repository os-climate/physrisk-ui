import * as React from 'react';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Title from './Title';

function createData(id, name, longitude, latitude, property1, property2) {
  return { id, name, longitude, latitude, property1, property2 };
}

const rows = [
  createData(
    0,
    'Asset 1',
    12.4,
    14.9,
    'Power plant',
    123000000,
  ),
  createData(
    1,
    'Asset 2',
    54.3,
    6.7,
    'Power plant',
    456000000,
  ),
];

function preventDefault(event) {
  event.preventDefault();
}

export default function AssetTable() {
  return (
    <React.Fragment>
      <Title>Recent Orders</Title>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Longitude</TableCell>
            <TableCell>Latitude</TableCell>
            <TableCell>Property 1</TableCell>
            <TableCell align="right">Property 2</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.longitude}</TableCell>
              <TableCell>{row.latitude}</TableCell>
              <TableCell>{row.property1}</TableCell>
              <TableCell align="right">{`\u20AC${row.property2.toLocaleString('en-US')}`}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Link color="primary" href="#" onClick={preventDefault} sx={{ mt: 3 }}>
        See more details
      </Link>
    </React.Fragment>
  );
}
