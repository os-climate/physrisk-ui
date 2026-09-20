// Map provider switcher.
// All callers import { ScatterMap, mapboxAccessToken } from this file — the
// implementation is selected at runtime via the mapProvider setting in GlobalDataContext.

import { useContext } from "react"
import { GlobalDataContext } from "../data/GlobalData"
import {
    MapboxScatterMap,
    mapboxAccessToken as _mapboxToken,
} from "./MapboxScatterMap.jsx"
import { GoogleScatterMap } from "./GoogleScatterMap.jsx"

// Re-export so existing callers of ScatterMap.jsx keep working unchanged.
export const mapboxAccessToken = _mapboxToken

export function ScatterMap(props) {
    const { mapProvider } = useContext(GlobalDataContext)
    return mapProvider === "google" ? (
        <GoogleScatterMap {...props} />
    ) : (
        <MapboxScatterMap {...props} />
    )
}
