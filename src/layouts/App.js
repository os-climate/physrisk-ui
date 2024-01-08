import * as React from "react"
import { blue, cyan, green, grey, lime, orange, pink, purple, red, teal } from '@mui/material/colors';
import PropTypes from "prop-types"
import { MemoryRouter, useLocation } from "react-router-dom"
import { styled, createTheme, ThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import MuiDrawer from "@mui/material/Drawer"
import Box from "@mui/material/Box"
import MuiAppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar"
import Typography from "@mui/material/Typography"
import IconButton from "@mui/material/IconButton"
import Badge from "@mui/material/Badge"
import Container from "@mui/material/Container"
import Link from "@mui/material/Link"
import MenuIcon from "@mui/icons-material/Menu"
import NotificationsIcon from "@mui/icons-material/Notifications"
import PersonIcon from '@mui/icons-material/Person'
import DrawerContents from "../components/DrawerContents"
import { GlobalDataContextProvider } from "../data/GlobalData"
import routes from "../routes.js"
import LoginDialog from "../components/LoginDialog"

function Copyright(props) {
    return (
        <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            {...props}
        >
            {"Copyright © "}
            <Link color="inherit" href="https://os-climate.org/">
                OS-Climate
            </Link>{" "}
            {new Date().getFullYear()}
            {"."}
        </Typography>
    )
}

const drawerWidth = 175

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== "open",
})(({ theme }) => ({
    [theme.breakpoints.up("sm")]: {
        width: `calc(100% - ${drawerWidth}px)`,
    },
}))

export const themeOptions = {
    palette: {
        primary: {
            light: "#2a6685",
            main: "#2a6685",
        },
        secondary: {
            light: "#b7275b",
            main: "#b7275b",
        },
        success: {
            light: "#409043",
            main: "#409043",
        },
    },
    typography: {
        body: {
            fontSize: 14
        },
        body2: {
            fontSize: 14
        }
    },
    scores: {
        0: grey[400], // no data
        1: green[800], // low
        2: orange[800], // medium
        3: red[700], // high
        4: red[900], // red flag
        other: grey[400] // other
    },
    graphs: {
        0 : pink[800],
        1 : cyan[800],
        2 : purple[900], 
        3 : lime[800],
        4 : teal[900], 
        5 : blue[900] 
    }
}

const appTheme = createTheme(themeOptions)

function Router(props) {
    const { children } = props
    return (
        // can also use BrowserRouter if preferred
        <MemoryRouter initialEntries={["/hazards"]} initialIndex={0}>
            {children}
        </MemoryRouter>
    )
}

function ViewHeader() {
    const location = useLocation()

    const getCurrentPath = () => {
        var route = routes.find((r) => r.path === location.pathname)
        return route === undefined ? "Unknown" : route.longName
    }
    const currentPath = getCurrentPath()
    return <Box sx={{ p: 0 }}>{currentPath}</Box>
}

function ViewPanel(props) {
    const { component, path, ...other } = props

    const [rendered, setRendered] = React.useState(false)

    const location = useLocation()
    const visible = path === location.pathname
    if (visible && !rendered) setRendered(true)

    if (!rendered) return null

    let child
    if (!component) child = null
    else {
        child = component(visible)
    }
    return (
        <Box
            hidden={!visible}
            {...other}
        >
            {child}
        </Box>
    )
}

Router.propTypes = {
    children: PropTypes.node,
}

function AppContent() {
    const [mobileOpen, setMobileOpen] = React.useState(false)
    const [loginOpen, setLoginOpen] = React.useState(false)
    const [open] = React.useState(true)

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen)
    }

    const handleLogin = () => {
        setLoginOpen(!loginOpen)
    }

    const handleLoginClose = () => {
        setLoginOpen(false);
      };

    return (
        <GlobalDataContextProvider>
            <ThemeProvider theme={appTheme}>
                <Box sx={{ display: "flex" }}>
                    <Router>
                        <CssBaseline />
                        <AppBar
                            position="absolute"
                            open={open}
                            elevation={0}
                            border={0}
                            sx={{
                                color: (theme) => theme.palette.grey[800],
                                mr: 0,
                                backgroundColor: (theme) =>
                                    theme.palette.mode === "light"
                                        ? theme.palette.grey[100]
                                        : theme.palette.grey[900],
                            }}
                        >
                            <Toolbar>
                                <Typography
                                    component="h1"
                                    variant="h6"
                                    color="inherit"
                                    noWrap
                                    sx={{ flexGrow: 1 }}
                                >
                                    <ViewHeader />
                                </Typography>
                                <IconButton color="inherit"
                                    onClick={handleLogin}>
                                    <Badge color="secondary">
                                        <PersonIcon />
                                    </Badge>
                                </IconButton>
                                <IconButton color="inherit" sx={{ ml: 0 }}>
                                    <Badge badgeContent={0} color="secondary">
                                        <NotificationsIcon />
                                    </Badge>
                                </IconButton>
                                <IconButton
                                    color="inherit"
                                    aria-label="open drawer"
                                    edge="start"
                                    onClick={handleDrawerToggle}
                                    sx={{ ml: 0, display: { sm: "none" } }}
                                >
                                    <MenuIcon />
                                </IconButton>
                            </Toolbar>
                        </AppBar>
                        <Box
                            component="nav"
                            sx={{
                                width: { sm: drawerWidth },
                                flexShrink: { sm: 0 },
                            }}
                            aria-label="mailbox folders"
                        >
                            <MuiDrawer // the small screen drawer
                                sx={{
                                    width: drawerWidth,
                                    height: "100vh",
                                    flexShrink: 0,

                                    display: { xs: "block", sm: "none" },
                                    "& .MuiDrawer-paper": {
                                        boxSizing: "border-box",
                                        width: drawerWidth,
                                    },
                                }}
                                anchor="right"
                                variant="temporary"
                                onClose={handleDrawerToggle}
                                ModalProps={{
                                    keepMounted: true, // Better open performance on mobile.
                                }}
                                open={mobileOpen}
                            >
                                <DrawerContents routes={routes} />
                            </MuiDrawer>
                            <MuiDrawer // the large screen drawer
                                sx={{
                                    width: drawerWidth,
                                    height: "100%",
                                    flexShrink: 0,
                                    display: { xs: "none", sm: "block" },
                                    "& .MuiDrawer-paper": {
                                        width: drawerWidth,
                                    },
                                }}
                                variant="permanent"
                                anchor={"left"}
                                open={open}
                            >
                                <DrawerContents routes={routes} />
                            </MuiDrawer>
                        </Box>
                        <Box
                            component="main"
                            sx={{
                                backgroundColor: (theme) =>
                                    theme.palette.mode === "light"
                                        ? theme.palette.grey[100]
                                        : theme.palette.grey[900],
                                flexGrow: 1,
                                m: 0,
                                p: 0,
                                minHeight: "100vh",
                                width: `calc(100% - ${drawerWidth}px)`
                            }}
                        >
                            <Toolbar />
                            <LoginDialog open={loginOpen} handleClose={handleLoginClose} fullScreen={false}></LoginDialog>
                            <Container maxWidth={false} sx={{ mt: 0, mb: 4, pl: 1, pr: 1 }} disableGutters>
                                {/* Could have used <Routes> and <Route>, but we do not want the remounting */}
                                {routes.map((prop, key) => {
                                    return (
                                        <ViewPanel
                                            component={prop.component}
                                            path={prop.path}
                                            key={key}
                                        />
                                    )
                                })}
                                <Copyright sx={{ pt: 4 }} />
                            </Container>
                        </Box>
                    </Router>
                </Box>
            </ThemeProvider>
        </GlobalDataContextProvider>
    )
}

export default function App() {
    return <AppContent />
}
