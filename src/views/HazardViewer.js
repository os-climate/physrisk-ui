import { useContext, useEffect, useReducer, useState, React } from "react"
import Box from "@mui/material/Box"
import LinearProgress from "@mui/material/LinearProgress"
import Chart from "../components/Chart"
import ChronicHazard from "../components/ChronicHazard"
import Paper from "@mui/material/Paper"
import ScatterMap from "../components/ScatterMap"
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

export default function HazardViewer(props) {
    const { visible } = props

    const hazardMenuInitialState = hazardMenuInitialiser()

    // holds both the inventory of available hazard data and the menu state
    const [hazardMenu, hazardMenuDispatch] = useReducer(
        hazardMenuReducer,
        hazardMenuInitialState
    )

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
            hazardMenuDispatch({ type: "initialise", payload: hazardMenuData })
        }
        fetchHazardMenuData()
    }, [])

    const hazardPointInitialState = {
        status: 'idle',
        error: null,
        data: [],
    };
    
    const [hazardPointState, hazardPointDispatch] = useReducer((state, action) => {
        switch (action.type) {
            case 'FETCHING':
                return { ...hazardPointInitialState, status: 'fetching' };
            case 'FETCHED':
                return { ...hazardPointInitialState, status: 'fetched', data: action.payload };
            case 'FETCH_ERROR':
                return { ...hazardPointInitialState, status: 'error', error: action.payload };
            default:
                return state;
        }
    }, hazardPointInitialState);

    useEffect(() => {
        async function fetchGraphData() {
            if (hazardMenu.inventory) {
                if (lngLat) {
                    hazardPointDispatch({ type: 'FETCHING' });
                    var payload = {
                        items: [
                            {
                                request_item_id: uuidv4(),
                                event_type: hazardMenu.selectedHazardTypeId,
                                longitudes: [lngLat.lng],
                                latitudes: [lngLat.lat],
                                year: hazardMenu.selectedYear,
                                scenario: hazardMenu.selectedScenario.id,
                                indicator_id: hazardMenu.selectedModel.indicator_id,
                                path: hazardMenu.selectedModel.path,
                            },
                        ],
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
                                : curve_set.return_periods.map((item, i) =>
                                    graphDataPoint(
                                        1.0 / item,
                                        curve_set.intensities[i]
                                    )
                                )
                                hazardPointDispatch({ type: 'FETCHED', payload: points });
                        // setGraphData(points)
                    } catch (error) {
                        hazardPointDispatch({ type: 'FETCH_ERROR', payload: error.message });
                    }
                }
            }
        }
        fetchGraphData()
    }, [hazardMenu, lngLat])

    var chart
    var title = hazardMenu.menuOptions
        ? hazardMenu.selectedModel.display_name +
        (lngLat
            ? " @ (" +
                lngLat.lng.toFixed(4) +
                "\u00b0, " +
                lngLat.lat.toFixed(4) +
                "\u00b0)"
            : "")
        : ""
    if (hazardPointState.data && hazardPointState.data.length > 0) {
        if (hazardPointState.data.length > 1) {
            chart = (
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', flexDirection: 'row' }} >
                    <Box sx={{ pb: 1, width: '60%', height: 200 }} >
                        <Chart data={hazardPointState.data} />
                    </Box>
                </Box>
            )
        } else {
            chart = (
                <ChronicHazard
                    data={hazardPointState.data}
                    units={hazardMenu.selectedModel.units}
                />
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
                hazardMenu={hazardMenu}
                hazardMenuDispatch={hazardMenuDispatch}
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
                    hazardMenu?.selectedModel?.description
                }
            /> 

        </Paper>

    )
}
