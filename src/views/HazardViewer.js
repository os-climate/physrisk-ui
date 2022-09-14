import { useEffect, useReducer, useState, React } from "react"
import Chart from "../components/Chart"
import ChronicHazard from "../components/ChronicHazard"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import ScatterMap from "../components/ScatterMap"
import Summary from "../components/Summary"
import {
    hazardMenuReducer,
    hazardMenuInitialiser,
    loadHazardMenuData,
} from "../data/HazardInventory.js"
import { v4 as uuidv4 } from "uuid"
import axios from "axios"

export default function HazardViewer(props) {
    const { visible } = props

    const hazardMenuInitialState = hazardMenuInitialiser()

    // holds both the inventory of available hazard data and the menu state
    const [hazardMenu, hazardMenuUpdate] = useReducer(
        hazardMenuReducer,
        hazardMenuInitialState
    )

    const [graphData, setGraphData] = useState(null)
    const [lngLat, setLngLat] = useState(null)
    const apiHost =
        "http://physrisk-api-sandbox.apps.odh-cl1.apps.os-climate.org"

    //const apiHost = 'http://127.0.0.1:5000';
    function graphDataPoint(x, y) {
        return { x, y }
    }

    const handleClick = async (e) => {
        setLngLat(e.lngLat)
    }

    useEffect(() => {
        async function fetchHazardMenuData() {
            const hazardMenuData = await loadHazardMenuData()
            hazardMenuUpdate({ type: "initialise", payload: hazardMenuData })
        }
        fetchHazardMenuData()
    }, [])

    useEffect(() => {
        async function fetchGraphData() {
            if (hazardMenu.inventory) {
                if (lngLat) {
                    var payload = {
                        items: [
                            {
                                request_item_id: uuidv4(),
                                event_type: hazardMenu.selectedHazardTypeId,
                                longitudes: [lngLat.lng],
                                latitudes: [lngLat.lat],
                                year: hazardMenu.selectedYear,
                                scenario: hazardMenu.selectedScenario.id,
                                model: hazardMenu.selectedModel.id,
                            },
                        ],
                    }
                    var response = await axios.post(
                        apiHost + "/api/get_hazard_data",
                        payload
                    )
                    var curve_set =
                        response.data.items[0].intensity_curve_set[0]
                    var points =
                        curve_set.intensities.length == 1
                            ? [graphDataPoint(0, curve_set.intensities[0])]
                            : curve_set.return_periods.map((item, i) =>
                                  graphDataPoint(
                                      1.0 / item,
                                      curve_set.intensities[i]
                                  )
                              )

                    setGraphData(points)
                }
            }
        }
        fetchGraphData()
    }, [hazardMenu, lngLat])

    var chart
    if (graphData) {
        var title = hazardMenu.menuOptions
            ? hazardMenu.menuOptions[1][hazardMenu.selectedIndices[1]] +
              (lngLat
                  ? " @ (" +
                    lngLat.lng.toFixed(4) +
                    "\u00b0, " +
                    lngLat.lat.toFixed(4) +
                    "\u00b0)"
                  : "")
            : ""
        if (graphData.length > 1) {
            chart = <Chart title={title} data={graphData} />
        } else {
            chart = (
                <ChronicHazard
                    title={title}
                    data={graphData}
                    units={hazardMenu.selectedModel.units}
                />
            )
        }
    } else chart = <div></div>

    return (
        <Grid container spacing={3}>
            {/* Map */}
            <Grid item xs={12} md={12} lg={12}>
                <Paper
                    sx={{
                        p: 2,
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <ScatterMap
                        hazardMenu={hazardMenu}
                        hazardMenuUpdate={hazardMenuUpdate}
                        onClick={handleClick}
                        visible={visible}
                    />
                </Paper>
            </Grid>
            <Grid item xs={12} md={8} lg={9}>
                <Paper
                    sx={{
                        p: 2,
                        display: "flex",
                        flexDirection: "column",
                        height: 240,
                    }}
                >
                    {chart}
                </Paper>
            </Grid>
            {/* Summary */}
            <Grid item xs={12} md={4} lg={3}>
                <Paper
                    sx={{
                        p: 2,
                        display: "flex",
                        flexDirection: "column",
                        height: 240,
                    }}
                >
                    <Summary
                        modelName={
                            hazardMenu.menuOptions
                                ? hazardMenu.menuOptions[1][
                                      hazardMenu.selectedIndices[1]
                                  ]
                                : ""
                        }
                        modelDescription={
                            hazardMenu?.selectedModel?.description
                        }
                    />
                </Paper>
            </Grid>
        </Grid>
    )
}
