import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax

mapboxgl.accessToken = 'pk.eyJ1Ijoiam9lbW9vcmhvdXNlIiwiYSI6ImNrejdlaDBzdDE4aXEyd3J4dnEwZGxvN3EifQ.Mx9efwIBjR3k6y77FT7czg';

export default function MapApp() {    
  const mapContainer = useRef(null)
  const map = useRef(null);
  
  const [lng, setLng] = useState(0); 
  const [lat, setLat] = useState(45);
  const [zoom, setZoom] = useState(2);


  useEffect(() => {
    if (map.current) return; // initialize map only once  
    
    const newMap = new mapboxgl.Map({
          container: 
            mapContainer.current,
          style:
            'mapbox://styles/mapbox/streets-v11',
          center: [lng, lat],
          zoom: zoom
      });
  });

  return (
    <div ref={mapContainer} className="map-container"> 
    </div>
  );
}