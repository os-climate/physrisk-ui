import * as React from 'react';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { mainListItems, secondaryListItems } from './listItems';
import Chart from './Chart';
import ScatterMap from './ScatterMap';
import Summary from './Summary';
import AssetTable from './AssetTable';
import logo from "../assets/img/OscLogoWhite.png";

//https://unsplash.com/photos/rxlx9Yi0298?utm_source=unsplash&utm_medium=referral&utm_content=creditShareLink
import bgImage from "../assets/img/noaa-rxlx9Yi0298-unsplash.jpg"; 


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

const StyledDivider = styled(Divider)`
  opacity: 0.3;
  z-index: 2;
  background-color: #FFF;
`;

const StyledDiv = styled('div')(
  ({ theme }) => ({
    elevation: 0,
    border: 0,
    zIndex: 0,
    position: 'absolute',
    whiteSpace: 'nowrap',
    top: '0',
    left: '0',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    backgroundImage: "url(" + bgImage + ")",
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    '&:after': {
      elevation: 0,  
      border: 0,
      zIndex: 0,
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      overflow: "hidden",
      whiteSpace: 'nowrap',
      zIndex: 0,
      content: '""',
      display: 'flex',
      background: '#000',
      opacity: '0.8'
    },
  })
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

const mdTheme = createTheme(themeOptions);

function AppContent() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [open, setOpen] = React.useState(true);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer =
  (
    <Box sx={{ zIndex: 5 }}>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: [1],
        }}
      >
        <img src={logo} alt="logo" width="104" height="64" /> 
      </Toolbar>
      <StyledDivider />
      <List>{mainListItems}</List>
      <StyledDivider />
      <List>{secondaryListItems}</List>
    </Box>
  );

  return (
    <ThemeProvider theme={mdTheme}>
      <Box sx={{ display: 'flex' }}>
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
              Dashboard
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
          
          <Box sx={{ overflow: "scroll" }} >
            <StyledDiv />
            {drawer}
          </Box>

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
          <Box sx = {{ overflow: 'scroll' }}>
            <StyledDiv />
            {drawer}
          </Box>
 
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
            
            <Grid container spacing={3}>
              {/* Map */}
              <Grid item xs={12} md={12} lg={12}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <ScatterMap />
                </Paper>
              </Grid>
              <Grid item xs={12} md={8} lg={9}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 240,
                  }}
                >
                  <Chart />
                </Paper>
              </Grid>
              {/* Summary */}
              <Grid item xs={12} md={4} lg={3}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 240,
                  }}
                >
                  <Summary />
                </Paper>
              </Grid>
              {/* Asset table */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                  <AssetTable />
                </Paper>
              </Grid>
            </Grid>
            <Copyright sx={{ pt: 4 }} />
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default function App() {
  return <AppContent />;
}
