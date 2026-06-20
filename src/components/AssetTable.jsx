import { Fragment, React } from "react"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import {
    DataGrid,
    GridToolbarColumnsButton,
    GridToolbarContainer,
    GridToolbarFilterButton,
    GridToolbarExport,
    useGridApiRef,
} from "@mui/x-data-grid"
import { search } from "../components/Geocoder"

//function getRowId(row) {
//    return row.identifier ? row.identifier : row.id;
//  }

export default function AssetTable(props) {
    const { data, portfolioDispatch, apiKey } = props // updateDataTableRow
    const apiRef = useGridApiRef()

    const handleGeocodeClick = async () => {
        async function geocode() {
            if (data.items.length < 30) {
                for (const row of data.items) {
                    let query = row.address
                    if (!query || (row.latitude && row.longitude)) continue
                    search(
                        "https://api.mapbox.com",
                        "mapbox.places",
                        apiKey,
                        query,
                        (err, res, searchTime) => {
                            if (!err && res && res.features) {
                                let feature = res.features.find((f) => f)
                                let newData = { items: [...data.items] }
                                const rowId = row.id
                                const changedRow = newData.items.find(
                                    (r) => r.id == rowId
                                )
                                changedRow.latitude = feature.center[1]
                                changedRow.longitude = feature.center[0]
                                portfolioDispatch({
                                    type: "updatePortfolio",
                                    portfolioJson: newData,
                                })
                                //apiRef.current.updateRows([{ identifier: rowId, latitude: feature.center[1], longitude: feature.center[0] }])
                            }
                            // place_name for additional check?
                            console.log(err)
                            console.log(res)
                            console.log(searchTime)
                            console.log(portfolioDispatch)
                        },
                        undefined
                    )
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
        )
    }

    const rows =
        data && data.items
            ? data.items.map((row, i) => (row.id ? row : { ...row, id: i }))
            : []

    // Sentinel values that mean "unknown" — cells with these are shown blank
    const sentinels = {
        occupancy_code: 1000,
        construction_code: 5000,
        number_of_storeys: -1,
        basement: 0,
    }

    const hasValue = (field) => {
        const sentinel = sentinels[field]
        return rows.some((r) => {
            const v = r[field]
            return v != null && v !== "" && v != sentinel
        })
    }

    const blankIfSentinel = (sentinel) => ({
        renderCell: ({ value }) => (value == sentinel ? "" : value ?? ""),
    })

    const oedColumns = [
        { field: "occupancy_code", headerName: "Occupancy code", width: 140, ...blankIfSentinel(sentinels.occupancy_code) },
        { field: "construction_code", headerName: "Construction code", width: 150, ...blankIfSentinel(sentinels.construction_code) },
        { field: "number_of_storeys", headerName: "Storeys", type: "number", width: 80, ...blankIfSentinel(sentinels.number_of_storeys) },
        { field: "first_floor_height", headerName: "First floor height (metres)", type: "number", width: 190 },
        { field: "basement", headerName: "Basement", width: 90, ...blankIfSentinel(sentinels.basement) },
        { field: "buffer", headerName: "Buffer (metres)", type: "number", width: 120 },
        { field: "wkt_geometry", headerName: "WKT geometry", width: 180 },
    ]

    const leftColumns = [
        { field: "id", headerName: "Identifier", width: 120 },
        { field: "latitude", headerName: "Latitude", type: "number", width: 110, editable: true },
        { field: "longitude", headerName: "Longitude", type: "number", width: 110 },
        { field: "address", headerName: "Address", width: 170 },
    ]

    const rightColumns = [
        { field: "asset_class", headerName: "Asset class", width: 150 },
        { field: "type", headerName: "Type", width: 150, description: "Hierarchical specification of asset type." },
        { field: "location", headerName: "Location", width: 90 },
    ]

    const [populatedOed, unpopulatedOed] = oedColumns.reduce(
        ([pop, unpop], col) =>
            hasValue(col.field)
                ? [[...pop, col], unpop]
                : [pop, [...unpop, col]],
        [[], []]
    )

    const columns = [...populatedOed, ...leftColumns, ...unpopulatedOed, ...rightColumns]

    return (
        <Fragment>
            <Box
                sx={{
                    width: "100%",
                }}
            >
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
