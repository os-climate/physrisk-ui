// Provider switcher for the draw-polygon map used in DrawShapeModal.
// Mirrors the same pattern as ScatterMap.jsx.
// Implementation is selected at runtime via mapProvider in GlobalDataContext.

import { useContext } from "react"
import { GlobalDataContext } from "../data/GlobalData"
import GoogleDrawMap from "./GoogleDrawMap.jsx"
import MapboxDrawMap from "./MapboxDrawMap.jsx"

export default function DrawMap(props) {
    const { mapProvider } = useContext(GlobalDataContext)
    return mapProvider === "google" ? (
        <GoogleDrawMap {...props} />
    ) : (
        <MapboxDrawMap {...props} />
    )
}
