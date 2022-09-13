import React, { useRef, useEffect, useMemo, useState } from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Area, AreaChart, CartesianGrid, CartesianAxis, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import CoordinatesInput from './CoordinatesInput.js'

// note *public* access token
// committing into code-base; public token is available on client
mapboxgl.accessToken = 'pk.eyJ1Ijoib3NjLW1hcGJveCIsImEiOiJjbDExYnVhaXYwMDZ5M2lxcnRjYXlrb3NlIn0.O_r7LgQjNux4I8g9WBlUBQ'

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

  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  const [lng,] = useState(0); // setLng
  const [lat,] = useState(45);
  const [zoom,] = useState(2);
  const markerRef = useRef(null);
  const mapIdRef = useRef(null);

  function addRasterLayer(map, mapBoxId, placeBeforeLayerId)
  {
    map.addSource('hazard', {
        type: 'raster', 
        tiles: [
            'https://api.mapbox.com/v4/' + mapBoxId + '/{z}/{x}/{y}.png'
        ],
        'tileSize': 256,
        'maxzoom': 6
    });

    map.addLayer({
      'id': 'hazard',
      'type': 'raster',
      'source': 'hazard',
      'layout': {
          'visibility': 'visible'
      },
    }, placeBeforeLayerId);
  }

  function removeRasterLayer(map)
  {
    const layerId = 'hazard'
    if (map.getLayer(layerId)){
      map.removeLayer(layerId);
    }
    
    if (map.getSource(layerId)){
      map.removeSource(layerId);
    }
  }

  function updateRaster(mapBoxId)
  {    
    if (mapRef.current) {    
      const map = mapRef.current
      
      const layers = map.getStyle().layers;
      // Find the index of the first symbol layer in the map style.
      let firstSymbolId;
      for (const layer of layers) {
        if (layer.type === 'symbol') {
          firstSymbolId = layer.id;
          break;
        }
      }
      removeRasterLayer(map)
      addRasterLayer(map, 'osc-mapbox.' + mapBoxId, firstSymbolId)
      
      map.resize()
      map.triggerRepaint()
    }
  }

  if (mapIdRef.current != hazardMenu.mapId)
  {
    mapIdRef.current = hazardMenu.mapId;
    updateRaster(hazardMenu.mapId);
  }

  useEffect(() => {
    mapRef.current?.resize()
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
        const timer = setTimeout(() => {
          mapRef.current?.resize()
          }, 1000);

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

        mapRef.current = newMap;
        updateRaster(mapIdRef.current);
	      CoordinatesInput(mapRef, mapboxgl, markerRef, onClick)
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

      // Clean up on unmount
      return () => newMap.remove();

  }, [assetData]);

  const colorbarData = [
    { xValue: 0, value: 1 },
    { xValue: hazardMenu?.mapColorbar?.maxValue ?? 1, value: 1 },
  ]

  const colorbarStops = hazardMenu.mapColorbar?.stops ?? []

  return (
    <React.Fragment >
      <Box sx={{ position: 'relative' }}>
        <ScatterMapMenu
          hazardMenu={hazardMenu}
          hazardMenuUpdate={hazardMenuUpdate}
        />
        <Box ref={mapContainerRef} className='map-container' />
        <Box sx={{ height: 45, width: 175, backgroundColor: 'rgba(255, 255, 255, 1.0)', position: 'absolute', bottom: 4, right: 4, zIndex: 1, borderRadius: '4px', boxShadow: '0 0 10px 2px rgba(0,0,0,.1)' }}>
          <ResponsiveContainer width={"100%"} height={45}>
            <AreaChart data={colorbarData}
              margin={{ top: 7, right: 7, left: 7, bottom: 0 }} backgroundColor='white'>
              <defs>
                <linearGradient id={"colorUv"} x1="0" y1="0" x2="1" y2="0">
                {colorbarStops.map((prop, key) => {
                  return (
                    <stop offset={prop.offset} stopColor={prop.stopColor} key={key} />
                  );
                })} 
                  {/* <stop offset="0%" stopColor="#FF0000" stopOpacity={1.0}/>
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity={1.0}/> */}
                </linearGradient>

              </defs>
              <Area type="monotone" dataKey="value" fillOpacity={1.0} fill={"url(#colorUv)"} />
              <XAxis dataKey="xValue" tickCount="5" interval="preserveStart" domain={['dataMin', 'dataMax']} type='number' fontSize='11' fontFamily='Arial' stroke='rgb(117,117,117'
                label={{ value: 'Intensity (' + hazardMenu?.mapColorbar?.units + ')', position: 'insideBottom', dy: 3, fontSize: 11, fontFamily: 'Arial', fill: 'rgb(117,117,117' }} />
                
              <YAxis hide={true}></YAxis>
              <CartesianAxis />
              <CartesianGrid strokeDasharray="0" vertical={true} horizontal={true} stroke='rgb(117,117,117' />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </React.Fragment>
  );
}
