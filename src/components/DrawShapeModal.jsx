import React, { useCallback, useEffect, useRef, useState } from "react"
import Button from "@mui/material/Button"
import Box from "@mui/material/Box"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { Map, MapProvider, useControl } from "react-map-gl"
import MapboxDraw from "@mapbox/mapbox-gl-draw"
import { mapboxAccessToken } from "./ScatterMap.jsx"
import { geojsonToWkt, wktToGeojson } from "../utils/wkt.js"

// Wraps MapboxDraw as a react-map-gl control. Must be rendered inside <Map>.
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
            const emitChange = () => {
                onFeaturesChange(drawRef.current?.getAll()?.features ?? [])
            }
            const onCreate = (e) => {
                // Enforce single shape: delete all previously drawn features
                const existingIds = (drawRef.current?.getAll()?.features ?? [])
                    .filter((f) => !e.features.some((n) => n.id === f.id))
                    .map((f) => f.id)
                if (existingIds.length) drawRef.current.delete(existingIds)
                emitChange()
            }
            map.on("draw.create", onCreate)
            map.on("draw.update", emitChange)
            map.on("draw.delete", emitChange)
        },
        () => {},
        { position: "top-left" }
    )
    return null
}

export default function DrawShapeModal({
    open,
    onClose,
    onConfirm,
    initialWkt,
    centerLngLat,
}) {
    const drawRef = useRef(null)
    const [wkt, setWkt] = useState("")
    const [wktError, setWktError] = useState("")

    useEffect(() => {
        if (open) {
            setWkt(initialWkt ?? "")
            setWktError("")
        }
    }, [open, initialWkt])

    const handleFeaturesChange = useCallback((features) => {
        if (features.length === 0) {
            setWkt("")
            return
        }
        const wktStr = geojsonToWkt(features[0].geometry)
        setWkt(wktStr)
    }, [])

    // Load existing WKT into the draw control after the map and control are ready
    const handleMapLoad = useCallback(() => {
        if (drawRef.current && initialWkt) {
            const geojson = wktToGeojson(initialWkt)
            if (geojson) {
                drawRef.current.deleteAll()
                drawRef.current.add({ type: "Feature", geometry: geojson, properties: {} })
            }
        }
    }, [initialWkt])

    const handleWktTextChange = (e) => {
        const val = e.target.value
        setWkt(val)
        if (!val.trim()) {
            drawRef.current?.deleteAll()
            setWktError("")
            return
        }
        const geojson = wktToGeojson(val)
        if (geojson && drawRef.current) {
            drawRef.current.deleteAll()
            drawRef.current.add({ type: "Feature", geometry: geojson, properties: {} })
            setWktError("")
        } else {
            setWktError("Invalid WKT — accepted types: POINT, LINESTRING, POLYGON, MULTIPOLYGON")
        }
    }

    const handleClear = () => {
        drawRef.current?.deleteAll()
        setWkt("")
        setWktError("")
    }

    const handleConfirm = () => {
        onConfirm(wkt || null)
        onClose()
    }

    const [centerLng, centerLat] = centerLngLat ?? [0, 20]

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Draw Shape</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Use the polygon tool (top-left of map) to draw a shape. You can also
                    type or paste WKT directly into the field below.
                </Typography>
                <Box sx={{ height: 420, borderRadius: 1, overflow: "hidden" }}>
                    {open && (
                        <MapProvider>
                            <Map
                                mapboxAccessToken={mapboxAccessToken}
                                mapStyle="mapbox://styles/mapbox/streets-v11"
                                initialViewState={{
                                    longitude: centerLng,
                                    latitude: centerLat,
                                    zoom: centerLngLat ? 8 : 2,
                                }}
                                style={{ width: "100%", height: "100%" }}
                                onLoad={handleMapLoad}
                            >
                                <DrawControl
                                    drawRef={drawRef}
                                    onFeaturesChange={handleFeaturesChange}
                                />
                            </Map>
                        </MapProvider>
                    )}
                </Box>
                <TextField
                    label="WKT geometry"
                    value={wkt}
                    onChange={handleWktTextChange}
                    error={!!wktError}
                    helperText={wktError || "Reflects the drawn shape; edit here to modify directly"}
                    fullWidth
                    multiline
                    rows={3}
                    sx={{ mt: 2 }}
                    inputProps={{ style: { fontFamily: "monospace", fontSize: "0.8rem" } }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClear} color="warning">
                    Clear
                </Button>
                <Box sx={{ flex: 1 }} />
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleConfirm} variant="contained" disabled={!!wktError}>
                    Apply
                </Button>
            </DialogActions>
        </Dialog>
    )
}
