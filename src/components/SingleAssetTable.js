/* eslint-disable */

import { Fragment, React } from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles"
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Title from "./Title";
import { Tooltip } from "@mui/material"; // Toolbar
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat";
import AirIcon from "@mui/icons-material/Air";
import TsunamiIcon from "@mui/icons-material/Tsunami";
import WaterIcon from "@mui/icons-material/Water";
import LightModeIcon from "@mui/icons-material/LightMode";
import GrainIcon from "@mui/icons-material/Grain";
import { trafficLightColour } from "../data/CalculationResult";
//import { colorLevels } from "..utils/color";

export default function SingleAssetTable(props) {
    const {
        title,
        rows,
        hazardMenu
    } = props
    const theme = useTheme()
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
        return <Box sx={{ color: trafficLightColour(params.value), 
            fontStyle: params.value === "No data" ? 'italic': 'normal',
            fontWeight: 'medium'

        }}>{params.value}</Box>
    }

    const scenarios = [
        "ssp126",
        "ssp245",
        "ssp585"
    ]

    const columns = [
        {
            field: "hazard",
            headerName: "Hazard",
            width: 175,
            align: "center",
            headerAlign: "center",
            renderCell: (params) => {
                const tooltipText = "..." // hazardMenu?.hazardDef[params.value]["tooltip"];
                return (
                    <div style={{
                        display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center"
                    }}>
                        {getIcon(params.value)}
                        <div>{params.value}</div>
                        {/* <Tooltip title={tooltipText}>
                            <div><InfoOutlinedIcon /></div>
                        </Tooltip> */}
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
                    marginBottom: "4rem",
                    marginTop: "2rem"
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
                />
            </Box>
        </Fragment>
    )
}
