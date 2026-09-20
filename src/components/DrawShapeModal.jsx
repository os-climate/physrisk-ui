import React, { useCallback, useContext, useEffect, useRef, useState } from "react"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { GlobalDataContext } from "../data/GlobalData"
import { wktToGeojson } from "../utils/wkt.js"
import DrawMap from "./DrawMap.jsx"

export default function DrawShapeModal({
    open,
    onClose,
    onConfirm,
    initialWkt,
    centerLngLat,
    initialZoom,
}) {
    // Populated by whichever DrawMap is active; exposes { clear(), updateFromWkt(wkt) }.
    const { mapProvider } = useContext(GlobalDataContext)
    const mapControlRef = useRef(null)
    const [wkt, setWkt] = useState("")
    const [wktError, setWktError] = useState("")

    useEffect(() => {
        if (open) {
            setWkt(initialWkt ?? "")
            setWktError("")
        }
    }, [open, initialWkt])

    // Called by the map component when the user draws or edits a shape.
    const handleMapWktChange = useCallback((newWkt) => {
        setWkt(newWkt)
        setWktError("")
    }, [])

    // Called when the user edits the WKT text field directly.
    const handleWktTextChange = (e) => {
        const val = e.target.value
        setWkt(val)
        if (!val.trim()) {
            mapControlRef.current?.clear()
            setWktError("")
            return
        }
        const geojson = wktToGeojson(val)
        if (geojson) {
            mapControlRef.current?.updateFromWkt(val)
            setWktError("")
        } else {
            setWktError(
                "Invalid WKT — accepted types: POINT, LINESTRING, POLYGON, MULTIPOLYGON"
            )
        }
    }

    const handleClear = () => {
        mapControlRef.current?.clear()
        setWkt("")
        setWktError("")
    }

    const handleFinish = () => {
        mapControlRef.current?.finish()
    }

    const handleConfirm = () => {
        onConfirm(wkt || null)
        onClose()
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
            <DialogTitle>Draw Shape</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {mapProvider === "google"
                        ? "Click on the map to add points, then press Finish to close the shape. You can also type or paste WKT directly into the field below."
                        : "Use the polygon tool (top-left of map) to draw a shape. You can also type or paste WKT directly into the field below."}
                </Typography>
                <Box sx={{ height: 420, borderRadius: 1, overflow: "hidden" }}>
                    {open && (
                        <DrawMap
                            centerLngLat={centerLngLat}
                            initialZoom={initialZoom}
                            initialWkt={initialWkt}
                            onWktChange={handleMapWktChange}
                            mapControlRef={mapControlRef}
                        />
                    )}
                </Box>
                <TextField
                    label="WKT geometry"
                    value={wkt}
                    onChange={handleWktTextChange}
                    error={!!wktError}
                    helperText={
                        wktError ||
                        "Reflects the drawn shape; edit here to modify directly"
                    }
                    fullWidth
                    multiline
                    rows={3}
                    sx={{ mt: 2 }}
                    inputProps={{
                        style: { fontFamily: "monospace", fontSize: "0.8rem" },
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClear} color="warning">
                    Clear
                </Button>
                {mapProvider === "google" && (
                    <Button onClick={handleFinish} variant="outlined">
                        Finish
                    </Button>
                )}
                <Box sx={{ flex: 1 }} />
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    disabled={!!wktError}
                >
                    Apply
                </Button>
            </DialogActions>
        </Dialog>
    )
}
