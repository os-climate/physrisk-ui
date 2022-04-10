import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import { LocalFireDepartment, PrecisionManufacturing } from '@mui/icons-material';
import AboutPage from "./views/AboutPage.js";
import AssetViewer from "./views/AssetViewer.js";
import HazardViewer from "./views/HazardViewer.js";
import RiskViewer from "./views/RiskViewer.js";

const dashboardRoutes = [
    {
        path: "/hazards",
        name: "Hazards",
        icon: LocalFireDepartment,
        component: HazardViewer,
        layout: "/standard",
    },
    {
        path: "/assets",
        name: "Assets",
        icon: PrecisionManufacturing,
        component: AssetViewer,
        layout: "/standard",
    },
    {
        path: "/risk",
        name: "Risk",
        icon: BarChartIcon,
        component: RiskViewer,
        layout: "/standard",
    },
    {
        path: "/about",
        name: "About",
        icon: DashboardIcon,
        component: AboutPage,
        layout: "/standard",
    },

  ];
  
  export default dashboardRoutes;