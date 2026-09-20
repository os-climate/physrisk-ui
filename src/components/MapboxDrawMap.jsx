import { useCallback, useEffect, useRef, useState } from "react"
import { Map, MapProvider, Marker, useControl } from "react-map-gl"
import Box from "@mui/material/Box"
import IconButton from "@mui/material/IconButton"
import Tooltip from "@mui/material/Tooltip"
import { SatelliteAlt, Map as MapIcon } from "@mui/icons-material"
import MapboxDraw from "@mapbox/mapbox-gl-draw"
import Geocoder from "./Geocoder.tsx"
import { mapboxAccessToken } from "./ScatterMap.jsx"
import { geojsonToWkt, wktToGeojson } from "../utils/wkt.js"

// Draw tools at bottom-left to avoid overlap with the satellite toggle at top-left.
function DrawControl({ drawRef, onFeaturesChange }) {
    useControl(
        () => {
            const draw = new MapboxDraw({
                displayControlsDefault: false,
                controls: { polygon: true, trash: true },
            })
            drawRef.current = draw
            return draw
        },
        ({ map }) => {
            const emitChange = () =>
                onFeaturesChange(drawRef.current?.getAll()?.features ?? [])

            const onCreate = (e) => {
                const staleIds = (drawRef.current?.getAll()?.features ?? [])
                    .filter((f) => !e.features.some((n) => n.id === f.id))
                    .map((f) => f.id)
                if (staleIds.length) drawRef.current.delete(staleIds)
                emitChange()
            }

            map.on("draw.create", onCreate)
            map.on("draw.update", emitChange)
            map.on("draw.delete", emitChange)
        },
        () => {},
        { position: "bottom-left" }
    )
    return null
}

function collectCoords(coords) {
    if (!Array.isArray(coords[0])) return [coords]
    if (typeof coords[0][0] === "number") return coords
    return coords.flatMap(collectCoords)
}

function fitToGeojson(mapRef, geojson) {
    if (!geojson || !mapRef.current) return
    const coords = collectCoords(geojson.coordinates)
    if (!coords.length) return
    const lngs = coords.map((c) => c[0])
    const lats = coords.map((c) => c[1])
    mapRef.current.fitBounds(
        [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: 60, maxZoom: 18, duration: 500 }
    )
}

export default function MapboxDrawMap({
    centerLngLat,
    initialZoom,
    initialWkt,
    onWktChange,
    mapControlRef,
}) {
    const drawRef = useRef(null)
    const mapRef = useRef(null)
    const [geocoderPin, setGeocoderPin] = useState(null)
    const [satellite, setSatellite] = useState(false)

    useEffect(() => {
        mapControlRef.current = {
            clear: () => {
                drawRef.current?.deleteAll()
                setGeocoderPin(null)
            },
            updateFromWkt: (wkt) => {
                if (!drawRef.current) return
                const geojson = wktToGeojson(wkt)
                if (geojson) {
                    drawRef.current.deleteAll()
                    drawRef.current.add({
                        type: "Feature",
                        geometry: geojson,
                        properties: {},
                    })
                    fitToGeojson(mapRef, geojson)
                    setGeocoderPin(null)
                }
            },
        }
    }, [mapControlRef])

    const handleFeaturesChange = useCallback(
        (features) => {
            if (features.length === 0) {
                onWktChange("")
                return
            }
            setGeocoderPin(null)
            onWktChange(geojsonToWkt(features[0].geometry))
        },
        [onWktChange]
    )

    const handleMapLoad = useCallback(() => {
        if (!drawRef.current || !initialWkt) return
        const geojson = wktToGeojson(initialWkt)
        if (geojson) {
            drawRef.current.deleteAll()
            drawRef.current.add({
                type: "Feature",
                geometry: geojson,
                properties: {},
            })
            fitToGeojson(mapRef, geojson)
        }
    }, [initialWkt])

    const handleGeocoderSelect = (result) => {
        if (!result || !mapRef.current) return
        const [lng, lat] = result.feature.center
        mapRef.current.flyTo({ center: [lng, lat], zoom: 18, duration: 800 })
        setGeocoderPin({ lng, lat })
    }

    const [centerLng, centerLat] = centerLngLat ?? [0, 20]

    return (
        <MapProvider>
            <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
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
                            zIndex: 10,
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

                {/* Geocoder */}
                <Box
                    sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        zIndex: 10,
                        width: 240,
                        bgcolor: "background.paper",
                        borderRadius: 1,
                        boxShadow: 2,
                        px: 1,
                    }}
                >
                    <Geocoder
                        apiKey={mapboxAccessToken}
                        onSelect={handleGeocoderSelect}
                    />
                </Box>

                <Map
                    ref={mapRef}
                    mapboxAccessToken={mapboxAccessToken}
                    mapStyle={
                        satellite
                            ? "mapbox://styles/mapbox/satellite-streets-v12"
                            : "mapbox://styles/mapbox/streets-v11"
                    }
                    initialViewState={{
                        longitude: centerLng,
                        latitude: centerLat,
                        zoom: initialZoom ?? (centerLngLat ? 8 : 2),
                    }}
                    style={{ width: "100%", height: "100%" }}
                    onLoad={handleMapLoad}
                >
                    <DrawControl
                        drawRef={drawRef}
                        onFeaturesChange={handleFeaturesChange}
                    />
                    {geocoderPin && (
                        <Marker
                            longitude={geocoderPin.lng}
                            latitude={geocoderPin.lat}
                        />
                    )}
                </Map>
            </Box>
        </MapProvider>
    )
}
