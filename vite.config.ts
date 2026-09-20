import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { createRequire } from "module"

const require = createRequire(import.meta.url)
const mathjaxVersion = require("mathjax-full/package.json").version

export default defineConfig({
    define: {
        PACKAGE_VERSION: JSON.stringify(mathjaxVersion),
    },
    plugins: [
        react({
            babel: {
                plugins: ["@emotion/babel-plugin"],
            },
        }),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (id.includes("/node_modules/")) {
                        if (
                            id.includes("/mapbox-gl/") ||
                            id.includes("/react-map-gl/") ||
                            id.includes("/@mapbox/mapbox-gl-draw/")
                        ) return "vendor-mapbox"
                        if (
                            id.includes("/@deck.gl/") ||
                            id.includes("/@luma.gl/") ||
                            id.includes("/@loaders.gl/")
                        ) return "vendor-deck"
                        if (id.includes("/@vis.gl/")) return "vendor-google-maps"
                        if (id.includes("/mathjax-full/")) return "vendor-mathjax"
                        if (
                            id.includes("/@mui/material/") ||
                            id.includes("/@mui/icons-material/") ||
                            id.includes("/@mui/system/") ||
                            id.includes("/@mui/base/") ||
                            id.includes("/@emotion/")
                        ) return "vendor-mui"
                        if (
                            id.includes("/react-dom/") ||
                            id.includes("/react/") ||
                            id.includes("/react-router")
                        ) return "vendor-react"
                    }
                },
            },
        },
    },
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./src/setupTests.ts"],
    },
})
