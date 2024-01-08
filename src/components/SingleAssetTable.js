import { Fragment, useEffect, useState, React } from "react";
import { useTheme } from "@mui/material/styles"
import Box from "@mui/material/Box";
import { DataGrid } from "@mui/x-data-grid";
import Title from "./Title";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat";
import AirIcon from "@mui/icons-material/Air";
import TsunamiIcon from "@mui/icons-material/Tsunami";
import WaterIcon from "@mui/icons-material/Water";
import LightModeIcon from "@mui/icons-material/LightMode";
import GrainIcon from "@mui/icons-material/Grain";
import { scoreTextToNumber } from "../data/CalculationResult";
import Typography from "@mui/material/Typography";

export default function SingleAssetTable(props) {
    const {
        title,
        rows,
        hazardType,
        setHazardType,
        scenarioId,
        setScenarioId
    } = props
    const [details, setDetails] = useState(null)
    const theme = useTheme()

    useEffect(() => {
        if (!rows) {
            setDetails(null)
            return
        }
        let selectedRow = rows.find(r => r.hazard == hazardType)
        setDetails(selectedRow.details[scenarioId])
    }, [rows, hazardType, scenarioId])

    if (!rows){
        return (
            <Fragment></Fragment>
    )}
    const getIcon = (value) => {
        if (value == "Wildfire") {
            return <LocalFireDepartmentIcon /> }
        else if (value == "Heat") {
            return <DeviceThermostatIcon /> }
        else if (value == "Riverine Flood") {
            return <WaterIcon /> }
        else if (value == "Coastal Flood") {
            return <TsunamiIcon /> }
        else if (value == "Drought") {
            return <LightModeIcon /> }
        else if (value == "Wind") {
            return <AirIcon/> }
        else if (value == "Hail") {
            return <GrainIcon/>
        }
        else { return <AirIcon/> }
    }

    const renderScoreCell = params => {
        return <Box sx={{ color: theme.scores[scoreTextToNumber(params.value)], 
            fontStyle: params.value === "No data" ? 'italic': 'normal',
            fontWeight: 'medium'

        }}>{params.value}</Box>
    }

    const scenarios = [
        "ssp126",
        "ssp245",
        "ssp585"
    ]

    const handleCellClicked = (params) =>
    {
        setHazardType(params.id)
        if (params.colDef.field != "hazard") setScenarioId(params.colDef.field)
    } 

    const columns = [
        {
            field: "hazard",
            headerName: "Hazard",
            width: 175,
            align: "center",
            headerAlign: "center",
            renderCell: (params) => {
                return (
                    <div style={{
                        display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center"
                    }}>
                        {getIcon(params.value)}
                        <div>{params.value}</div>
                    </div>
                )
            }
        },
        ...scenarios.map(scen => ({
            field: scen,
            headerName: scen.toUpperCase(),
            width: 100,
            align: "center",
            headerAlign: "center",
            renderCell: renderScoreCell
        }))
    ]

    return (
        <Fragment>
            <Box
                sx={{
                    width: "100%",
                    mt: 1,
                    mb: 2
                }}>
                <Title>{title}</Title>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    pageSize={100}
                    density="compact"
                    rowsPerPageOptions={[100]}
                    disableSelectionOnClick
                    autoHeight
                    hideFooter
                    onCellClick={handleCellClicked}
                />
                {details ?
                <Fragment>
                    <Typography sx={{ mt: 1 }} variant="body2">
                        {`For hazard type '${hazardType}' and ${scenarioId.toUpperCase()} scenario the impact is '${details?.valueText}'. `}
                        {details?.label}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, fontStyle: "italic" }}>
                        {details?.description}
                    </Typography>
                </Fragment>
                : <></>}
            </Box>
        </Fragment>
    )
}
