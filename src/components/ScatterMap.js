import React, { useRef, useContext, useEffect, useState } from "react"
import {ScaleControl, Map, Marker, Layer, Source, MapProvider} from 'react-map-gl';
import Box from "@mui/material/Box"
import { ColourBar } from "./ColourBar.js"
import Geocoder from "./Geocoder.tsx"
import { GlobalDataContext } from "../data/GlobalData"
import HazardMenus from "./HazardMenus.js"
import Popover from "@mui/material/Popover"

// note *public* access token
// committing into code-base; public token is available on client
const mapboxAccessToken =
    "pk.eyJ1Ijoib3NjLW1hcGJveCIsImEiOiJjbDExYnVhaXYwMDZ5M2lxcnRjYXlrb3NlIn0.O_r7LgQjNux4I8g9WBlUBQ"

export default function ScatterMap(props) {
    const { hazardMenu, hazardMenuDispatch, onClick, assetData, assetSummary, visible } = props

    // popover
    const [popoverAnchorPos, setPopoverAnchorPos] = React.useState(null);
    const popoverOpen = Boolean(popoverAnchorPos);
    const handlePopoverClose = () => {
        setPopoverAnchorPos(null);
    };

    // assets
    const [selectedAssetIndex, setSelectedAssetIndex] = React.useState(null);

    // events
    const handleAssetsMouseEnter = (event) => { 
         const feature = event.features && event.features[0];
         if (feature) {
            mapRef.current.getCanvas().style.cursor = "pointer"
        }
    };

    const handleAssetsMouseLeave = (event) => { 
        const feature = event.features && event.features[0];
        if (feature) {
           mapRef.current.getCanvas().style.cursor = ""
       }
    };

    const handleClick = (event) => {
        if (assetData) {
            const feature = event.features && event.features[0];
            if (feature)
            {
                const rect = mapContainerRef.current.getBoundingClientRect();
                setPopoverAnchorPos({ left: event.point.x + rect.x, top: event.point.y + rect.y })
                setSelectedAssetIndex(feature.id)
            }
        }
        else {
            setMarkers([{longitude:event.lngLat.lng, latitude:event.lngLat.lat}])
            onClick(event)
        }
    }

    // geocoding
    const onSelectHandler = (result) => {
        console.log(result)
        if (mapRef.current)
        { 
             let [lng, lat] = result.feature.center
             setMarkers([{longitude:lng, latitude:lat}])
 
             mapRef.current.flyTo({
                 center: result.feature.center,
                 //essential: true, // this animation is considered essential with respect to prefers-reduced-motion
                 zoom: 12,
                 speed: 1
             });
 
             onClick({ lngLat: { lng, lat } })
         }
     }

    // colour bar
    const colorbarData = [
        { xValue: 0, value: 1 },
        { xValue: hazardMenu?.mapColorbar?.maxValue ?? 1, value: 1 },
    ]
    const colorbarStops = hazardMenu.mapColorbar?.stops ?? []

    // map
    const globals = useRef({}).current
    globals.value = useContext(GlobalDataContext)
    const mapContainerRef = useRef(null)
    const mapRef = useRef(null)
    const [lng] = useState(0) 
    const [lat] = useState(45)
    const [zoom] = useState(2)

    // markers
    const [markers, setMarkers] = useState([])

    var transformRequest=(url, resourceType) => {
        if (resourceType == "Image" && globals.value.token)
        {
            return { 
                url : url, 
                headers: (globals.value.token == "") ? null : { "Authorization": "Bearer " + globals.value.token }
            }
        }
    }

    // to deal with bug (?) that map does not resize if not visible
    useEffect(() => {
        mapRef.current?.resize()
    }, [visible])

    function getFirstSymbolId()
    {       
        if (!mapRef.current) return ""
        const layers = mapRef.current.getStyle().layers
        // Find the index of the first symbol layer in the map style.
        let firstSymbolId
        for (const layer of layers) {
            // if (layer.type === "symbol") {
            if (layer["source-layer"] === "water") { 
                firstSymbolId = layer.id
                break
            }
        }
        return firstSymbolId
    }
    
    const firstSymbolId = getFirstSymbolId()

    function getSourceStyle(mapInfo) {
    
        const apiHost = globals.value.services.apiHost;
        if (!mapInfo) return ""

        if (mapInfo.source == "mapbox" || mapInfo.source == "map_array_pyramid")
        {
            var url = (mapInfo.source == "mapbox") ? "https://api.mapbox.com/v4/" + mapInfo.mapId + "/{z}/{x}/{y}.png" :
                apiHost + "/api/tiles/" + mapInfo.resource + "/{z}/{x}/{y}.png" + "?minValue=" + mapInfo.minValue + "&maxValue=" + mapInfo.maxValue + "&scenarioId=" + mapInfo.scenarioId + "&year=" + mapInfo.year
            return {
                id: "hazard",
                type: "raster",
                key: url,
                tiles: [url],
                tileSize: 256,
                maxzoom: 7,
            }
        }
        else if (mapInfo.source == "map_array")
        {
            const coords = mapInfo.bounds ? mapInfo.bounds : [[-180.125, 85.125], [180.125, 85.125], [180.125, -85.125], [-180.125, -85.125]]
            return {
                id: "hazard", 
                type: "image",
                url: apiHost + "/api/images/" + mapInfo.resource + ".png?minValue=" + mapInfo.minValue + "&maxValue=" + mapInfo.maxValue + "&scenarioId=" + mapInfo.scenarioId + "&year=" + mapInfo.year, 
                key: apiHost + "/api/images/" + mapInfo.resource + ".png?minValue=" + mapInfo.minValue + "&maxValue=" + mapInfo.maxValue + "&scenarioId=" + mapInfo.scenarioId + "&year=" + mapInfo.year,
                coordinates: coords
            }
        }
    }

    const sourceStyle = getSourceStyle(hazardMenu.mapInfo)

    const layerStyle =  {
        id: "hazard",
        type: "raster",
        key: sourceStyle.key,
        source: "hazard",
        layout: {
            visibility: "visible",
        },
        paint: {
            "raster-resampling": "nearest",
            //"raster-fade-duration": "0"
        }
    }

    var assetsSourceStyle = null
    var assetsLayerStyle = null

    if (assetData)
    {
        var key = "test" 

        assetsSourceStyle = {
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
            tolerance: 0,
            key: key
        }
        assetsLayerStyle = {
            id: "assets-circle",
            type: "circle",
            source: "assets",
            paint: {
                "circle-color": "hsla(145,100%,30%,1)",
                "circle-radius": 7,
                "circle-stroke-width": 1.5,
                "circle-stroke-color": "white",
            },
            key: key
        }
    }

    return (
        <React.Fragment>
            <Box>
                <HazardMenus
                    hazardMenu={hazardMenu}
                    hazardMenuDispatch={hazardMenuDispatch}
                />
            </Box>
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
                    <Geocoder apiKey={mapboxAccessToken} onSelect={onSelectHandler} />
                </Box>
                <Box ref={mapContainerRef} sx={{ height: '60vh' }}>
                    <MapProvider>
                        <Map 
                            ref={mapRef}
                            id="map"
                            mapboxAccessToken={mapboxAccessToken}
                            projection="globe"
                            mapStyle="mapbox://styles/mapbox/streets-v11"
                            attributionControl={false}
                            initialViewState={{
                                latitude: lat,
                                longitude: lng,
                                zoom: zoom
                            }}
                            transformRequest={transformRequest}
                            onClick={handleClick}
                            onMouseEnter={handleAssetsMouseEnter}
                            onMouseLeave={handleAssetsMouseLeave}
                            interactiveLayerIds={["assets-circle"]}
                        >
                            {markers.map((m, i) => <Marker {...m} key={i} />)}
                            {
                                sourceStyle ? (<Source {...sourceStyle}>
                                    <Layer beforeId={firstSymbolId} {...layerStyle} />
                                </Source>) : <></>
                            }
                            {                           
                                assetsSourceStyle ? (<Source {...assetsSourceStyle}>
                                    <Layer {...assetsLayerStyle} />
                                </Source>) : <></>
                            }
                            <ScaleControl sx={{ color: "beige", stroke: "rgb(117,117,117" }} stroke="rgb(117,117,117"  />
                        </Map>
                    </MapProvider>
                </Box>
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
        </React.Fragment>
    )
}