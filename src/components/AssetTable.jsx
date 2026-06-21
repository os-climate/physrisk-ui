import { Fragment, useContext, useEffect, useState } from "react"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import {
    DataGrid,
    GridToolbarColumnsButton,
    GridToolbarContainer,
    GridToolbarFilterButton,
    useGridApiRef,
} from "@mui/x-data-grid"
import axios from "axios"
import { GlobalDataContext } from "../data/GlobalData"
import { search } from "../components/Geocoder"

//function getRowId(row) {
//    return row.identifier ? row.identifier : row.id;
//  }

export default function AssetTable(props) {
    const { data, portfolioDispatch, apiKey } = props // updateDataTableRow
    const apiRef = useGridApiRef()
    const globals = useContext(GlobalDataContext)
    const [occupancyCodes, setOccupancyCodes] = useState({})

    useEffect(() => {
        async function fetchStaticInfo() {
            try {
                const response = await axios.get(
                    globals.services.apiHost + "/api/get_static_information"
                )
                setOccupancyCodes(response.data.oed_occupancy_codes ?? {})
            } catch {
                // static info unavailable; occupancy codes show raw values
            }
        }
        fetchStaticInfo()
    }, [globals.services.apiHost])

    const handleAddRowClick = () => {
        const items = data.items ?? []
        const maxId = items.reduce((max, item) => {
            const n = parseInt(item.id, 10)
            return isNaN(n) ? max : Math.max(max, n)
        }, 0)
        portfolioDispatch({
            type: "updatePortfolio",
            portfolioJson: { items: [...items, { id: String(maxId + 1) }] },
        })
    }

    const handleExportJson = () => {
        const json = JSON.stringify({ items: data.items ?? [] }, null, 2)
        const blob = new Blob([json], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "portfolio.json"
        a.click()
        URL.revokeObjectURL(url)
    }

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
                <Button onClick={handleAddRowClick}>Add Row</Button>
                <Button onClick={handleExportJson}>Export JSON</Button>
                <Button onClick={handleGeocodeClick}>Geocode</Button>
            </GridToolbarContainer>
        )
    }

    const rows =
        data && data.items
            ? data.items.map((row, i) => ({ ...row, _rowIdx: i }))
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

    const processRowUpdate = (newRow) => {
        const { _rowIdx, ...rowData } = newRow
        const newData = {
            items: data.items.map((item, i) =>
                i === _rowIdx ? { ...item, ...rowData } : item
            ),
        }
        portfolioDispatch({ type: "updatePortfolio", portfolioJson: newData })
        return newRow
    }

    const oedColumns = [
        {
            field: "occupancy_code",
            headerName: "Occupancy code",
            type: "number",
            width: 300,
            editable: true,
            valueParser: (value) =>
                value === "" || value == null ? null : parseInt(value, 10),
            renderCell: ({ value }) => {
                if (
                    value == sentinels.occupancy_code ||
                    value == null ||
                    value === ""
                )
                    return ""
                const label = occupancyCodes[String(value)]
                return label != null ? `${value} (${label})` : value
            },
        },
        {
            field: "construction_code",
            headerName: "Construction code",
            type: "number",
            width: 150,
            editable: true,
            valueParser: (value) =>
                value === "" || value == null ? null : parseInt(value, 10),
            ...blankIfSentinel(sentinels.construction_code),
        },
        {
            field: "number_of_storeys",
            headerName: "Storeys",
            type: "number",
            width: 80,
            editable: true,
            valueParser: (value) =>
                value === "" || value == null ? null : parseInt(value, 10),
            ...blankIfSentinel(sentinels.number_of_storeys),
        },
        {
            field: "first_floor_height",
            headerName: "First floor height (metres)",
            type: "number",
            width: 190,
            editable: true,
        },
        {
            field: "basement",
            headerName: "Basement",
            type: "number",
            width: 90,
            editable: true,
            valueParser: (value) =>
                value === "" || value == null ? null : parseInt(value, 10),
            ...blankIfSentinel(sentinels.basement),
        },
        {
            field: "buffer",
            headerName: "Buffer (metres)",
            type: "number",
            width: 120,
            editable: true,
        },
        {
            field: "wkt_geometry",
            headerName: "WKT geometry",
            width: 180,
            editable: true,
        },
    ]

    const leftColumns = [
        { field: "id", headerName: "Identifier", width: 120 },
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
            editable: true,
        },
        { field: "address", headerName: "Address", width: 170, editable: true },
    ]

    const idColumn = leftColumns.shift()

    const rightColumns = [
        {
            field: "asset_class",
            headerName: "Asset class",
            width: 150,
            editable: true,
        },
        {
            field: "type",
            headerName: "Type",
            width: 150,
            editable: true,
            description: "Hierarchical specification of asset type.",
        },
        {
            field: "location",
            headerName: "Location",
            width: 90,
            editable: true,
        },
    ]

    const [populatedOed, unpopulatedOed] = oedColumns.reduce(
        ([pop, unpop], col) =>
            hasValue(col.field)
                ? [[...pop, col], unpop]
                : [pop, [...unpop, col]],
        [[], []]
    )

    const columns = [
        idColumn,
        ...populatedOed,
        ...leftColumns,
        ...unpopulatedOed,
        ...rightColumns,
    ].map((col) => ({ align: "left", headerAlign: "left", ...col }))

    return (
        <Fragment>
            <Box sx={{ width: "100%", height: 600 }}>
                <DataGrid
                    getRowId={(row) => row._rowIdx}
                    apiRef={apiRef}
                    rows={rows}
                    columns={columns}
                    pageSize={25}
                    density="compact"
                    rowsPerPageOptions={[25, 50, 100]}
                    slots={{ toolbar: CustomToolbar }}
                    processRowUpdate={processRowUpdate}
                    sx={{
                        "& .MuiDataGrid-columnSeparator": {
                            visibility: "visible",
                            color: "rgba(0,0,0,0.2)",
                        },
                        "& .MuiDataGrid-columnSeparator:hover": {
                            color: "rgba(0,0,0,0.6)",
                        },
                    }}
                />
            </Box>
        </Fragment>
    )
}
