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
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./src/setupTests.ts"],
    },
})
