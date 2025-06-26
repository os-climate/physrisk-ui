import { Fragment, React } from "react"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarFilterButton, GridToolbarExport, useGridApiRef  } from "@mui/x-data-grid"
import { search } from "../components/Geocoder"

//function getRowId(row) {
//    return row.identifier ? row.identifier : row.id;
//  }

export default function AssetTable(props) {
    const { data, portfolioDispatch, apiKey } = props // updateDataTableRow
    const apiRef = useGridApiRef()

    const handleGeocodeClick = async () => {
        async function geocode() {
            if (data.items.length < 30)
            {
                for (const row of data.items)
                {
                    let query = row.address
                    if (!query || (row.latitude && row.longitude)) continue
                    search("https://api.mapbox.com", "mapbox.places", apiKey, query, 
                    (err, res, searchTime) => {
                        if (!err && res && res.features) {
                            let feature = res.features.find(f => f)
                            let newData = { items: [...data.items] }
                            const rowId = row.id
                            const changedRow = newData.items.find(r => r.id == rowId)
                            changedRow.latitude = feature.center[1]
                            changedRow.longitude = feature.center[0]
                            portfolioDispatch(({ type: "updatePortfolio", portfolioJson: newData }))
                            //apiRef.current.updateRows([{ identifier: rowId, latitude: feature.center[1], longitude: feature.center[0] }])
                        }
                        // place_name for additional check?
                        console.log(err)
                        console.log(res)
                        console.log(searchTime)
                        console.log(portfolioDispatch)
                    }, undefined)
                }
            }
        }
        geocode()        
    }

    function CustomToolbar() {
        return (
          <GridToolbarContainer>
            <GridToolbarColumnsButton />
            <GridToolbarFilterButton />
            {/* <GridToolbarDensitySelector /> */}
            <GridToolbarExport />
            <Button onClick={handleGeocodeClick}>Geocode</Button>
          </GridToolbarContainer>
        );
      }

    const columns = [
        {
            field: "id",
            headerName: "Identifier",
            width: 120,
        },
        {
            field: "asset_class",
            headerName: "Asset class",
            width: 150,
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
        {
            field: "location",
            headerName: "Location",
            width: 90,
        },
        {
            field: "address",
            headerName: "Address",
            width: 170,
        }
    ]

    const rows = (data && data.items) ? data.items.map((row, i) => {
        return row.id ? row : { ...row, id: i }
    }) : []

    return (
        <Fragment>
            <Box sx={{
                    width: "100%"
                }}>
                <DataGrid
                    //getRowId={getRowId}
                    apiRef={apiRef}
                    rows={rows}
                    columns={columns}
                    pageSize={25}
                    density="compact"
                    rowsPerPageOptions={[25, 50, 100]}
                    checkboxSelection
                    disableSelectionOnClick
                    components={{ Toolbar: CustomToolbar }}
                    autoHeight
                />
            </Box>
        </Fragment>
    )
}
