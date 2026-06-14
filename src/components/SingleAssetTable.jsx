import { Fragment, React } from "react"
import { useTheme } from "@mui/material/styles"
import Box from "@mui/material/Box"
import { DataGrid } from "@mui/x-data-grid"
import Title from "./Title"
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment"
import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat"
import AirIcon from "@mui/icons-material/Air"
import TsunamiIcon from "@mui/icons-material/Tsunami"
import WaterIcon from "@mui/icons-material/Water"
import WaterDropIcon from "@mui/icons-material/WaterDrop"
import LightModeIcon from "@mui/icons-material/LightMode"
import GrainIcon from "@mui/icons-material/Grain"
import { scoreTextToNumber } from "../data/CalculationResult"

export default function SingleAssetTable(props) {
    const { title, rows, setHazardType, setScenarioId } = props
    const theme = useTheme()

    if (!rows) {
        return <Fragment></Fragment>
    }
    const getIcon = (value) => {
        if (value == "Wildfire") {
            return <LocalFireDepartmentIcon />
        } else if (value == "Heat") {
            return <DeviceThermostatIcon />
        } else if (value == "Riverine Flood") {
            return <WaterIcon />
        } else if (value == "Coastal Flood") {
            return <TsunamiIcon />
        } else if (value == "Pluvial Flood") {
            return <WaterDropIcon />
        } else if (value == "Drought") {
            return <LightModeIcon />
        } else if (value == "Wind") {
            return <AirIcon />
        } else if (value == "Hail") {
            return <GrainIcon />
        } else {
            return <AirIcon />
        }
    }

    const scoreCircleTextColor = (score) =>
        score === 0 || score === 4 ? "#ffffff" : "#212121"

    const renderScoreCell = (params) => {
        if (params.value === "No data") {
            return (
                <Box sx={{ color: theme.scores[-1], fontStyle: "italic" }}>
                    —
                </Box>
            )
        }
        const score = scoreTextToNumber(params.value)
        const bg = theme.scores[score] ?? theme.scores[-1]
        return (
            <Box
                sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    backgroundColor: bg,
                    border: "1.5px solid rgba(0,0,0,0.22)",
                    color: scoreCircleTextColor(score),
                    fontWeight: "bold",
                    fontSize: 13,
                }}
            >
                {params.value}
            </Box>
        )
    }

    const scenarios = ["ssp126", "ssp245", "ssp585"]

    const handleCellClicked = (params) => {
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
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                            alignItems: "center",
                        }}
                    >
                        {getIcon(params.value)}
                        <div>{params.value}</div>
                    </div>
                )
            },
        },
        ...scenarios.map((scen) => ({
            field: scen,
            headerName: scen.toUpperCase(),
            width: 100,
            align: "center",
            headerAlign: "center",
            renderCell: renderScoreCell,
        })),
    ]

    return (
        <Fragment>
            <Box
                sx={{
                    width: "100%",
                    mt: 1,
                    mb: 2,
                }}
            >
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
            </Box>
        </Fragment>
    )
}
