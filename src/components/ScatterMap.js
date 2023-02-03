import React, { useRef, useContext, useEffect, useState } from "react"
import mapboxgl from "!mapbox-gl"
import Button from "@mui/material/Button"
import Box from "@mui/material/Box"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import Popover from "@mui/material/Popover"
import Tooltip from "@mui/material/Tooltip"
import { ColourBar } from "./ColourBar.js"
import Geocoder from "./Geocoder.tsx"
import { GlobalDataContext } from "../data/GlobalData"

// note *public* access token
// committing into code-base; public token is available on client
mapboxgl.accessToken =
    "pk.eyJ1Ijoib3NjLW1hcGJveCIsImEiOiJjbDExYnVhaXYwMDZ5M2lxcnRjYXlrb3NlIn0.O_r7LgQjNux4I8g9WBlUBQ"

function ScatterMapMenu(props) {
    const { hazardMenu, hazardMenuDispatch } = props
    const [anchorEls, setAnchorEls] = React.useState([null, null, null, null])

    if (!hazardMenu.menus) return null

    function setSelectedIndex(menuIndex, selectedIndex) {
        var newSelectedIndices = [...hazardMenu.selectedIndices]
        newSelectedIndices[menuIndex] = selectedIndex
        hazardMenuDispatch({
            type: "update",
            payload: { selectedIndices: newSelectedIndices },
        })
    }

    function setAnchorEl(menuIndex, value) {
        var newAnchorEls = [...anchorEls]
        newAnchorEls[menuIndex] = value
        setAnchorEls(newAnchorEls)
    }

    function isOpen(menuIndex) {
        return Boolean(anchorEls[menuIndex])
    }

    const handleItemClicks = hazardMenu.menus.map((m, i) => (event, index) => {
        setSelectedIndex(i, index)
        setAnchorEl(i, null)
    })

    const handleMenuClicks = hazardMenu.menus.map((m, i) => (event) => {
        setAnchorEl(i, event.currentTarget)
    })

    const handleMenuCloses = hazardMenu.menus.map((m, i) => () => {
        setAnchorEl(i, null)
    })

    return (
        <Box
            component="div"
            sx={{
                display: "flex",
                alignItems: "center",
                textAlign: "center",
                whitespace: "nowrap",
                overflow: "auto",
                "&::-webkit-scrollbar": {
                    display: "none",
                },
            }}
        >
            {hazardMenu.menus.map((item, mIndex) => {
                return (
                    <Tooltip title={item.name} key={mIndex} arrow>
                        <Button
                            sx={{ flexShrink: 0 }}
                            onClick={handleMenuClicks[mIndex]}
                            size={item.size}
                            endIcon={<KeyboardArrowDownIcon />}
                        >
                            {
                                hazardMenu.menuOptions[mIndex][
                                    hazardMenu.selectedIndices[mIndex]
                                ]
                            }
                        </Button>
                    </Tooltip>
                )
            })}
            {hazardMenu.menus.map((item, mIndex) => {
                return (
                    <Menu
                        anchorEl={anchorEls[mIndex]}
                        open={isOpen(mIndex)}
                        onClose={handleMenuCloses[mIndex]}
                        onClick={handleMenuCloses[mIndex]}
                        transformOrigin={{
                            horizontal: "right",
                            vertical: "top",
                        }}
                        anchorOrigin={{
                            horizontal: "right",
                            vertical: "bottom",
                        }}
                        key={mIndex}
                    >
                        {hazardMenu.menuOptions[mIndex].map((option, index) => (
                            <MenuItem
                                sx={{ fontSize: 14 }}
                                key={option}
                                selected={
                                    index === hazardMenu.selectedIndices[mIndex]
                                }
                                onClick={(event) =>
                                    handleItemClicks[mIndex](event, index)
                                }
                            >
                                {option}
                            </MenuItem>
                        ))}
                    </Menu>
                )
            })}
        </Box>
    )
}

export default function ScatterMap(props) {
    const { hazardMenu, hazardMenuDispatch, onClick, assetData, assetSummary, visible } = props

    const [popoverAnchorPos, setPopoverAnchorPos] = React.useState(null);
    const [selectedAssetIndex, setSelectedAssetIndex] = React.useState(null);

    const globals = useContext(GlobalDataContext);

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

    function updateRaster(mapInfo) {
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
            addRasterLayer(map, mapInfo, firstSymbolId, globals)

            map.resize()
            map.triggerRepaint()
        }
    }

    if (mapInfoRef.current != hazardMenu.mapInfo) {
        mapInfoRef.current = hazardMenu.mapInfo
        updateRaster(hazardMenu.mapInfo)
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
            <Box>
                <ScatterMapMenu
                    hazardMenu={hazardMenu}
                    hazardMenuDispatch={hazardMenuDispatch}
                />
                <Box sx={{ position: "relative" }}>
                    <Box sx={{
                        width: 240,
                <Box sx={{ position: "relative" }}>
                    <Box sx={{
                        width: 240,
                        backgroundColor: "rgba(255, 255, 255, 1.0)",
                        position: "absolute",
                        top: 10,
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
                        {/* <Typography sx={{ p: 1 }}>I use Popover.</Typography> */}
                    </Popover>
                </Box>
            </Box>
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
                        {/* <Typography sx={{ p: 1 }}>I use Popover.</Typography> */}
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

function addRasterLayer(map, source, placeBeforeLayerId, globals) {
    
    const apiHost = globals.services.apiHost;
    
    if (source.mapId)
    {
        map.addSource("hazard", {
            type: "raster",
            tiles: [
                "https://api.mapbox.com/v4/" + source.mapId + "/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            maxzoom: 6,
        })
    }
    else if (source.path)
    {
        map.addSource("hazard", {
            type: "image",
            url: apiHost + "/api/images/" + source.path + ".png?minValue=" + source.minValue + "&maxValue=" + source.maxValue,
            coordinates: [[-180, 85], [180, 85], [180, -85], [-180, -85]]
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
