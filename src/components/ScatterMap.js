import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import Title from './Title';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

// note *public* access token
// committing into code-base; public token is available on client
mapboxgl.accessToken = 'pk.eyJ1Ijoiam9lbW9vcmhvdXNlIiwiYSI6ImNrejdlaDBzdDE4aXEyd3J4dnEwZGxvN3EifQ.Mx9efwIBjR3k6y77FT7czg';

export default function ScatterMap(props) {    
  const { onClick } = props; 
  //const theme = useTheme();
    
  const mapContainerRef = useRef(null);
  const [lng,] = useState(0); // setLng
  const [lat,] = useState(45);
  const [zoom,] = useState(2);
  
  const [, setMap] = useState(null);

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
      const newMap = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          attributionControl: false,
          center: [lng, lat],
          zoom: zoom
      });

      newMap.on('load', () => {
      
      newMap.addSource('hazard', {
            type: 'raster', // joemoorhouse.0zy9pvov
            tiles: [
                'https://api.mapbox.com/v4/joemoorhouse.0zy9pvov/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoiam9lbW9vcmhvdXNlIiwiYSI6ImNrejdlaDBzdDE4aXEyd3J4dnEwZGxvN3EifQ.Mx9efwIBjR3k6y77FT7czg'
            ],
            'tileSize': 256,
            'maxzoom': 6
        });
      
      newMap.addLayer({
        'id': 'hazard-layer',
        'type': 'raster',
        'source': 'hazard',
        'layout': {
            'visibility': 'visible'
        }
      });

      // Example about how to add a circle layer
      newMap.addSource("trailheads", {
          type: "geojson",
          data: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trailheads/FeatureServer/0/query?f=pgeojson&where=1=1",

      });
    
      newMap.addLayer({
      id: "trailheads-circle",
      type: "circle",
      source: "trailheads",

      paint: {
          "circle-color": "hsla(0,0%,0%,0.75)",
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "white",

          }
      });

      newMap.on('click', onClick);

      setMap(newMap);
      
    });  
      // Clean up on unmount
      return () => newMap.remove();
  }, []);
   
  
  return (
    <React.Fragment>
      <Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
        <Title>Hazard map</Title>
        <Button onClick={handleClick} sx={{ minWidth: 80, ml: 2 }} size="small" >
            Hazards
        </Button>
        <Button sx={{ minWidth: 80, ml: 2 }} size="small" >
            Scenarios
        </Button>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem>
            Inundation
        </MenuItem>
        <MenuItem>
            Wildfire
        </MenuItem>
      </Menu>
      <Box ref={mapContainerRef} className="map-container" /> 
      {/* sx = {{ height: '400px', width: '100%' }} /> */}
    </React.Fragment>
  );
}

