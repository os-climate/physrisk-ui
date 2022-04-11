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

function ScatterMapMenu()
{
  const menus = [
    {
      name: "Hazard type",
      options: [ 'Riverine Inundation', 'Coastal Inundation', 'Drought' ],
      size: "medium"
    },
    {
      name: "Year",
      options: [ 'Baseline', '2030', '2050', '2080' ],
      size: "small"
    },
    {
      name: "Scenario",
      options: [ 'RCP4.5', 'RCP8.5' ],
      size: "small"
    },
    {
      name: "Model",
      options: [ 'MIROC-ESM-CHEM' ],
      size: "small"
    },
  ];

  const options = menus.map(m => m.options)

  const [selectedIndex0, setSelectedIndex0] = React.useState(0);
  const [selectedIndex1, setSelectedIndex1] = React.useState(0);
  const [selectedIndex2, setSelectedIndex2] = React.useState(0);
  const [selectedIndex3, setSelectedIndex3] = React.useState(0);

  const selectedIndices = [selectedIndex0, selectedIndex1, selectedIndex2, selectedIndex3];
  const setSelectedIndices = [setSelectedIndex0, setSelectedIndex1, setSelectedIndex2, setSelectedIndex3];

  const [anchorEl0, setAnchorEl0] = React.useState(null);
  const [anchorEl1, setAnchorEl1] = React.useState(null);
  const [anchorEl2, setAnchorEl2] = React.useState(null);
  const [anchorEl3, setAnchorEl3] = React.useState(null);

  const anchorEls = [anchorEl0, anchorEl1, anchorEl2, anchorEl3];
  const setAnchorEls = [setAnchorEl0, setAnchorEl1, setAnchorEl2, setAnchorEl3];

  const opens = [Boolean(anchorEl0), Boolean(anchorEl1), Boolean(anchorEl2), Boolean(anchorEl3)];

  const handleItemClicks = menus.map((m, i) => (event, index) => {
    setSelectedIndices[i](index);
    setAnchorEls[i](null); });

  const handleMenuClicks = menus.map((m, i) => (event) => {
    setAnchorEls[i](event.currentTarget); });  

  const handleMenuCloses = menus.map((m, i) => () => {
    setAnchorEls[i](null); });  

  return (
    <Box component='div' sx={{ display: 'flex',
      alignItems: 'center', 
      textAlign: 'center',
      whitespace: 'nowrap',
      overflow: 'auto',
      '&::-webkit-scrollbar' : {
        display: 'none'
        }
      }}>
      {menus.map((item, mIndex) => {
        return (
          <Tooltip title={item.name} arrow>
            <Button sx={{ flexShrink: 0 }} onClick={handleMenuClicks[mIndex]} size={item.size} endIcon={<KeyboardArrowDownIcon />}>
              {options[mIndex][selectedIndices[mIndex]]}
            </Button>
          </Tooltip>
        );
      })}
      {menus.map((item, mIndex) => {
        return (
          <Menu
            anchorEl={anchorEls[mIndex]}
            open={opens[mIndex]}
            onClose={handleMenuCloses[mIndex]}
            onClick={handleMenuCloses[mIndex]}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {options[mIndex].map((option, index) => (
              <MenuItem
                key={option}
                //disabled={index == 0}
                selected={index === selectedIndices[mIndex]}
                onClick={(event) => handleItemClicks[mIndex](event, index)}
              >
                {option}
              </MenuItem>
            ))}
          </Menu>
        );
      })}
    </Box> 
  );
};

export default function ScatterMap(props) {    

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
      <ScatterMapMenu />
      <Box ref={mapContainerRef} className="map-container" /> 
    </React.Fragment>
  );
}

