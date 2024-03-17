import { useContext, useEffect, useReducer, useState, React } from "react"
import Box from "@mui/material/Box"
import LinearProgress from "@mui/material/LinearProgress"
import { ExceedancePlot, ThresholdPlot } from "../components/Chart"
import Link from "@mui/material/Link"
import Paper from "@mui/material/Paper"
import { ScatterMap } from "../components/ScatterMap"
import Summary from "../components/Summary"
import Title from "../components/Title"
import {
    hazardMenuReducer,
    hazardMenuInitialiser,
    loadHazardMenuData,
} from "../data/HazardInventory.js"
import { v4 as uuidv4 } from "uuid"
import axios from "axios"
import { GlobalDataContext } from "../data/GlobalData"
import { Typography } from "@mui/material"

export default function HazardViewer(props) {
    const { visible } = props

    const hazardMenuInitialState = hazardMenuInitialiser()

    // holds both the inventory of available hazard data and the menu state
    const [hazardMenu1, hazardMenuDispatch1] = useReducer(
        hazardMenuReducer,
        hazardMenuInitialState
    )
    
    //const [hazardMenu2, hazardMenuDispatch2] = useReducer(
    //    hazardMenuReducer,
    //    hazardMenuInitialState
    //)

    const [graphType, setGraphType] = useState("returnPeriod")
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
        status: 'idle',
        error: null,
        indexName: null, // 'return period' or 'threshold'
        data: [],
    };
    
    const [hazardPointState, hazardPointDispatch] = useReducer((state, action) => {
        switch (action.type) {
            case 'FETCHING':
                return { ...hazardPointInitialState, status: 'fetching' };
            case 'FETCHED':
                return { ...hazardPointInitialState, status: 'fetched', data: action.payload.data, 
                indexName: action.payload.indexName };
            case 'FETCH_ERROR':
                return { ...hazardPointInitialState, status: 'error', error: action.payload };
            default:
                return state;
        }
    }, hazardPointInitialState);

    useEffect(() => {
        async function fetchGraphData() {
            if (hazardMenu1.inventory) {
                if (lngLat) {
                    hazardPointDispatch({ type: 'FETCHING' });
                    var payload = {
                        items: [
                            {
                                request_item_id: uuidv4(),
                                event_type: hazardMenu1.selectedHazardTypeId,
                                longitudes: [lngLat.lng],
                                latitudes: [lngLat.lat],
                                year: hazardMenu1.selectedYear,
                                scenario: hazardMenu1.selectedScenario.id,
                                indicator_id: hazardMenu1.selectedModel.indicator_id,
                                path: hazardMenu1.selectedModel.path,
                            },
                        ],
                        interpolation: "max"
                    }
                    try {
                        const config = {
                            headers:{
                                Authorization: 'Bearer ' + globals.token
                            }
                          };
                        var response = await axios.post(
                            apiHost + "/api/get_hazard_data",
                            payload,
                            (globals.token == "") ? null : config 
                        )
                        response.access_token && globals.setToken(response.access_token)
                        var curve_set =
                            response.data.items[0].intensity_curve_set[0]
                        var points =
                            curve_set.intensities.length == 1
                                ? [graphDataPoint(0, curve_set.intensities[0])]
                                : curve_set.index_values.map((item, i) =>
                                    graphDataPoint(
                                        item,
                                        curve_set.intensities[i]
                                    )
                                )
                        if (curve_set.index_name == "return period") points = points.reverse()
                        hazardPointDispatch({ type: 'FETCHED', payload: { data: points, indexName: curve_set.index_name }});
                    } catch (error) {
                        hazardPointDispatch({ type: 'FETCH_ERROR', payload: error.message });
                    }
                }
            }
        }
        fetchGraphData()
    }, [hazardMenu1, lngLat])

    var chart
    var title = hazardMenu1.menuOptions
        ? hazardMenu1.selectedModel.display_name
        : ""
    if (hazardPointState.data && hazardPointState.data.length > 0) {
        if (hazardPointState.data.length > 1) {
            chart = (
                <div>
                    <div>
                        {lngLat ? 
                            <div>
                                <Typography>
                                    <Link onClick={() => {
                                        setGraphType(graphType == "returnPeriod" ? "exceedance" : "returnPeriod");
                                    }}>
                                        {graphType == "returnPeriod" ? "Return period curve" : "Exceedance curve"} 
                                    </Link>
                                    {" for pinned location (lat, lon) " + lngLat.lat.toFixed(4) + "\u00b0, " +
                                    lngLat.lng.toFixed(4) + "\u00b0:"} 
                                </Typography>
                            </div>
                            : <div></div>
                        }
                    </div>
                    <Typography>
                    </Typography>
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', flexDirection: 'row' }} >
                        <Box sx={{ width: '90%', maxWidth: 900 }} >
                            {hazardPointState.indexName == "return period" ?
                                <ExceedancePlot data={hazardPointState.data} 
                                    quantity={hazardMenu1.selectedModel.indicator_id} units={hazardMenu1.selectedModel.units}
                                    graphType={graphType} />
                                :
                                <ThresholdPlot data={hazardPointState.data} 
                                    quantity={hazardMenu1.selectedModel.indicator_id} units={hazardMenu1.selectedModel.units}
                                    graphType={graphType} />    
                            }
                        </Box>
                    </Box>
                </div>
            )
        } else {
            chart = (
                <Typography>
                    {(lngLat ? "For pinned location (lat, lon) " + lngLat.lat.toFixed(4) + "\u00b0, " +
                        lngLat.lng.toFixed(4) + "\u00b0, indicator " : "Indicator ") + 
                        "value is " + hazardPointState.data[0].y.toPrecision(5) + 
                        (hazardMenu1.selectedModel.units && hazardMenu1.selectedModel.units != "none" ? 
                            " " + hazardMenu1.selectedModel.units + "." : ".")}
                </Typography>
            )
        }
    } else chart = <div></div>

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
                visible={visible}
            />
            <Title>{title}</Title>
            <Box sx={{ width: '100%' }}>
                {hazardPointState.status === 'fetching' ? (
                <LinearProgress /> ) : (<div></div>)}
            </Box>
            {chart}
            <Summary
                modelDescription={
                    hazardMenu1?.selectedModel?.description
                }
            /> 
        </Paper>

    )
}
