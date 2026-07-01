// Map provider switcher.
// All callers import { ScatterMap, mapboxAccessToken } from this file — the
// implementation is selected via MAP_PROVIDER in src/config.js.

import { MAP_PROVIDER } from "../config.js"
import { MapboxScatterMap, mapboxAccessToken as _mapboxToken } from "./MapboxScatterMap.jsx"
import { GoogleScatterMap } from "./GoogleScatterMap.jsx"

// Re-export so existing callers of ScatterMap.jsx keep working unchanged.
export const mapboxAccessToken = _mapboxToken

export function ScatterMap(props) {
    return MAP_PROVIDER === "google" ? (
        <GoogleScatterMap {...props} />
    ) : (
        <MapboxScatterMap {...props} />
    )
}
