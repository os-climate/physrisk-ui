// Map provider selection. Switch to "google" to use Google Maps instead of Mapbox.
export const MAP_PROVIDER = "google" // "mapbox" | "google"

// Google Maps JavaScript API key — only required when MAP_PROVIDER is "google".
export const GOOGLE_MAPS_API_KEY = "<api_key>"

// Map ID enables the vector renderer required for interleaved deck.gl overlays
// (labels and markers appear above the hazard layer).
// "DEMO_MAP_ID" works for development; create a real Map ID in Google Cloud Console for production.
export const GOOGLE_MAPS_MAP_ID = "<map_id>"
