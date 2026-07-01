import { useCallback, useEffect, useRef } from "react"
import { Map, MapProvider, useControl } from "react-map-gl"
import MapboxDraw from "@mapbox/mapbox-gl-draw"
import { mapboxAccessToken } from "./ScatterMap.jsx"
import { geojsonToWkt, wktToGeojson } from "../utils/wkt.js"

// Wraps MapboxDraw as a react-map-gl control. Must render inside <Map>.
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
                // Enforce single shape: remove previously drawn features.
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
        { position: "top-left" }
    )
    return null
}

export default function MapboxDrawMap({
    centerLngLat,
    initialWkt,
    onWktChange,
    mapControlRef,
}) {
    const drawRef = useRef(null)

    // Expose imperative controls to the parent modal.
    useEffect(() => {
        mapControlRef.current = {
            clear: () => drawRef.current?.deleteAll(),
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
            onWktChange(geojsonToWkt(features[0].geometry))
        },
        [onWktChange]
    )

    const handleMapLoad = useCallback(() => {
        if (drawRef.current && initialWkt) {
            const geojson = wktToGeojson(initialWkt)
            if (geojson) {
                drawRef.current.deleteAll()
                drawRef.current.add({
                    type: "Feature",
                    geometry: geojson,
                    properties: {},
                })
            }
        }
    }, [initialWkt])

    const [centerLng, centerLat] = centerLngLat ?? [0, 20]

    return (
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
    )
}
