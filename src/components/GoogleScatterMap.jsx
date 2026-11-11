/* eslint-disable */

import React, {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
} from "react"
import { useTheme } from "@mui/material/styles"
import { Map, useMap } from "@vis.gl/react-google-maps"
import { GoogleMapsOverlay } from "@deck.gl/google-maps"
import { BitmapLayer, GeoJsonLayer } from "@deck.gl/layers"
import { TileLayer } from "@deck.gl/geo-layers"
import { MaskExtension } from "@deck.gl/extensions"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import InputLabel from "@mui/material/InputLabel"
import { InfoOutlined, SatelliteAlt, Map as MapIcon } from "@mui/icons-material"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import Popover from "@mui/material/Popover"
import Select from "@mui/material/Select"
import Stack from "@mui/material/Stack"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import axios from "axios"
import { ColourBar } from "./ColourBar.jsx"
import Geocoder from "./Geocoder.tsx"
import { GlobalDataContext } from "../data/GlobalData"
import {
    indexValuesInitialState,
    indexValuesKey,
    indexValuesReducer,
    tileIndexValues,
} from "../data/HazardIndexValues"
import { hashCode } from "../utils/hash"
import HazardIndexSelector from "./HazardIndexSelector.jsx"
import HazardMenusCompare from "./HazardMenusCompare.jsx"
import { mapboxAccessToken } from "./ScatterMap.jsx"
import {
    differenceCaption,
    differenceQueryParams,
    isJbaResource,
    withColorbarOverride,
} from "../data/HazardInventory"

/** The hazard layer to show on the map, as tiles or a single image, or null
 *  if none. */
function hazardLayerSpec(mapInfo, indexValuesState, apiHost) {
    if (!mapInfo) return null
    const { resource, minValue, maxValue, scenarioId, year } = mapInfo
    const colormapParam = mapInfo.colormapName
        ? `&colormap=${mapInfo.colormapName}`
        : ""
    const scalingParam = mapInfo.scaling ? `&scaling=${mapInfo.scaling}` : ""
    const query =
        `?minValue=${minValue}&maxValue=${maxValue}` +
        `&scenarioId=${scenarioId}&year=${year}${colormapParam}${scalingParam}`

    if (mapInfo.source === "map_array_pyramid") {
        const indexParam =
            indexValuesState.indexSelectedValue != null
                ? `&indexValue=${indexValuesState.indexSelectedValue}`
                : ""
        const tileSize = indexValuesState.tileSize ?? 512
        return {
            type: "tiles",
            url:
                `${apiHost}/api/tiles/${resource}/{z}/{x}/{y}.png` +
                query +
                `&tileSize=${tileSize}${indexParam}` +
                differenceQueryParams(mapInfo),
            tileSize,
            maxZoom: (indexValuesState.maxZoom ?? 16) - 1,
        }
    }
    if (mapInfo.source === "map_array") {
        const defaultBounds = [
            [-180.125, 85.125],
            [180.125, 85.125],
            [180.125, -85.125],
            [-180.125, -85.125],
        ]
        const b = mapInfo.bounds ?? defaultBounds
        const longitudes = b.map((c) => c[0])
        const latitudes = b.map((c) => c[1])
        return {
            type: "image",
            url: `${apiHost}/api/images/${resource}.png` + query,
            // deck.gl BitmapLayer bounds: [west, south, east, north]
            bounds: [
                Math.min(...longitudes),
                Math.min(...latitudes),
                Math.max(...longitudes),
                Math.max(...latitudes),
            ],
        }
    }
    // e.g. "mapbox" sources, which cannot be shown on Google maps
    return null
}

// ---------------------------------------------------------------------------
// Inner component — must render inside <Map> to use useMap() / useMapsLibrary()
// ---------------------------------------------------------------------------

function MapInteractions({
    hazardMenu,
    onClick,
    selectedAssetIndex,
    setSelectedAssetIndex,
    assetData,
    assetScores,
    opacity,
    indexValuesState,
    googleMapRef,
    mapViewportRef,
    setPopoverAnchorPos,
    setMarkers,
}) {
    const map = useMap()
    const theme = useTheme()
    const globals = useRef({}).current
    globals.value = useContext(GlobalDataContext)

    // Capture map ref for geocoder pan/zoom
    useEffect(() => {
        googleMapRef.current = map
    }, [map, googleMapRef])

    // Keep viewport ref up to date so DrawShapeModal can open at the right position.
    useEffect(() => {
        if (!map || !mapViewportRef) return
        const update = () => {
            const c = map.getCenter()
            if (c)
                mapViewportRef.current = {
                    center: [c.lng(), c.lat()],
                    zoom: map.getZoom(),
                }
        }
        update()
        const listener = map.addListener("idle", update)
        return () => listener.remove()
    }, [map, mapViewportRef])

    // Fly to the first asset when portfolio changes
    useEffect(() => {
        if (!map || !assetData?.items?.[0]) return
        const { longitude, latitude } = assetData.items[0]
        if (longitude && latitude) {
            map.panTo({ lat: latitude, lng: longitude })
            map.setZoom(18)
        }
    }, [map, assetData])

    // -----------------------------------------------------------------------
    // Assets — Google Maps Data Layer (GeoJSON)
    // -----------------------------------------------------------------------

    useEffect(() => {
        if (!map || !assetData?.items) return

        const toRemove = []
        map.data.forEach((f) => toRemove.push(f))
        toRemove.forEach((f) => map.data.remove(f))

        map.data.addGeoJson({
            type: "FeatureCollection",
            features: assetData.items
                .map((item, index) => ({ item, index }))
                .filter(
                    ({ item }) =>
                        item.longitude != null && item.latitude != null
                )
                .map(({ item, index }) => ({
                    type: "Feature",
                    id: index,
                    properties: {
                        risk: assetScores
                            ? String(assetScores[index])
                            : "No data",
                    },
                    geometry: {
                        type: "Point",
                        coordinates: [item.longitude, item.latitude],
                    },
                })),
        })

        return () => {
            const toRemove = []
            map.data.forEach((f) => toRemove.push(f))
            toRemove.forEach((f) => map.data.remove(f))
        }
    }, [map, assetData, assetScores])

    // Update circle style whenever selection or scores change
    useEffect(() => {
        if (!map) return
        const riskColors = {
            0: theme.scores[0],
            1: theme.scores[1],
            2: theme.scores[2],
            3: theme.scores[3],
            4: theme.scores[4],
        }
        map.data.setStyle((feature) => {
            const risk = feature.getProperty("risk")
            const isSelected = feature.getId() === selectedAssetIndex
            return {
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: riskColors[risk] ?? theme.scores[-1],
                    fillOpacity: 1,
                    strokeColor: isSelected ? "#000000" : "#FFFFFF",
                    strokeWeight: 1.5,
                    scale: 7,
                },
            }
        })
    }, [map, assetData, assetScores, selectedAssetIndex, theme])

    // Data layer click — show asset popover
    useEffect(() => {
        if (!map) return
        const listener = map.data.addListener("click", (e) => {
            const id = e.feature.getId()
            setSelectedAssetIndex(id)
            setPopoverAnchorPos({
                left: e.domEvent.clientX,
                top: e.domEvent.clientY,
            })
        })
        return () => listener.remove()
    }, [map, setSelectedAssetIndex, setPopoverAnchorPos])

    // Map background click — HazardViewer marker placement
    useEffect(() => {
        if (!map || assetData) return
        const listener = map.addListener("click", (e) => {
            const lat = e.latLng.lat()
            const lng = e.latLng.lng()
            setMarkers([{ lat, lng }])
            onClick?.({ lngLat: { lat, lng } })
        })
        return () => window.google.maps.event.removeListener(listener)
    }, [map, assetData, onClick, setMarkers])

    // -----------------------------------------------------------------------
    // Markers (HazardViewer pin)
    // -----------------------------------------------------------------------
    const markerInstancesRef = useRef([])

    useEffect(() => {
        if (!map) return
        // (markers state lives in parent; we receive it indirectly via setMarkers)
    }, [map])

    // -----------------------------------------------------------------------
    // Hazard overlay — deck.gl TileLayer / BitmapLayer via GoogleMapsOverlay.
    // Using deck.gl means auth headers can be set via loadOptions.fetch.headers,
    // matching what Mapbox does with transformRequest { resourceType: "Image" }.
    // -----------------------------------------------------------------------
    const deckOverlayRef = useRef(null)

    // Create the GoogleMapsOverlay once; it persists across hazard changes.
    // interleaved=true uses WebGLOverlayView so labels render above the hazard
    // layer, but it requires a vector map (mapId). Fall back to the default
    // OverlayView if it is not available.
    useEffect(() => {
        if (!map) return
        let overlay
        try {
            overlay = new GoogleMapsOverlay({ layers: [], interleaved: true })
            overlay.setMap(map)
        } catch (e) {
            console.warn(
                "GoogleMapsOverlay interleaved mode failed, falling back:",
                e
            )
            overlay = new GoogleMapsOverlay({ layers: [] })
            overlay.setMap(map)
        }
        deckOverlayRef.current = overlay
        return () => {
            overlay.setMap(null)
            deckOverlayRef.current = null
        }
    }, [map])

    // Rebuild the deck.gl layers whenever the hazard layer changes. The layer
    // is described in full first, so that the effect runs on any change to it
    // (e.g. of tile URL, tile size or maximum zoom).
    const hazardLayer = hazardLayerSpec(
        hazardMenu?.mapInfo,
        indexValuesState,
        globals.value.services.apiHost
    )
    const hazardLayerKey = JSON.stringify(hazardLayer)
    useEffect(() => {
        const overlay = deckOverlayRef.current
        if (!overlay) return

        if (!hazardLayer) {
            overlay.setProps({ layers: [] })
            return
        }

        const token = globals.value.token
        const fetchHeaders = token ? { Authorization: `Bearer ${token}` } : {}

        if (hazardLayer.type === "tiles") {
            const tileLayer = new TileLayer({
                // a layer of its own for each set of tiles, so that deck.gl
                // loads them afresh rather than reloading those of the last one
                id: "hazard-tiles-" + hashCode(hazardLayer.url),
                data: hazardLayer.url,
                loadOptions: { fetch: { headers: fetchHeaders } },
                tileSize: hazardLayer.tileSize,
                maxZoom: hazardLayer.maxZoom,
                refinementStrategy: "no-overlap",
                opacity,
                renderSubLayers: (props) => {
                    const {
                        bbox: { west, south, east, north },
                    } = props.tile
                    return new BitmapLayer(props, {
                        data: null,
                        image: props.data,
                        bounds: [west, south, east, north],
                        textureParameters: {
                            minFilter: "nearest",
                            magFilter: "nearest",
                        },
                    })
                },
            })
            overlay.setProps({ layers: [tileLayer] })
        } else {
            const landMask = new GeoJsonLayer({
                id: "land-mask",
                data: "/ne_10m_land.geojson",
                operation: "mask",
            })
            const bitmapLayer = new BitmapLayer({
                id: "hazard-image",
                image: hazardLayer.url,
                bounds: hazardLayer.bounds,
                loadOptions: { fetch: { headers: fetchHeaders } },
                opacity,
                textureParameters: {
                    minFilter: "nearest",
                    magFilter: "nearest",
                },
                extensions: [new MaskExtension()],
                maskId: "land-mask",
            })
            overlay.setProps({ layers: [landMask, bitmapLayer] })
        }
    }, [map, hazardLayerKey, opacity])

    return null
}

// ---------------------------------------------------------------------------
// Outer component
// ---------------------------------------------------------------------------

export function GoogleScatterMap(props) {
    const {
        hazardMenu,
        hazardMenuDispatch,
        showHazardMenus = true,
        onClick,
        onIndexValuesChange,
        selectedAssetIndex,
        setSelectedAssetIndex,
        assetData,
        assetScores,
        assetSummary,
        visible,
        mapViewportRef,
    } = props

    const theme = useTheme()
    const globals = useRef({}).current
    globals.value = useContext(GlobalDataContext)

    const [popoverAnchorPos, setPopoverAnchorPos] = useState(null)
    const popoverOpen = Boolean(popoverAnchorPos)
    const handlePopoverClose = () => setPopoverAnchorPos(null)

    const [satellite, setSatellite] = useState(false)
    const [markers, setMarkers] = useState([])
    const googleMapRef = useRef(null)
    const mapContainerRef = useRef(null)

    // Colour bar data
    const [colorbarOverride, setColorbarOverride] = useState(null)
    useEffect(() => {
        setColorbarOverride(null)
    }, [
        hazardMenu?.mapInfo?.resource,
        hazardMenu?.selectedScenario?.id,
        hazardMenu?.selectedYear,
        hazardMenu?.mapInfo?.compareScenarioId,
        hazardMenu?.mapInfo?.compareYear,
    ])

    const effectiveMapInfo = useMemo(
        () => withColorbarOverride(hazardMenu?.mapInfo, colorbarOverride),
        [hazardMenu?.mapInfo, colorbarOverride]
    )
    const colorbarData = [
        { xValue: effectiveMapInfo?.minValue ?? 0, value: 1 },
        { xValue: effectiveMapInfo?.maxValue ?? 1, value: 1 },
    ]
    const colorbarStops = effectiveMapInfo?.colorbar?.stops ?? []
    const effectiveOpacity =
        colorbarOverride?.opacity ?? (satellite ? 0.8 : 1.0)

    const mapInteractionsHazardMenu = useMemo(
        () =>
            hazardMenu
                ? { ...hazardMenu, mapInfo: effectiveMapInfo }
                : hazardMenu,
        [hazardMenu, effectiveMapInfo]
    )

    // Hazard index values
    const [indexValuesState, indexValuesDispatch] = useReducer(
        indexValuesReducer,
        indexValuesInitialState
    )
    useEffect(() => {
        onIndexValuesChange?.(indexValuesState)
    }, [indexValuesState])

    useEffect(() => {
        // ignore the response if the selection changes before it arrives, so
        // that index values of a previous model are never used for the tiles
        let cancelled = false
        async function fetchMapAvailableLayers() {
            if (hazardMenu && hazardMenu.selectedModel) {
                const key = indexValuesKey(hazardMenu)
                indexValuesDispatch({ type: "FETCHING" })
                const payload = {
                    resource: hazardMenu.selectedModel.path,
                    scenario_id: hazardMenu.selectedScenario.id,
                    year: hazardMenu.selectedYear,
                    tile_size: isJbaResource(hazardMenu.selectedModel.path)
                        ? 256
                        : undefined,
                }
                try {
                    const config = {
                        headers: {
                            Authorization: "Bearer " + globals.value.token,
                        },
                    }
                    const response = await axios.post(
                        globals.value.services.apiHost + "/api/get_image_info",
                        payload,
                        globals.value.token === "" ? null : config
                    )
                    if (cancelled) return
                    indexValuesDispatch({
                        type: "FETCHED",
                        payload: {
                            key,
                            allIndexValues: response.data.all_index_values,
                            availableIndexValues:
                                response.data.available_index_values,
                            indexDisplayName: response.data.index_display_name,
                            indexUnits: response.data.index_units,
                            maxZoom: response.data.max_zoom ?? 15,
                            tileSize: response.data.tile_size ?? 512,
                        },
                    })
                } catch (error) {
                    if (cancelled) return
                    indexValuesDispatch({
                        type: "FETCH_ERROR",
                        payload: error.message,
                    })
                }
            }
        }
        fetchMapAvailableLayers()
        return () => {
            cancelled = true
        }
    }, [
        hazardMenu?.selectedModel?.path,
        hazardMenu?.selectedScenario?.id,
        hazardMenu?.selectedYear,
    ])

    // Geocoder select → pan map
    const onSelectHandler = (result) => {
        if (googleMapRef.current) {
            const [lng, lat] = result.feature.center
            setMarkers([{ lat, lng }])
            googleMapRef.current.panTo({ lat, lng })
            googleMapRef.current.setZoom(18)
            onClick?.({ lngLat: { lng, lat } })
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
                {/* Geocoder */}
                <Box
                    sx={{
                        width: 250,
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
                    {/* Satellite toggle */}
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

                    <Map
                        defaultCenter={{ lat: 45, lng: 0 }}
                        defaultZoom={3}
                        mapTypeId={satellite ? "satellite" : "roadmap"}
                        mapId={window.GOOGLE_MAPS_MAP_ID}
                        style={{ width: "100%", height: "100%" }}
                        gestureHandling="greedy"
                        disableDefaultUI={true}
                        scaleControl={true}
                    >
                        {/* Markers for HazardViewer pin */}
                        {markers.map((m, i) => (
                            <AdvancedMarkerFallback key={i} position={m} />
                        ))}

                        <MapInteractions
                            hazardMenu={mapInteractionsHazardMenu}
                            onClick={onClick}
                            selectedAssetIndex={selectedAssetIndex}
                            setSelectedAssetIndex={setSelectedAssetIndex}
                            assetData={assetData}
                            assetScores={assetScores}
                            opacity={effectiveOpacity}
                            indexValuesState={tileIndexValues(
                                indexValuesState,
                                indexValuesKey(hazardMenu)
                            )}
                            googleMapRef={googleMapRef}
                            mapViewportRef={mapViewportRef}
                            setPopoverAnchorPos={setPopoverAnchorPos}
                            setMarkers={setMarkers}
                        />
                    </Map>
                </Box>

                {/* Hazard legend */}
                {hazardMenu ? (
                    <Stack
                        sx={{
                            width: 210,
                            backgroundColor: "rgba(255, 255, 255, 1.0)",
                            position: "absolute",
                            bottom: 16,
                            right: 10,
                            zIndex: 1,
                            borderRadius: "4px",
                            boxShadow: "0 0 10px 2px rgba(0,0,0,.2)",
                            justifyContent: "center",
                            alignItems: "center",
                            pt: 1,
                        }}
                        spacing={0}
                    >
                        <Tooltip title="Click on return period/threshold for the options shown on the map, or on the colourbar to customise display. Click a point on the map to view all values.">
                            <IconButton
                                sx={{
                                    p: 0.5,
                                    position: "absolute",
                                    top: -24,
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
                        {hazardMenu?.mapInfo?.compareScenarioId ? (
                            <Typography
                                sx={{
                                    fontSize: 12,
                                    textAlign: "center",
                                    px: 1,
                                }}
                            >
                                {differenceCaption(hazardMenu.mapInfo)}
                            </Typography>
                        ) : null}
                        <HazardIndexSelector
                            indexValues={indexValuesState}
                            indexValuesDispatch={indexValuesDispatch}
                        />
                        <Box sx={{ height: 49, width: 210, p: 0, m: 0.5 }}>
                            <ColourBar
                                colorbarData={colorbarData}
                                colorbarStops={colorbarStops}
                                units={effectiveMapInfo?.colorbar?.units}
                                colormapName={effectiveMapInfo?.colormapName}
                                minValue={effectiveMapInfo?.minValue}
                                maxValue={effectiveMapInfo?.maxValue}
                                colormaps={effectiveMapInfo?.colormaps}
                                colormapMinIndex={
                                    effectiveMapInfo?.colormapMinIndex
                                }
                                colormapMaxIndex={
                                    effectiveMapInfo?.colormapMaxIndex
                                }
                                opacity={effectiveOpacity}
                                scaling={effectiveMapInfo?.scaling}
                                editable={effectiveMapInfo?.source !== "mapbox"}
                                isOverridden={!!colorbarOverride}
                                onChange={setColorbarOverride}
                            />
                        </Box>
                    </Stack>
                ) : (
                    <></>
                )}

                {/* Asset summary popover */}
                {assetSummary ? (
                    <Popover
                        id="mouse-over-popover"
                        sx={{ height: 400 }}
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

// Simple pin marker rendered inside the Map using the legacy Marker via imperative API.
// @vis.gl/react-google-maps AdvancedMarker requires a mapId; this avoids that requirement.
function AdvancedMarkerFallback({ position }) {
    const map = useMap()
    useEffect(() => {
        if (!map || !position) return
        const marker = new window.google.maps.Marker({ position, map })
        return () => marker.setMap(null)
    }, [map, position])
    return null
}
