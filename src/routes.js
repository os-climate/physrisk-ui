import { React } from "react"
import DashboardIcon from "@mui/icons-material/Dashboard"
import BarChartIcon from "@mui/icons-material/BarChart"
import {
    LocalFireDepartment,
    PrecisionManufacturing,
} from "@mui/icons-material"
import SettingsIcon from "@mui/icons-material/Settings"
import AboutPage from "./views/AboutPage.js"
import AssetViewer from "./views/AssetViewer.js"
import HazardViewer from "./views/HazardViewer.js"
import RiskViewer from "./views/RiskViewer.js"
import Settings from "./views/Settings.js"

/** Provides app routes. Note factory method for component passes 'visible' property,
 * Can be used for transitions from hidden to visible etc and needed for mapbox-gl components
 * which seemingly need resizing once made visible.
 */
export const routes = [
    {
        path: "/hazards",
        name: "Hazard",
        longName: "Hazard indicators",
        icon: LocalFireDepartment,
        component: (visible) => <HazardViewer visible={visible} />,
        layout: "/standard",
        category: "primary",
    },
    {
        path: "/assets",
        name: "Assets",
        longName: "Asset-level analysis",
        icon: PrecisionManufacturing,
        component: (visible) => <AssetViewer visible={visible} />,
        layout: "/standard",
        category: "primary",
    },
    {
        path: "/risk",
        name: "Risk",
        longName: "Risk",
        icon: BarChartIcon,
        component: () => <RiskViewer />,
        layout: "/standard",
        category: "primary",
    },
    {
        path: "/about",
        name: "About",
        longName: "Risk",
        icon: DashboardIcon,
        component: () => <AboutPage />,
        layout: "/standard",
        category: "primary",
    },
    {
        path: "/settings",
        name: "Settings",
        icon: SettingsIcon, //AssignmentIcon,
        component: () => <Settings />, // change to its on page!
        layout: "/standard",
        category: "secondary",
    },
]

export default routes
