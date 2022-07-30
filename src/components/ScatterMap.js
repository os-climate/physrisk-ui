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

function ScatterMapMenu(props)
{
  const { hazardMenu, hazardMenuUpdate } = props
  const [anchorEls, setAnchorEls] = React.useState([null, null, null, null]);

  if (!hazardMenu.menus)
    return (null);

  function setSelectedIndex(menuIndex, selectedIndex)
  {
    var newSelectedIndices = [...hazardMenu.selectedIndices]
    newSelectedIndices[menuIndex] = selectedIndex
    hazardMenuUpdate({ type: "update", payload: { selectedIndices: newSelectedIndices }})
  }

  function setAnchorEl(menuIndex, value)
  {
    var newAnchorEls = [...anchorEls]
    newAnchorEls[menuIndex] = value
    setAnchorEls(newAnchorEls)
  }

  function isOpen(menuIndex)
  {
    return Boolean(anchorEls[menuIndex])
  }

  const handleItemClicks = hazardMenu.menus.map((m, i) => (event, index) => {
    setSelectedIndex(i, index);
    setAnchorEl(i, null); 
  });

  const handleMenuClicks = hazardMenu.menus.map((m, i) => (event) => {
    setAnchorEl(i, event.currentTarget); });  

  const handleMenuCloses = hazardMenu.menus.map((m, i) => () => {
    setAnchorEl(i, null); });

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
      {hazardMenu.menus.map((item, mIndex) => {
        return (
          <Tooltip title={item.name} key={mIndex} arrow>
            <Button sx={{ flexShrink: 0 }} onClick={handleMenuClicks[mIndex]} size={item.size} endIcon={<KeyboardArrowDownIcon />}>
              {hazardMenu.menuOptions[mIndex][hazardMenu.selectedIndices[mIndex]]}
            </Button>
          </Tooltip>
        );
      })}
      {hazardMenu.menus.map((item, mIndex) => {
        return (
          <Menu
            anchorEl={anchorEls[mIndex]}
            open={isOpen(mIndex)}
            onClose={handleMenuCloses[mIndex]}
            onClick={handleMenuCloses[mIndex]}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            key={mIndex}
          >
            {hazardMenu.menuOptions[mIndex].map((option, index) => (
              <MenuItem
                sx ={{ fontSize: 14 }}
                key={option}
                selected={index === hazardMenu.selectedIndices[mIndex]}
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
  const { hazardMenu, hazardMenuUpdate, onClick, assetData, visible } = props; 

  const mapContainerRef = useRef(null);

  const [lng,] = useState(0); // setLng
  const [lat,] = useState(45);
  const [zoom,] = useState(2);
  const [map, setMap] = useState(null);
  const markerRef = useRef(null);

  useEffect(() => {
    var map = null;
    setMap(prev => {
      map = prev;
      return prev;
    });
    map?.resize()
  }, [visible]); 

  useEffect(() => {
      const newMap = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          attributionControl: false,
          center: [lng, lat],
          zoom: zoom
      });

      newMap.on('load', () => {
        const layers = newMap.getStyle().layers;
          // Find the index of the first symbol layer in the map style.
          let firstSymbolId;
          for (const layer of layers) {
            if (layer.type === 'symbol') {
              firstSymbolId = layer.id;
              break;
            }
          }
        
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
          },
        }, firstSymbolId);

        if (assetData) {
          newMap.addSource('assets', {
            type: 'geojson',
            data: {
              'type': 'FeatureCollection',
              'features': assetData.items.map((item) => (
                {
                  'type': 'Feature',
                  'properties': {},
                  'geometry': {
                    'type': 'Point',
                    'coordinates': [
                      item.longitude,
                      item.latitude,
                    ]
                  }
                }
              ))
            }
          });
  
          newMap.addLayer({
            id: 'assets-circle',
            type: 'circle',
            source: 'assets',
            paint: {
              'circle-color': 'hsla(145,100%,30%,1)',
              'circle-stroke-width': 1.5,
              'circle-stroke-color': 'white',
            }
          });
        }
      });

      newMap.on('click', (e) => {
        if (markerRef.current)
        {
          markerRef.current.remove(newMap);
        }
        const marker = new mapboxgl.Marker()
          .setLngLat([e.lngLat.lng, e.lngLat.lat])
          .addTo(newMap);

        markerRef.current = marker
        onClick(e)
      });

      setMap(newMap);


      // Clean up on unmount
      return () => newMap.remove();
  }, [assetData]);

  return (
    <React.Fragment>
      <ScatterMapMenu
        hazardMenu={hazardMenu}
        hazardMenuUpdate={hazardMenuUpdate}
      />
      <Box ref={mapContainerRef} className='map-container'/>
    </React.Fragment>
  );
}
