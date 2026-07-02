import { useCallback, useEffect, useRef } from "react"
import { Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps"
import { geojsonToWkt, wktToGeojson } from "../utils/wkt.js"

// google.maps.drawing.DrawingManager is deprecated (Aug 2025) and removed,
// so polygons are drawn manually: click to add vertices, press Finish to close.
// SymbolPath.CIRCLE and Marker live in separate library partitions from "maps";
// access them via the global namespace which is always populated once the API loads.
const VERTEX_ICON = {
    fillColor: "#1976d2",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 5,
}

const makeVertexIcon = () => ({
    ...VERTEX_ICON,
    path: window.google.maps.SymbolPath.CIRCLE,
})

function DrawingControl({ initialWkt, onWktChange, mapControlRef }) {
    const map = useMap()
    const mapsLib = useMapsLibrary("maps")
    const overlayRef = useRef(null)
    const pathRef = useRef([])
    const drawingRef = useRef(false)
    const markersRef = useRef([])

    // Keep live refs so imperative methods always see the latest map/lib.
    const mapRef = useRef(null)
    const mapsLibRef = useRef(null)
    useEffect(() => { mapRef.current = map }, [map])
    useEffect(() => { mapsLibRef.current = mapsLib }, [mapsLib])

    const clearMarkers = useCallback(() => {
        markersRef.current.forEach((m) => m.setMap(null))
        markersRef.current = []
    }, [])

    const addVertexMarker = useCallback((m, latLng) => {
        markersRef.current.push(
            new window.google.maps.Marker({
                position: latLng,
                map: m,
                icon: makeVertexIcon(),
                clickable: false,
            })
        )
    }, [])

    const attachPathListeners = useCallback(
        (polygon) => {
            const extractWkt = () => {
                const coords = polygon.getPath().getArray().map((p) => [p.lng(), p.lat()])
                coords.push(coords[0]) // close ring
                return geojsonToWkt({ type: "Polygon", coordinates: [coords] })
            }
            polygon.getPath().addListener("set_at", () => onWktChange(extractWkt()))
            polygon.getPath().addListener("insert_at", () => onWktChange(extractWkt()))
        },
        [onWktChange]
    )

    const createPolygonFromGeojson = useCallback(
        (geojson, m, ml) => {
            if (geojson?.type !== "Polygon" || !m || !ml) return null
            const paths = geojson.coordinates[0].map(([lng, lat]) => ({ lat, lng }))
            const polygon = new ml.Polygon({ paths, editable: true, map: m })
            attachPathListeners(polygon)
            return polygon
        },
        [attachPathListeners]
    )

    const startDrawing = useCallback((m, ml) => {
        drawingRef.current = true
        pathRef.current = []
        overlayRef.current = new ml.Polygon({ paths: [], editable: false, clickable: false, map: m })
    }, [])

    const finishDrawing = useCallback(
        () => {
            if (!drawingRef.current || pathRef.current.length < 3) return
            drawingRef.current = false
            clearMarkers()
            const polygon = overlayRef.current
            if (!polygon) return
            polygon.setOptions({ editable: true })
            attachPathListeners(polygon)
            const coords = polygon.getPath().getArray().map((p) => [p.lng(), p.lat()])
            coords.push(coords[0])
            onWktChange(geojsonToWkt({ type: "Polygon", coordinates: [coords] }))
        },
        [attachPathListeners, onWktChange, clearMarkers]
    )

    // Expose imperative controls to the parent modal.
    useEffect(() => {
        mapControlRef.current = {
            clear: () => {
                clearMarkers()
                overlayRef.current?.setMap(null)
                overlayRef.current = null
                if (mapRef.current && mapsLibRef.current) {
                    startDrawing(mapRef.current, mapsLibRef.current)
                }
            },
            finish: () => finishDrawing(),
            updateFromWkt: (wkt) => {
                clearMarkers()
                overlayRef.current?.setMap(null)
                overlayRef.current = null
                drawingRef.current = false
                const geojson = wktToGeojson(wkt)
                const polygon = createPolygonFromGeojson(
                    geojson,
                    mapRef.current,
                    mapsLibRef.current
                )
                overlayRef.current = polygon
            },
        }
    }, [mapControlRef, createPolygonFromGeojson, startDrawing, finishDrawing, clearMarkers])

    // Initialise once the map and lib are ready.
    useEffect(() => {
        if (!mapsLib || !map) return

        // Pre-load any existing WKT geometry; otherwise start in draw mode.
        if (initialWkt) {
            const geojson = wktToGeojson(initialWkt)
            const polygon = createPolygonFromGeojson(geojson, map, mapsLib)
            if (polygon) {
                overlayRef.current = polygon
                // Zoom to fit the polygon, capped at zoom 18.
                const bounds = new window.google.maps.LatLngBounds()
                polygon.getPath().getArray().forEach((p) => bounds.extend(p))
                if (!bounds.isEmpty()) {
                    map.fitBounds(bounds, 60)
                    const idleListener = map.addListener("idle", () => {
                        idleListener.remove()
                        if (map.getZoom() > 18) map.setZoom(18)
                    })
                }
            }
        } else {
            startDrawing(map, mapsLib)
        }

        const clickListener = map.addListener("click", (e) => {
            if (!drawingRef.current || !overlayRef.current) return
            pathRef.current.push(e.latLng)
            overlayRef.current.setPath(pathRef.current)
            addVertexMarker(map, e.latLng)
        })

        return () => {
            clickListener.remove()
            markersRef.current.forEach((m) => m.setMap(null))
            markersRef.current = []
            overlayRef.current?.setMap(null)
            overlayRef.current = null
        }
    }, [mapsLib, map]) // eslint-disable-line react-hooks/exhaustive-deps

    return null
}

export default function GoogleDrawMap({
    centerLngLat,
    initialZoom,
    initialWkt,
    onWktChange,
    mapControlRef,
}) {
    const [lng, lat] = centerLngLat ?? [0, 20]

    return (
        <Map
            defaultCenter={{ lat, lng }}
            defaultZoom={initialZoom ?? (centerLngLat ? 8 : 2)}
            style={{ width: "100%", height: "100%" }}
            gestureHandling="greedy"
            renderingType="RASTER"
        >
            <DrawingControl
                initialWkt={initialWkt}
                onWktChange={onWktChange}
                mapControlRef={mapControlRef}
            />
        </Map>
    )
}
