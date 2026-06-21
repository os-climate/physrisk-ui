/* eslint-disable */

import React, {
    useRef,
    useContext,
    useEffect,
    useReducer,
    useState,
} from "react"
import { useTheme } from "@mui/material/styles"
import {
    ScaleControl,
    Map,
    Marker,
    Layer,
    Source,
    MapProvider,
} from "react-map-gl" //maplibre';
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import { ColourBar } from "./ColourBar.jsx"
import Geocoder from "./Geocoder.tsx"
import { GlobalDataContext } from "../data/GlobalData"
import HazardIndexSelector from "./HazardIndexSelector.tsx"
import HazardMenusCompare from "./HazardMenusCompare.jsx"
import IconButton from "@mui/material/IconButton"
import InputLabel from "@mui/material/InputLabel"
import { InfoOutlined, SatelliteAlt, Map as MapIcon } from "@mui/icons-material"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import Popover from "@mui/material/Popover"
import Select from "@mui/material/Select"
import Stack from "@mui/material/Stack"
import Tooltip from "@mui/material/Tooltip"
import axios from "axios"

// note *public* access token
// committing into code-base; public token is available on client
export const mapboxAccessToken =
    "pk.eyJ1Ijoib3NjLW1hcGJveCIsImEiOiJjbG5hc2hqNnowMjliMmtsZHdiY3RnbzlxIn0.gboGNn4x1erl7O9Q3NrQDQ"

export function ScatterMap(props) {
    const {
        hazardMenu,
        hazardMenuDispatch,
        showHazardMenus = true,
        onClick,
        selectedAssetIndex,
        setSelectedAssetIndex,
        assetData,
        assetScores,
        assetSummary,
        visible,
    } = props

    const theme = useTheme()
    // popover
    const [popoverAnchorPos, setPopoverAnchorPos] = React.useState(null)
    const popoverOpen = Boolean(popoverAnchorPos)
    const handlePopoverClose = () => {
        setPopoverAnchorPos(null)
    }

    // events
    const handleAssetsMouseEnter = (event) => {
        const feature = event.features && event.features[0]
        if (feature) {
            mapRef.current.getCanvas().style.cursor = "pointer"
        }
    }

    const handleAssetsMouseLeave = (event) => {
        const feature = event.features && event.features[0]
        if (feature) {
            mapRef.current.getCanvas().style.cursor = ""
        }
    }

    const handleClick = (event) => {
        if (assetData) {
            const feature = event.features && event.features[0]
            if (feature) {
                const rect = mapContainerRef.current.getBoundingClientRect()
                setPopoverAnchorPos({
                    left: event.point.x + rect.x,
                    top: event.point.y + rect.y,
                })
                setSelectedAssetIndex(feature.id)
            }
        } else {
            setMarkers([
                { longitude: event.lngLat.lng, latitude: event.lngLat.lat },
            ])
            onClick(event)
        }
    }

    // geocoding
    const onSelectHandler = (result) => {
        console.log(result)
        if (mapRef.current) {
            let [lng, lat] = result.feature.center
            setMarkers([{ longitude: lng, latitude: lat }])

            mapRef.current.flyTo({
                center: result.feature.center,
                //essential: true, // this animation is considered essential with respect to prefers-reduced-motion
                zoom: 12,
                speed: 1,
            })

            onClick({ lngLat: { lng, lat } })
        }
    }

    // colour bar
    const colorbarData = [
        { xValue: 0, value: 1 },
        { xValue: hazardMenu?.mapColorbar?.maxValue ?? 1, value: 1 },
    ]
    const colorbarStops = hazardMenu?.mapColorbar?.stops ?? []

    // map
    const globals = useRef({}).current
    globals.value = useContext(GlobalDataContext)
    const mapContainerRef = useRef(null)
    const mapRef = useRef(null)
    const [lng] = useState(0)
    const [lat] = useState(45)
    const [zoom] = useState(3)
    const [satellite, setSatellite] = useState(false)

    const indexValuesInitialState = {
        status: "idle",
        error: null,
        allIndexValues: [],
        availableIndexValues: [],
        indexUnits: null,
        indexSelectedValue: null,
    }

    const [indexValuesState, indexValuesDispatch] = useReducer(
        (state, action) => {
            switch (action.type) {
                case "FETCHING":
                    return { ...indexValuesInitialState, status: "fetching" }
                case "FETCHED":
                    return {
                        ...indexValuesInitialState,
                        status: "fetched",
                        allIndexValues: action.payload.allIndexValues,
                        availableIndexValues:
                            action.payload.availableIndexValues,
                        indexDisplayName: action.payload.indexDisplayName,
                        indexUnits: action.payload.indexUnits,
                        indexSelectedValue:
                            action.payload.availableIndexValues.at(-1),
                    }
                case "SELECTED":
                    return {
                        ...state,
                        status: "fetched",
                        indexSelectedValue: action.payload.indexSelectedValue,
                    }
                case "FETCH_ERROR":
                    return {
                        ...indexValuesInitialState,
                        status: "error",
                        error: action.payload,
                    }
                default:
                    return state
            }
        },
        indexValuesInitialState
    )

    // hazard index values
    useEffect(() => {
        async function fetchMapAvailableLayers() {
            if (hazardMenu && hazardMenu.selectedModel) {
                //hazardPointDispatch({ type: 'FETCHING' });
                indexValuesDispatch({ type: "FETCHING" })
                var payload = {
                    resource: hazardMenu.selectedModel.path,
                    scenario_id: hazardMenu.selectedScenario.id,
                    year: hazardMenu.selectedYear,
                }
                try {
                    const config = {
                        headers: {
                            Authorization: "Bearer " + globals.token,
                        },
                    }
                    var response = await axios.post(
                        globals.value.services.apiHost + "/api/get_image_info",
                        payload,
                        globals.token == "" ? null : config
                    )
                    var index_units = response.data.index_units
                    indexValuesDispatch({
                        type: "FETCHED",
                        payload: {
                            allIndexValues: response.data.all_index_values,
                            availableIndexValues:
                                response.data.available_index_values,
                            indexDisplayName: response.data.index_display_name,
                            indexUnits: index_units,
                        },
                    })
                } catch (error) {
                    indexValuesDispatch({
                        type: "FETCH_ERROR",
                        payload: error.message,
                    })
                }
            }
        }
        fetchMapAvailableLayers()
    }, [hazardMenu])

    // markers
    const [markers, setMarkers] = useState([])

    var transformRequest = (url, resourceType) => {
        if (
            (resourceType === "Tile" || resourceType === "Image") &&
            globals.value.token &&
            !url.startsWith("https://api.mapbox.com")
        ) {
            return {
                url: url,
                headers: { Authorization: "Bearer " + globals.value.token },
            }
        }
    }

    // to deal with bug (?) that map does not resize if not visible
    useEffect(() => {
        mapRef.current?.resize()
    }, [visible])

    // clear firstSymbolId immediately when style switches so react-map-gl
    // doesn't try to insert the hazard layer before a layer from the old style
    useEffect(() => {
        setFirstSymbolId(undefined)
    }, [satellite])

    useEffect(() => {
        if (mapRef.current) {
            let lngLat = [
                assetData.items[0].longitude,
                assetData.items[0].latitude,
            ]
            if (lngLat[0] && lngLat[1]) {
                mapRef.current.flyTo({
                    center: lngLat,
                    zoom: 3,
                    speed: 1,
                })
            }
        }
    }, [assetData])

    const [firstSymbolId, setFirstSymbolId] = useState(undefined)

    const updateFirstSymbolId = () => {
        try {
            const layers = mapRef.current?.getStyle()?.layers ?? []
            const layer = layers.find((l) => l["source-layer"] === "water")
            setFirstSymbolId(layer?.id)
        } catch {
            setFirstSymbolId(undefined)
        }
    }

    const handleMapLoad = () => {
        updateFirstSymbolId()
        // style.load fires on every style switch (onLoad does not)
        mapRef.current?.on("style.load", updateFirstSymbolId)
    }

    function getSourceStyle(mapInfo) {
        const apiHost = globals.value.services.apiHost
        if (!mapInfo) return ""

        var maxzoom = 15

        if (
            mapInfo.source == "mapbox" ||
            mapInfo.source == "map_array_pyramid"
        ) {
            var url =
                mapInfo.source == "mapbox"
                    ? "https://api.mapbox.com/v4/" +
                      mapInfo.mapId +
                      "/{z}/{x}/{y}.png"
                    : apiHost +
                      "/api/tiles/" +
                      mapInfo.resource +
                      "/{z}/{x}/{y}.png" +
                      "?minValue=" +
                      mapInfo.minValue +
                      "&maxValue=" +
                      mapInfo.maxValue +
                      "&scenarioId=" +
                      mapInfo.scenarioId +
                      "&year=" +
                      mapInfo.year +
                      (indexValuesState.indexSelectedValue !== null
                          ? "&indexValue=" + indexValuesState.indexSelectedValue
                          : "")
            return {
                id: "hazard",
                type: "raster",
                key: url,
                tiles: [url],
                tileSize: 512,
                maxzoom: maxzoom,
            }
        } else if (mapInfo.source == "map_array") {
            const coords = mapInfo.bounds
                ? mapInfo.bounds
                : [
                      [-180.125, 85.125],
                      [180.125, 85.125],
                      [180.125, -85.125],
                      [-180.125, -85.125],
                  ]
            return {
                id: "hazard",
                type: "image",
                url:
                    apiHost +
                    "/api/images/" +
                    mapInfo.resource +
                    ".png?minValue=" +
                    mapInfo.minValue +
                    "&maxValue=" +
                    mapInfo.maxValue +
                    "&scenarioId=" +
                    mapInfo.scenarioId +
                    "&year=" +
                    mapInfo.year,
                key:
                    apiHost +
                    "/api/images/" +
                    mapInfo.resource +
                    ".png?minValue=" +
                    mapInfo.minValue +
                    "&maxValue=" +
                    mapInfo.maxValue +
                    "&scenarioId=" +
                    mapInfo.scenarioId +
                    "&year=" +
                    mapInfo.year,
                coordinates: coords,
            }
        }
    }

    const sourceStyle = hazardMenu ? getSourceStyle(hazardMenu.mapInfo) : null

    const layerStyle = hazardMenu
        ? {
              id: "hazard",
              type: "raster",
              key: sourceStyle.key,
              source: "hazard",
              layout: {
                  visibility: "visible",
              },
              paint: {
                  "raster-resampling": "nearest",
                  "raster-opacity": satellite ? 0.8 : 1.0,
              },
          }
        : null

    var assetsSourceStyle = null
    var assetsLayerStyle = null

    if (assetData && assetData.items) {
        var key = "test"

        assetsSourceStyle = {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features: assetData.items.map((item, index) => ({
                    type: "Feature",
                    id: index,
                    properties: {
                        risk: assetScores ? assetScores[index] : "No data",
                        selected: (index === selectedAssetIndex).toString(),
                    }, // "Low"
                    geometry: {
                        type: "Point",
                        coordinates: [item.longitude, item.latitude],
                    },
                })),
            },
            tolerance: 0,
            key: key,
        }
        assetsLayerStyle = {
            id: "assets-circle",
            type: "circle",
            source: "assets",
            paint: {
                //"circle-color": "hsla(145,100%,30%,1)",
                "circle-color": [
                    "match",
                    ["get", "risk"],
                    "0",
                    theme.scores[0],
                    "1",
                    theme.scores[1],
                    "2",
                    theme.scores[2],
                    "3",
                    theme.scores[3],
                    "4",
                    theme.scores[4],
                    /* No data */ theme.scores[-1],
                ],
                "circle-radius": 7,
                "circle-stroke-width": 1.5,
                "circle-stroke-color": [
                    "match",
                    ["get", "selected"],
                    "true",
                    "Black",
                    "false",
                    "White",
                    "White",
                ],
            },
            key: key,
        }
    }

    return (
        <React.Fragment>
            <Box>
                {hazardMenu && showHazardMenus ? (
                    <HazardMenusCompare
                        hazardMenu1={hazardMenu}
                        hazardMenuDispatch1={hazardMenuDispatch}
                    />
                ) : (
                    <></>
                )}
            </Box>
            <Box sx={{ position: "relative" }}>
                <Box
                    sx={{
                        width: 240,
                        backgroundColor: "rgba(255, 255, 255, 1.0)",
                        position: "absolute",
                        top: 10,
                        right: 10,
                        zIndex: 1,
                        borderRadius: "4px",
                        boxShadow: "0 0 10px 2px rgba(0,0,0,.2)",
                    }}
                >
                    <Geocoder
                        apiKey={mapboxAccessToken}
                        onSelect={onSelectHandler}
                    />
                </Box>
                <Box
                    ref={mapContainerRef}
                    sx={{ height: "60vh", position: "relative" }}
                >
                    <Tooltip
                        title={
                            satellite
                                ? "Switch to map view"
                                : "Switch to satellite view"
                        }
                    >
                        <IconButton
                            onClick={() => setSatellite((s) => !s)}
                            size="small"
                            sx={{
                                position: "absolute",
                                top: 10,
                                left: 10,
                                zIndex: 1,
                                backgroundColor: "rgba(255,255,255,0.9)",
                                "&:hover": {
                                    backgroundColor: "rgba(255,255,255,1)",
                                },
                                borderRadius: "4px",
                                boxShadow: "0 0 6px rgba(0,0,0,0.25)",
                            }}
                        >
                            {satellite ? (
                                <MapIcon fontSize="small" />
                            ) : (
                                <SatelliteAlt fontSize="small" />
                            )}
                        </IconButton>
                    </Tooltip>
                    <MapProvider>
                        <Map
                            ref={mapRef}
                            id="map"
                            mapboxAccessToken={mapboxAccessToken}
                            projection="globe"
                            //mapLib={maplibregl}
                            //mapStyle="https://api.maptiler.com/maps/streets-v2/style.json?key=LiH20XNxcFiTXyT4fgjM"
                            mapStyle={
                                satellite
                                    ? "mapbox://styles/mapbox/satellite-streets-v12"
                                    : "mapbox://styles/mapbox/streets-v11"
                            }
                            attributionControl={false}
                            initialViewState={{
                                latitude: lat,
                                longitude: lng,
                                zoom: zoom,
                            }}
                            onLoad={handleMapLoad}
                            transformRequest={transformRequest}
                            onClick={handleClick}
                            onMouseEnter={handleAssetsMouseEnter}
                            onMouseLeave={handleAssetsMouseLeave}
                            interactiveLayerIds={["assets-circle"]}
                        >
                            {markers.map((m, i) => (
                                <Marker {...m} key={i} />
                            ))}
                            {sourceStyle ? (
                                <Source {...sourceStyle}>
                                    <Layer
                                        beforeId={firstSymbolId || undefined}
                                        {...layerStyle}
                                    />
                                </Source>
                            ) : (
                                <></>
                            )}
                            {assetsSourceStyle ? (
                                <Source {...assetsSourceStyle}>
                                    <Layer {...assetsLayerStyle} />
                                </Source>
                            ) : (
                                <></>
                            )}
                            <ScaleControl
                                sx={{
                                    color: "beige",
                                    stroke: "rgb(117,117,117",
                                }}
                                stroke="rgb(117,117,117"
                            />
                        </Map>
                    </MapProvider>
                </Box>
                {hazardMenu ? (
                    <>
                        <Stack
                            sx={{
                                // height: 70,
                                width: 175,
                                backgroundColor: "rgba(255, 255, 255, 1.0)",
                                position: "absolute",
                                bottom: 10,
                                right: 10,
                                zIndex: 1,
                                borderRadius: "4px",
                                boxShadow: "0 0 10px 2px rgba(0,0,0,.2)",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                            spacing={0}
                        >
                            <Tooltip
                                title="For acute hazards, the map overlay may be limited to the maximum return period.
                    Click a point on the map to view all hazard indicator values.
                    Note that indicator values are calculated using the original coordinate reference system of the data, 
                    whereas the overlay is a Mercator reprojection (i.e. small differences in overlay at pixel level)."
                            >
                                <IconButton
                                    sx={{
                                        p: 0.5,
                                        position: "absolute",
                                        top: -24,
                                        // bottom: -4,
                                        right: -2,
                                        zIndex: 1,
                                    }}
                                    aria-label="info"
                                    size="small"
                                >
                                    <InfoOutlined
                                        fontSize="inherit"
                                        color="primary"
                                    />
                                </IconButton>
                            </Tooltip>

                            <HazardIndexSelector
                                indexSelectedValue={
                                    indexValuesState.indexSelectedValue
                                }
                                indexUnits={indexValuesState.indexUnits}
                                availableIndexValues={
                                    indexValuesState.availableIndexValues
                                }
                                allIndexValues={indexValuesState.allIndexValues}
                                indexDisplayName={
                                    indexValuesState.indexDisplayName
                                }
                                indexValuesDispatch={indexValuesDispatch}
                            />
                            <Box
                                sx={{
                                    height: 45,
                                    width: 175,
                                    p: 0,
                                    m: 0.5,
                                }}
                            >
                                <ColourBar
                                    colorbarData={colorbarData}
                                    colorbarStops={colorbarStops}
                                    units={hazardMenu?.mapColorbar?.units}
                                />
                            </Box>
                        </Stack>
                    </>
                ) : (
                    <></>
                )}
                {assetSummary ? (
                    <Popover
                        id="mouse-over-popover"
                        sx={{
                            //    pointerEvents: 'none',
                            height: 400,
                        }}
                        open={popoverOpen}
                        anchorPosition={popoverAnchorPos}
                        anchorReference="anchorPosition"
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "left",
                        }}
                        transformOrigin={{
                            vertical: "top",
                            horizontal: "left",
                        }}
                        onClose={handlePopoverClose}
                        //disableRestoreFocus
                    >
                        {assetSummary(selectedAssetIndex)}
                    </Popover>
                ) : (
                    <></>
                )}
            </Box>
        </React.Fragment>
    )
}
