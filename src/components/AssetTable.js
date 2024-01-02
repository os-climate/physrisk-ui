import { Fragment, React } from "react"
import Box from "@mui/material/Box"
import { DataGrid, GridToolbar } from "@mui/x-data-grid"


export default function AssetTable(props) {
    const { data } = props

    const columns = [
        {
            field: "asset_class",
            headerName: "Asset class",
            width: 170,
        },
        {
            field: "type",
            headerName: "Type",
            width: 150,
            description: "Hierarchical specification of asset type.",
        },
        {
            field: "latitude",
            headerName: "Latitude",
            type: "number",
            width: 110,
            editable: true,
        },
        {
            field: "longitude",
            headerName: "Longitude",
            type: "number",
            width: 110,
        },
    ]

    const rows = (data && data.items) ? data.items.map((row, i) => {
        return { ...row, id: i }
    }) : []

    return (
        <Fragment>
            <Box sx={{
                    width: "100%"
                }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    pageSize={25}
                    density="compact"
                    rowsPerPageOptions={[25, 50, 100]}
                    checkboxSelection
                    disableSelectionOnClick
                    components={{ Toolbar: GridToolbar }}
                    autoHeight
                />
            </Box>
        </Fragment>
    )
}
