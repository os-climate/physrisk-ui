import { useState, Fragment } from 'react';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Title from './Title';
import {v4 as uuidv4} from 'uuid';

function preventDefault(event) {
  event.preventDefault();
}

export default function AssetTable(props) {
  const { data } = props

  return (
    <Fragment>
      <Title>Assets</Title>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Asset</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Longitude</TableCell>
            <TableCell>Latitude</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.items.map((row) => (
            <TableRow key={uuidv4()}>
              <TableCell>{row.asset_class?.toLocaleString('en-US')}</TableCell>
              <TableCell>{row.type?.toLocaleString('en-US')}</TableCell>
              <TableCell>{row.longitude?.toLocaleString('en-US')}</TableCell>
              <TableCell>{row.latitude?.toLocaleString('en-US')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Link color="primary" href="#" onClick={preventDefault} sx={{ mt: 3 }}>
        See more details
      </Link>
    </Fragment>
  );
}
