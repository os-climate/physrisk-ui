import React, { useContext, useEffect, useReducer, useState } from "react"
import Box from "@mui/material/Box"
import LinearProgress from "@mui/material/LinearProgress"
import {
    ExceedancePlot,
    ScenarioTimeSeriesPlot,
    ThresholdPlot,
} from "../components/Chart"
import Link from "@mui/material/Link"
import Paper from "@mui/material/Paper"
import { ScatterMap } from "../components/ScatterMap"
import Summary from "../components/Summary"
import Title from "../components/Title"
import {
    hazardMenuReducer,
    hazardMenuInitialiser,
    loadHazardMenuData,
    prettifyScenarioId,
} from "../data/HazardInventory.js"
import { indexValueCaption } from "../data/HazardIndexValues"
import {
    curvesByRequestItemId,
    defaultScenarioIds,
    hasNumericCurves,
    isShownByDefault,
    scenarioTimeSeries,
    scenarioYearCurves,
    timeSeriesRequestItems,
} from "../data/HazardTimeSeries"
import { lighten, useTheme } from "@mui/material/styles"
import ToggleButton from "@mui/material/ToggleButton"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import { v4 as uuidv4 } from "uuid"
import axios from "axios"
import { GlobalDataContext } from "../data/GlobalData"
import { Typography } from "@mui/material"

const formatIndicatorValue = (value) =>
    Number.isInteger(value) ? value.toString() : value.toPrecision(5)

export default function HazardViewer(props) {
    const { visible } = props

    const hazardMenuInitialState = hazardMenuInitialiser()

    // holds both the inventory of available hazard data and the menu state
    const [hazardMenu1, hazardMenuDispatch1] = useReducer(
        hazardMenuReducer,
        hazardMenuInitialState
    )

    const [graphType, setGraphType] = useState("returnPeriod")
    const theme = useTheme()
    const [lngLat, setLngLat] = useState(null)
    const globals = useContext(GlobalDataContext)
    const apiHost = globals.services.apiHost
    function graphDataPoint(x, y) {
        return { x, y }
    }

    const handleClick = async (e) => {
        setLngLat(e.lngLat)
    }

    useEffect(() => {
        async function fetchHazardMenuData() {
            const hazardMenuData = await loadHazardMenuData(globals)
            hazardMenuDispatch1({ type: "initialise", payload: hazardMenuData })
        }
        fetchHazardMenuData()
    }, [globals])

    const hazardPointInitialState = {
        status: "idle",
        error: null,
        indexName: null, // 'return period' or 'threshold'
        data: [],
    }

    const [hazardPointState, hazardPointDispatch] = useReducer(
        (state, action) => {
            switch (action.type) {
                case "FETCHING":
                    return { ...hazardPointInitialState, status: "fetching" }
                case "FETCHED":
                    return {
                        ...hazardPointInitialState,
                        status: "fetched",
                        data: action.payload.data,
                        indexName: action.payload.indexName,
                    }
                case "FETCH_ERROR":
                    return {
                        ...hazardPointInitialState,
                        status: "error",
                        error: action.payload,
                    }
                default:
                    return state
            }
        },
        hazardPointInitialState
    )

    useEffect(() => {
        async function fetchGraphData() {
            if (hazardMenu1.inventory) {
                if (lngLat) {
                    hazardPointDispatch({ type: "FETCHING" })
                    var payload = {
                        items: [
                            {
                                request_item_id: uuidv4(),
                                event_type: hazardMenu1.selectedHazardTypeId,
                                longitudes: [lngLat.lng],
                                latitudes: [lngLat.lat],
                                year: hazardMenu1.selectedYear,
                                scenario: hazardMenu1.selectedScenario.id,
                                indicator_id:
                                    hazardMenu1.selectedModel.indicator_id,
                                path: hazardMenu1.selectedModel.path,
                            },
                        ],
                        interpolation: "max",
                        provider_max_requests: { jba: 20 },
                    }
                    try {
                        const config = {
                            headers: {
                                Authorization: "Bearer " + globals.token,
                            },
                        }
                        var response = await axios.post(
                            apiHost + "/api/get_hazard_data",
                            payload,
                            globals.token == "" ? null : config
                        )
                        response.access_token &&
                            globals.setToken(response.access_token)
                        var curve_set =
                            response.data.items[0].intensity_curve_set[0]
                        var points =
                            curve_set.intensities.length <= 1
                                ? [graphDataPoint(0, curve_set.intensities[0])]
                                : curve_set.index_values.map((item, i) =>
                                      graphDataPoint(
                                          item,
                                          curve_set.intensities[i]
                                      )
                                  )
                        if (curve_set.index_name == "return period")
                            points = points.reverse()
                        hazardPointDispatch({
                            type: "FETCHED",
                            payload: {
                                data: points,
                                indexName: curve_set.index_name,
                            },
                        })
                    } catch (error) {
                        hazardPointDispatch({
                            type: "FETCH_ERROR",
                            payload: error.message,
                        })
                    }
                }
            }
        }
        fetchGraphData()
    }, [hazardMenu1, lngLat])

    // indicator values for all scenarios and years, fetched only when shown
    const [chartView, setChartView] = useState("selected")
    const [indexValues, setIndexValues] = useState(null)
    const [timeSeriesState, setTimeSeriesState] = useState({
        status: "idle",
        curves: {},
    })
    const selectedPath = hazardMenu1.selectedModel?.path
    useEffect(() => {
        if (chartView != "overTime" || !lngLat || !selectedPath) return
        let cancelled = false
        async function fetchTimeSeries() {
            setTimeSeriesState({ status: "fetching", curves: {} })
            const payload = {
                items: timeSeriesRequestItems(
                    hazardMenu1.selectedHazardTypeId,
                    hazardMenu1.selectedModel,
                    lngLat
                ),
                interpolation: "max",
                provider_max_requests: { jba: 20 },
            }
            try {
                const config = {
                    headers: { Authorization: "Bearer " + globals.token },
                }
                const response = await axios.post(
                    apiHost + "/api/get_hazard_data",
                    payload,
                    globals.token == "" ? null : config
                )
                if (cancelled) return
                setTimeSeriesState({
                    status: "fetched",
                    curves: curvesByRequestItemId(response.data.items),
                })
            } catch (error) {
                if (!cancelled)
                    setTimeSeriesState({ status: "error", curves: {} })
            }
        }
        fetchTimeSeries()
        return () => {
            cancelled = true
        }
    }, [chartView, lngLat, selectedPath])

    // index value (e.g. return period) shown on the map, marked on the curves
    const mapIndexValue =
        indexValues?.status == "fetched" &&
        indexValues.allIndexValues?.length > 1
            ? indexValues.indexSelectedValue
            : null

    var chart
    var title = hazardMenu1.selectedModel
        ? hazardMenu1.selectedModel.display_name
        : ""
    if (hazardPointState.data && hazardPointState.data.length > 0) {
        if (
            hazardPointState.data.length > 1 &&
            typeof hazardPointState.data[0].x != "string"
        ) {
            chart = (
                <div>
                    <div>
                        {lngLat ? (
                            <div>
                                <Typography>
                                    <Link
                                        onClick={() => {
                                            setGraphType(
                                                graphType == "returnPeriod"
                                                    ? "exceedance"
                                                    : "returnPeriod"
                                            )
                                        }}
                                    >
                                        {graphType == "returnPeriod"
                                            ? "Return period curve"
                                            : "Exceedance curve"}
                                    </Link>
                                    {" for pinned location (lat, lon) " +
                                        lngLat.lat.toFixed(4) +
                                        "\u00b0, " +
                                        lngLat.lng.toFixed(4) +
                                        "\u00b0:"}
                                </Typography>
                            </div>
                        ) : (
                            <div></div>
                        )}
                    </div>
                    <Typography></Typography>
                    <Box
                        sx={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "center",
                            flexDirection: "row",
                        }}
                    >
                        <Box sx={{ width: "90%", maxWidth: 900 }}>
                            {hazardPointState.indexName == "return period" ? (
                                <ExceedancePlot
                                    data={hazardPointState.data}
                                    quantity={
                                        hazardMenu1.selectedModel.indicator_id
                                    }
                                    units={hazardMenu1.selectedModel.units}
                                    graphType={graphType}
                                    mapIndexValue={mapIndexValue}
                                />
                            ) : (
                                <ThresholdPlot
                                    data={hazardPointState.data}
                                    quantity={
                                        hazardMenu1.selectedModel.indicator_id
                                    }
                                    units={hazardMenu1.selectedModel.units}
                                    graphType={graphType}
                                    mapIndexValue={mapIndexValue}
                                />
                            )}
                        </Box>
                    </Box>
                </div>
            )
        } else {
            chart = (
                <Typography>
                    {(lngLat
                        ? "For pinned location (lat, lon) " +
                          lngLat.lat.toFixed(4) +
                          "\u00b0, " +
                          lngLat.lng.toFixed(4) +
                          "\u00b0, indicator "
                        : "Indicator ") +
                        "value is " +
                        (hazardPointState.data.length == 1
                            ? hazardPointState.data[0].y != null
                                ? formatIndicatorValue(
                                      hazardPointState.data[0].y
                                  )
                                : "none"
                            : hazardPointState.data
                                  .map(
                                      (d) =>
                                          d.x + ": " + formatIndicatorValue(d.y)
                                  )
                                  .join(", ")) +
                        (hazardMenu1.selectedModel.units &&
                        hazardMenu1.selectedModel.units != "none"
                            ? " " + hazardMenu1.selectedModel.units + "."
                            : ".")}
                </Typography>
            )
        }
    } else if (hazardPointState.status === "error") {
        chart = (
            <Typography color="error">
                Could not retrieve indicator values for the pinned location.
            </Typography>
        )
    } else chart = <div></div>

    const model = hazardMenu1.selectedModel
    const hasTimeSeries =
        model && model.scenarios.flatMap((s) => s.years).length > 1
    const showTimeSeries = lngLat && hasTimeSeries && chartView == "overTime"
    if (showTimeSeries && hasNumericCurves(timeSeriesState.curves)) {
        // one curve (e.g. against return period) per scenario and year
        const curves = scenarioYearCurves(model, timeSeriesState.curves)
        const dataSets = {}
        const colours = {}
        const initiallyHidden = []
        curves.forEach((c) => {
            const key = prettifyScenarioId(c.scenarioId) + " " + c.year
            dataSets[key] = c.points
            if (!isShownByDefault(model, c.scenarioId, c.year))
                initiallyHidden.push(key)
            // shade by year: earlier years lighter
            colours[key] = lighten(
                theme.scenarios[c.scenarioId] ?? theme.palette.primary.main,
                0.6 * (1 - c.yearRank)
            )
        })
        const isReturnPeriod = curves[0].indexName == "return period"
        chart = (
            <div>
                <Typography>
                    {isReturnPeriod ? (
                        <Link
                            onClick={() => {
                                setGraphType(
                                    graphType == "returnPeriod"
                                        ? "exceedance"
                                        : "returnPeriod"
                                )
                            }}
                        >
                            {graphType == "returnPeriod"
                                ? "Return period curves"
                                : "Exceedance curves"}
                        </Link>
                    ) : (
                        "Curves"
                    )}
                    {" by scenario and year for pinned location (lat, lon) " +
                        lngLat.lat.toFixed(4) +
                        "°, " +
                        lngLat.lng.toFixed(4) +
                        "° (click the legend to show or hide):"}
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <Box sx={{ width: "90%", maxWidth: 900 }}>
                        {isReturnPeriod ? (
                            <ExceedancePlot
                                key={model.path}
                                dataSets={dataSets}
                                colours={colours}
                                initiallyHidden={initiallyHidden}
                                quantity={model.indicator_id}
                                units={model.units}
                                graphType={graphType}
                                mapIndexValue={mapIndexValue}
                            />
                        ) : (
                            <ThresholdPlot
                                key={model.path}
                                dataSets={dataSets}
                                colours={colours}
                                initiallyHidden={initiallyHidden}
                                quantity={model.indicator_id}
                                units={model.units}
                                mapIndexValue={mapIndexValue}
                            />
                        )}
                    </Box>
                </Box>
            </div>
        )
    } else if (showTimeSeries) {
        // single value per scenario and year: plot against year
        const { historical, series } = scenarioTimeSeries(
            model,
            timeSeriesState.curves,
            indexValues?.indexSelectedValue
        )
        const caption =
            indexValues?.allIndexValues?.length > 1
                ? " at " + indexValueCaption(indexValues).toLowerCase()
                : ""
        chart =
            timeSeriesState.status === "error" ? (
                <Typography color="error">
                    Could not retrieve indicator values for the pinned location.
                </Typography>
            ) : (
                <div>
                    <Typography>
                        {"All scenarios and years" +
                            caption +
                            " for pinned location (lat, lon) " +
                            lngLat.lat.toFixed(4) +
                            "°, " +
                            lngLat.lng.toFixed(4) +
                            "° (click the legend to show or hide):"}
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <Box sx={{ width: "90%", maxWidth: 900 }}>
                            <ScenarioTimeSeriesPlot
                                key={model.path}
                                historical={historical}
                                series={series}
                                initiallyHidden={series
                                    .filter(
                                        (s) =>
                                            !defaultScenarioIds(model).includes(
                                                s.scenarioId
                                            )
                                    )
                                    .map((s) =>
                                        prettifyScenarioId(s.scenarioId)
                                    )}
                                quantity={model.indicator_id}
                                units={model.units}
                            />
                        </Box>
                    </Box>
                </div>
            )
    }
    const fetching =
        hazardPointState.status === "fetching" ||
        (showTimeSeries && timeSeriesState.status === "fetching")

    return (
        <Paper
            sx={{
                p: 1,
                display: "flex",
                flexDirection: "column",
                m: 0,
            }}
        >
            <ScatterMap
                hazardMenu={hazardMenu1}
                hazardMenuDispatch={hazardMenuDispatch1}
                onClick={handleClick}
                onIndexValuesChange={setIndexValues}
                visible={visible}
            />
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1,
                }}
            >
                <Title>{title}</Title>
                {lngLat && hasTimeSeries ? (
                    <ToggleButtonGroup
                        size="small"
                        exclusive
                        color="primary"
                        value={chartView}
                        onChange={(event, value) =>
                            value && setChartView(value)
                        }
                        aria-label="Chart view"
                    >
                        <ToggleButton
                            value="selected"
                            sx={{ textTransform: "none", py: 0.25 }}
                        >
                            Selected scenario/year
                        </ToggleButton>
                        <ToggleButton
                            value="overTime"
                            sx={{ textTransform: "none", py: 0.25 }}
                        >
                            Multiple scenarios/years
                        </ToggleButton>
                    </ToggleButtonGroup>
                ) : null}
            </Box>
            <Box sx={{ width: "100%" }}>
                {fetching ? <LinearProgress /> : <div></div>}
            </Box>
            {chart}
            <Summary
                modelDescription={hazardMenu1?.selectedModel?.description}
            />
        </Paper>
    )
}
