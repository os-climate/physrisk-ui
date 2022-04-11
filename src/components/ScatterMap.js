import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

// note *public* access token
// committing into code-base; public token is available on client
mapboxgl.accessToken = 'pk.eyJ1Ijoiam9lbW9vcmhvdXNlIiwiYSI6ImNrejdlaDBzdDE4aXEyd3J4dnEwZGxvN3EifQ.Mx9efwIBjR3k6y77FT7czg';

export default function ScatterMap(props) {    
  const hazardTypeOptions = [
    'Riverine Inundation',
    'Coastal Inundation',
    'Drought'
  ]
  const [hazTypSelectedIndex, setHazTypSelectedIndex] = React.useState(0)
  const [anchorHazTyp, setAnchorHazTyp] = React.useState(null);
  
  const menus = [ "Hazard Type", "Year", "Scenario", "Model" ]
  const handleItemClick = menus.map((m, i) => (event, index) => {
    setHazTypSelectedIndex(i);
    setAnchorHazTyp(null); });

  const handleHazardTypeItemClick = (event, index) => {
    setHazTypSelectedIndex(index);
    setAnchorHazTyp(null);
  }

  const open = Boolean(anchorHazTyp);
  const handleHazTypMenuClick = (event) => {
    setAnchorHazTyp(event.currentTarget);
  };
  
  const handleHazTypMenuClose = () => {
    setAnchorHazTyp(null);
  };

  const scenarioOptions = [
    'RCP4.5',
    'RCP8.5'
  ]
  const [scenOptionsSelectedIndex, setscenOptionsSelectedIndex] = React.useState(1)
  
  const { onClick } = props; 
  //const theme = useTheme();
    
  const mapContainerRef = useRef(null);
  const [lng,] = useState(0); // setLng
  const [lat,] = useState(45);
  const [zoom,] = useState(2);
  
  const [, setMap] = useState(null);


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
      <Box component='div' sx={{ display: 'flex',
            alignItems: 'center', 
            textAlign: 'center',
            whitespace: 'nowrap',
            overflow: 'auto',
            '&::-webkit-scrollbar' : {
              display: 'none'
            }
            }}>
        <Tooltip title="Hazard type" arrow>
          <Button sx={{ flexShrink: 0 }} onClick={handleHazTypMenuClick} size="medium" endIcon={<KeyboardArrowDownIcon />}>
            {hazardTypeOptions[hazTypSelectedIndex]}
          </Button>
        </Tooltip>
        <Button sx={{ ml: 1, flexShrink: 0 }} size="small" endIcon={<KeyboardArrowDownIcon />} >
          2080
        </Button>
        <Button sx={{ ml: 1, flexShrink: 0 }} size="small" endIcon={<KeyboardArrowDownIcon />} >
          RCP8.5
        </Button>
        <Button sx={{ ml: 1, flexShrink: 0 }} size="small" endIcon={<KeyboardArrowDownIcon />} >
          MIROC-ESM-CHEM
        </Button>
      </Box>
      <Menu
        anchorEl={anchorHazTyp}
        open={open}
        onClose={handleHazTypMenuClose}
        onClick={handleHazTypMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {hazardTypeOptions.map((option, index) => (
          <MenuItem
            key={option}
            //disabled={index == 0}
            selected={index == hazTypSelectedIndex}
            onClick={(event) => handleHazardTypeItemClick(event, index)}
          >
            {option}
          </MenuItem>
        ))}
      </Menu>
      <Box ref={mapContainerRef} className="map-container" /> 
      {/* sx = {{ height: '400px', width: '100%' }} /> */}
    </React.Fragment>
  );
}

