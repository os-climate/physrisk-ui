import { styled } from '@mui/material/styles';
import { secondaryListItems } from '../components/ListItems';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import { ListItemLink } from "../components/ListItems"
import logo from "../assets/img/OscLogoWhite.png";
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
//https://unsplash.com/photos/rxlx9Yi0298?utm_source=unsplash&utm_medium=referral&utm_content=creditShareLink
import bgImage from "../assets/img/noaa-rxlx9Yi0298-unsplash.jpg"; 

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
      content: '""',
      display: 'flex',
      background: '#000',
      opacity: '0.8'
    },
  })
)

export default function DrawerContents(props) {
    const { routes } = props;

    var links = (
        <List>
          {routes.map((prop, key) => {
            return (
              <ListItemLink to={prop.path} primary={prop.name} icon={<prop.icon />} key={key} />
            );
          })}
        </List>
    );

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
        {links}
        {/* <List>{mainListItems}</List> */}
        <StyledDivider />
        <List>{secondaryListItems}</List>
      </Box>
    );

    return (
        <Box sx = {{ overflow: 'scroll' }}>
            <StyledDiv />
            {drawer}
        </Box>
  );
}
