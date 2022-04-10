import * as React from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter, MemoryRouter, useLocation} from "react-router-dom";
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DrawerContents from '../components/DrawerContents';
import routes from "../routes.js";
import ScatterMap from "../components/ScatterMap";

function Copyright(props) {
  return (
    <Typography variant="body2" color="text.secondary" align="center" {...props}>
      {'Copyright © '}
      <Link color="inherit" href="https://os-climate.org/">
        OS-Climate
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const drawerWidth = 230;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
  })
  (({ theme, open }) => 
    ({
      [theme.breakpoints.up("sm")]: {
        width: `calc(100% - ${drawerWidth}px)`,
      }
    }),
  )

export const themeOptions = {
  palette: {
    primary: {
      light: '#2a6685', 
      main: '#2a6685',
    },
    secondary: {
      light: '#b7275b',
      main: '#b7275b',
    },
    success: {
      light: '#409043',
      main: '#409043',
    },
  },
};

const appTheme = createTheme(themeOptions);

function Router(props) {
  const { children } = props;
  return (
    <MemoryRouter initialEntries={['/hazards']} initialIndex={0}> 
      {children}
    </MemoryRouter>
  );
}
// to consider?
// if (typeof window === 'undefined') {
//   return <StaticRouter location="/hazards">{children}</StaticRouter>;
// }

// return (
//   <MemoryRouter initialEntries={['/hazards']} initialIndex={0}>
//     {children}
//   </MemoryRouter>
// );

function ViewHeader() {
  const useCurrentPath = () => {
    //const location = useLocation()
    var route = routes.find(r => r.path === '/hazards')//location.pathname)
    return (route === undefined) ? "Unknown" : route.name
  }
  const currentPath = useCurrentPath() 
  return (
    <div>
      {currentPath}
    </div>
  );
}

function ViewPanel(props) {
  const { children, path, ...other } = props;

  const [rendered, setRendered] = React.useState(false);

  //const location = useLocation()
  const visible = (path === '/hazards')//location.pathname)
  if (visible && !rendered) setRendered(true)
  
  if (!rendered)
      return null;
  return (
    <Box
      sx={{display: visible ? 'block' : 'none' }}
      //hidden={path !== location.pathname}
      {...other}
    >
       {children}
    </Box>
  );
}

Router.propTypes = {
  children: PropTypes.node,
};

function AppContent() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [open] = React.useState(true);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <ThemeProvider theme={appTheme}>
      <Box sx={{ display: 'flex' }}>
        {/* <Router> */}
        <CssBaseline />
        <AppBar position="absolute" open={open}  elevation={0} border={0} sx={{
            color: (theme) => theme.palette.grey[800],
            backgroundColor: (theme) =>
              theme.palette.mode === 'light'
                ? theme.palette.grey[100]
                : theme.palette.grey[900]}}>  
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
            <IconButton color="inherit">
              <Badge badgeContent={4} color="secondary">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' }, pl: '24px' }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <MuiDrawer // the small screen drawer
          sx={{
             width: drawerWidth,
             height: '100vh',
             flexShrink: 0,
             
             display: { xs: 'block', sm: 'none' },
               '& .MuiDrawer-paper': {
                   boxSizing: 'border-box',
                   width: drawerWidth },
          }}
          anchor='right'
          variant='temporary'
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
            height: '100%',
            flexShrink: 0,
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
                width: drawerWidth },
          }}
          variant='permanent'
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
              theme.palette.mode === 'light'
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <Toolbar />
          <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {/* Could have used <Routes> and <Route>, but we do not want the remounting */}
            {/* {routes.map((prop, key) => {
                return (
                  <ViewPanel path={prop.path} key={key} >
                    {prop.component()}
                  </ViewPanel>
                );
            })}  */}
               <ScatterMap/ >
            <Copyright sx={{ pt: 4 }} />
          </Container>
        </Box>
      {/* </Router> */}
      </Box>
    </ThemeProvider>
  );
}

export default function App() {
  return <AppContent />;
}
