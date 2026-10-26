// Runtime configuration — overwrite this file at deployment time.
// No rebuild required.

window.BASE_API            = "https://physrisk.com"

// Map provider: "mapbox" | "google"
window.MAP_PROVIDER        = "mapbox"

// Mapbox — only required when MAP_PROVIDER is "mapbox"
window.MAPBOX_ACCESS_TOKEN = "<mapbox_api_key>"

// Google Maps — only required when MAP_PROVIDER is "google"
window.GOOGLE_MAPS_API_KEY = "<google_api_key>"

// Map ID enables the vector renderer for interleaved deck.gl overlays.
// "DEMO_MAP_ID" works for development; create a real Map ID in Google Cloud Console for production.
window.GOOGLE_MAPS_MAP_ID  = "<map_id>"
