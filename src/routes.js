import AssignmentIcon from '@mui/icons-material/Assignment';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import { LocalFireDepartment, PrecisionManufacturing } from '@mui/icons-material';
import AboutPage from "./views/AboutPage.js";
import AssetViewer from "./views/AssetViewer.js";
import HazardViewer from "./views/HazardViewer.js";
import RiskViewer from "./views/RiskViewer.js";

export const routes = [
    {
        path: "/hazards",
        name: "Hazards",
        icon: LocalFireDepartment,
        component: HazardViewer,
        layout: "/standard",
        category: "primary"
    },
    {
        path: "/assets",
        name: "Assets",
        icon: PrecisionManufacturing,
        component: AssetViewer,
        layout: "/standard",
        category: "primary"
    },
    {
        path: "/risk",
        name: "Risk",
        icon: BarChartIcon,
        component: RiskViewer,
        layout: "/standard",
        category: "primary"
    },
    {
        path: "/about",
        name: "About",
        icon: DashboardIcon,
        component: AboutPage,
        layout: "/standard",
        category: "primary"
    },
    {
        path: "/savedResults",
        name: "Saved results",
        icon: AssignmentIcon,
        component: AboutPage, // change to its on page!
        layout: "/standard",
        category: "secondary"
    }
];
  
export default routes;
