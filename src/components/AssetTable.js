import { Fragment, React } from 'react';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Title from './Title';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';


function preventDefault(event) {
  event.preventDefault();
}

export default function AssetTable(props) {
  const { data } = props

  const columns = [
    {
      field: 'asset_class',
      headerName: 'Asset class',
      width: 170,
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 150,
      description: 'Hierarchical specification of asset type.',
    },
    {
      field: 'latitude',
      headerName: 'Latitude',
      type: 'number',
      width: 110,
      editable: true,
    },
    {
      field: 'longitude',
      headerName: 'Longitude',
      type: 'number',
      width: 110,
    },
  ];
  
  const rows = data.items.map((row, i) => { return { ...row, id: i} })

  return (
    <Fragment>
      <Title>Assets</Title>
      <Box sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={100}
          rowsPerPageOptions={[100]}
          checkboxSelection
          disableSelectionOnClick
          components={{ Toolbar: GridToolbar }}
        />
      </Box>
      <Link color="primary" href="#" onClick={preventDefault} sx={{ mt: 3 }}>
        See more details
      </Link>
    </Fragment>
  );
}
