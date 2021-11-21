import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import mapboxgl from 'mapbox-gl'
import Title from './Title';
import Button from '@mui/material/Button';
import { MapOutlined } from '@mui/icons-material';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN

export default function ScatterMap() {    
    const theme = useTheme();
    
    const mapContainerRef = useRef(null);
    const [lng, setLng] = useState(0);
    const [lat, setLat] = useState(45);
    const [zoom, setZoom] = useState(2);
    
    const [map, setMap] = useState(null);

    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
      setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
      setAnchorEl(null);
    };

    useEffect(() => {
        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            // style: {
            //     'version': 8,
            //     'sources': {
            //         'raster-tiles': {
            //             'type': 'raster',
            //             'tiles': [
            //                 //'https://api.mapbox.com/v4/joemoorhouse.0zy9pvov/{z}/{x}/{y}@2x.png'
            //                 'https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg'
            //             ],
            //             'tileSize': 256,
            //             'attribution':
            //                 'Map tiles by <a target="_top" rel="noopener" href="http://stamen.com">Stamen Design</a>, under <a target="_top" rel="noopener" href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a target="_top" rel="noopener" href="http://openstreetmap.org">OpenStreetMap</a>, under <a target="_top" rel="noopener" href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>'
            //             },
            //         },
            //     'layers': [
            //         {
            //             'id': 'simple-tiles',
            //             'type': 'raster',
            //             'source': 'raster-tiles',
            //             'minzoom': 0,
            //             'maxzoom': 22
            //         }
            //     ]
            // },
            attributionControl: false,
            center: [lng, lat],
            zoom: zoom
        });

        map.on('load', () => {
            map.addSource('hazard', {
                type: 'raster',
                tiles: [
                    'https://api.mapbox.com/v4/joemoorhouse.0zy9pvov/{z}/{x}/{y}@2x.png'
                ],
                'tileSize': 256,
            });
            map.addLayer({
                'id': 'hazard-layer',
                'type': 'raster',
                'source': 'hazard',
                'layout': {
                    'visibility': 'visible'
                }
            });

            // Example about how to add a circle layer
            map.addSource("trailheads", {
                type: "geojson",
                data: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trailheads/FeatureServer/0/query?f=pgeojson&where=1=1",
      
            });
      
            map.addLayer({
            id: "trailheads-circle",
            type: "circle",
            source: "trailheads",
    
            paint: {
                "circle-color": "hsla(0,0%,0%,0.75)",
                "circle-stroke-width": 1.5,
                "circle-stroke-color": "white",
    
                }
            });

            setMap(map);
        });
        
        // Clean up on unmount
        return () => map.remove();
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
    <div ref={mapContainerRef} className="map-container" />
    </React.Fragment>
  );
}

