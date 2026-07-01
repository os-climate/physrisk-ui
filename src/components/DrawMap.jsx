// Provider switcher for the draw-polygon map used in DrawShapeModal.
// Mirrors the same pattern as ScatterMap.jsx.
// All callers import DrawMap from this file; the implementation is
// selected via MAP_PROVIDER in src/config.js.

import { MAP_PROVIDER } from "../config.js"
import GoogleDrawMap from "./GoogleDrawMap.jsx"
import MapboxDrawMap from "./MapboxDrawMap.jsx"

export default function DrawMap(props) {
    return MAP_PROVIDER === "google" ? (
        <GoogleDrawMap {...props} />
    ) : (
        <MapboxDrawMap {...props} />
    )
}
