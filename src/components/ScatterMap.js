import React, { useRef, useContext, useEffect, useState } from "react"
import mapboxgl from "!mapbox-gl"
import Box from "@mui/material/Box"
import { ColourBar } from "./ColourBar.js"
import Geocoder from "./Geocoder.tsx"
import { GlobalDataContext } from "../data/GlobalData"
import HazardMenus from "./HazardMenus.js"
import Popover from "@mui/material/Popover"

// note *public* access token
// committing into code-base; public token is available on client
mapboxgl.accessToken =
    "pk.eyJ1Ijoib3NjLW1hcGJveCIsImEiOiJjbDExYnVhaXYwMDZ5M2lxcnRjYXlrb3NlIn0.O_r7LgQjNux4I8g9WBlUBQ"

export default function ScatterMap(props) {
    const { hazardMenu, hazardMenuDispatch, onClick, assetData, assetSummary, visible } = props

    const [popoverAnchorPos, setPopoverAnchorPos] = React.useState(null);
    const [selectedAssetIndex, setSelectedAssetIndex] = React.useState(null);

    const globals = useRef({}).current;
    globals.value = useContext(GlobalDataContext);;

    const handlePopoverClose = () => {
        setPopoverAnchorPos(null);
      };

    const popoverOpen = Boolean(popoverAnchorPos);

    const mapRef = useRef(null)
    const mapContainerRef = useRef(null)

    const [lng] = useState(0) // setLng
    const [lat] = useState(45)
    const [zoom] = useState(2)
    const markerRef = useRef(null)
    const mapInfoRef = useRef(null)

    
    function updateAssets()
    {
        if (mapRef.current) {
            const map = mapRef.current

            removeAssetsLayer(map)
            addAssetsLayer(map, assetData)

            map.on("click", "assets-circle", (e) => { 
                const rect = mapContainerRef.current.getBoundingClientRect()
                setPopoverAnchorPos({ left: e.point.x + rect.x, top: e.point.y + rect.y })
                setSelectedAssetIndex(e.features[0].id)
            });
        
            map.on("mouseenter", "assets-circle", () => { // 
                map.getCanvas().style.cursor = "pointer"
            });
                
            map.on("mouseleave", "assets-circle", () => {
                map.getCanvas().style.cursor = '';
            });

            map.resize()
            map.triggerRepaint()
        }
    }  

    function updateRaster(model, mapInfo) {
        if (mapRef.current) {
            const map = mapRef.current

            const layers = map.getStyle().layers
            // Find the index of the first symbol layer in the map style.
            let firstSymbolId
            for (const layer of layers) {
                // if (layer.type === "symbol") {
                if (layer["source-layer"] === "water") { 
                    firstSymbolId = layer.id
                    break
                }
            }
            removeRasterLayer(map)
            addRasterLayer(map, model, mapInfo, firstSymbolId, globals.value)

            map.resize()
            map.triggerRepaint()
        }
    }

    if (mapInfoRef.current != hazardMenu.mapInfo) {
        mapInfoRef.current = hazardMenu.mapInfo
        updateRaster(hazardMenu.selectedModel, hazardMenu.mapInfo)
    }

    useEffect(() => {
        mapRef.current?.resize()
    }, [visible])

    useEffect(() => {
        updateAssets()
    }, [assetData])

    useEffect(() => {
        const newMap = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: "mapbox://styles/mapbox/streets-v11",
            attributionControl: false,
            center: [lng, lat],
            zoom: zoom,
            transformRequest: (url, resourceType) => {
                if (resourceType == "Image" && globals.value.token)
                {
                    return { 
                        url : url, 
                        headers: (globals.value.token == "") ? null : { "Authorization": "Bearer " + globals.value.token }
                    }
                }
            }
        })

        newMap.on("load", () => {
            setTimeout(() => {
                mapRef.current?.resize()
            }, 1000)    

            mapRef.current = newMap
            updateRaster(mapInfoRef.current)
            if (assetData) updateAssets()
        })

        newMap.on("click", (e) => {
            if (!assetData) {
                if (markerRef.current) {
                    markerRef.current.remove(newMap)
                }
                const marker = new mapboxgl.Marker()
                    .setLngLat([e.lngLat.lng, e.lngLat.lat])
                    .addTo(newMap)

                markerRef.current = marker
                onClick(e)
            }
        })

        // Clean up on unmount
        return () => newMap.remove()
    }, [])

    const colorbarData = [
        { xValue: 0, value: 1 },
        { xValue: hazardMenu?.mapColorbar?.maxValue ?? 1, value: 1 },
    ]

    const colorbarStops = hazardMenu.mapColorbar?.stops ?? []

    const onSelectHandler = (result) => {
       console.log(result)
       if (mapRef.current)
       { 
            let [lng, lat] = result.feature.center
            if (markerRef.current) {
                markerRef.current.remove(mapRef.current)
            }
            const marker = new mapboxgl.Marker()
                .setLngLat([lng, lat])
                .addTo(mapRef.current)

            markerRef.current = marker
            
            mapRef.current.flyTo({
                center: result.feature.center,
                //essential: true, // this animation is considered essential with respect to prefers-reduced-motion
                zoom: 12,
                speed: 1
            });

            onClick({ lngLat: { lng, lat } })
        }
    }

    return (
        <React.Fragment>
            <Box>
                <HazardMenus
                    hazardMenu={hazardMenu}
                    hazardMenuDispatch={hazardMenuDispatch}
                />
                <Box sx={{ position: "relative" }}>
                    <Box sx={{
                        width: 240,
                        backgroundColor: "rgba(255, 255, 255, 1.0)",
                        position: "absolute",
                        top: 10,
                        right: 10,
                        zIndex: 1,
                        borderRadius: "4px",
                        boxShadow: "0 0 10px 2px rgba(0,0,0,.2)",
                    }}>
                        <Geocoder apiKey={mapboxgl.accessToken} onSelect={onSelectHandler} >
                        </Geocoder>
                    </Box>
                    <Box ref={mapContainerRef} className="map-container" 
                            />
                    <Box
                        sx={{
                            height: 45,
                            width: 175,
                            backgroundColor: "rgba(255, 255, 255, 1.0)",
                            position: "absolute",
                            bottom: 10,
                            right: 10,
                            zIndex: 1,
                            borderRadius: "4px",
                            boxShadow: "0 0 10px 2px rgba(0,0,0,.2)",
                        }}
                    >
                        <ColourBar colorbarData={colorbarData} colorbarStops={colorbarStops} units={hazardMenu?.mapColorbar?.units} />
                    </Box>
                    <Popover
                        id="mouse-over-popover"
                        sx={{
                        //    pointerEvents: 'none',
                            height: 400
                        }}
                        open={popoverOpen}
                        anchorPosition={popoverAnchorPos}
                        anchorReference="anchorPosition"
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'left',
                        }}
                        onClose={handlePopoverClose}
                        //disableRestoreFocus
                    >
                        {assetSummary ? assetSummary(selectedAssetIndex) : null}
                    </Popover>
                </Box>
            </Box>
        </React.Fragment>
    )
}

function addAssetsLayer(map, assetData) {
    map.addSource("assets", {
        type: "geojson",
        data: {
            type: "FeatureCollection",
            features: assetData.items.map((item, index) => ({
                type: "Feature",
                id: index,
                properties: { },
                geometry: {
                    type: "Point",
                    coordinates: [item.longitude, item.latitude],
                },
            })),
        },
    })

    map.addLayer({
        id: "assets-circle",
        type: "circle",
        source: "assets",
        paint: {
            "circle-color": "hsla(145,100%,30%,1)",
            "circle-radius": 7,
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "white",
        },
    })
}

function addRasterLayer(map, model, mapInfo, placeBeforeLayerId, globals) {
    
    const apiHost = globals.services.apiHost;
    
    if (!mapInfo) return;

    if (mapInfo.mapId)
    {
        map.addSource("hazard", {
            type: "raster",
            tiles: [
                "https://api.mapbox.com/v4/" + mapInfo.mapId + "/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            maxzoom: 6,
        })
    }
    else if (mapInfo.resource)
    {
        const coords = mapInfo.bounds ? mapInfo.bounds : [[-180.125, 85.125], [180.125, 85.125], [180.125, -85.125], [-180.125, -85.125]]
        map.addSource("hazard", {
            type: "image",
            url: apiHost + "/api/images/" + mapInfo.resource + ".png?minValue=" + mapInfo.minValue + "&maxValue=" + mapInfo.maxValue + "&scenarioId=" + mapInfo.scenarioId + "&year=" + mapInfo.year, 
            coordinates: coords
        });
    }
    
    map.addLayer(
        {
            id: "hazard",
            type: "raster",
            source: "hazard",
            layout: {
                visibility: "visible",
            },
            //"paint": {
            //"raster-resampling": "nearest"
            //"raster-fade-duration": 0
            //   }
        },
        placeBeforeLayerId
    )

}

function removeAssetsLayer(map) {
    const layerId = "assets-circle"
    const sourceId = "assets"
    if (map.getLayer(layerId)) {
        map.removeLayer(layerId)
    }

    if (map.getSource(sourceId)) {
        map.removeSource(sourceId)
    }
}

function removeRasterLayer(map) {
    const layerId = "hazard"
    if (map.getLayer(layerId)) {
        map.removeLayer(layerId)
    }

    if (map.getSource(layerId)) {
        map.removeSource(layerId)
    }
}
