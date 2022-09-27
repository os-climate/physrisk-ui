import React, { useRef, useEffect, useState } from "react"
import mapboxgl from "!mapbox-gl"
import Button from "@mui/material/Button"
import Box from "@mui/material/Box"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import Tooltip from "@mui/material/Tooltip"
import Popover from "@mui/material/Popover"
//import Typography from "@mui/material/Typography"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import { ColourBar } from "./ColourBar.js"
import CoordinatesInput from "./CoordinatesInput.js"

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

    console.log(assetSummary)
    const [popoverAnchorPos, setPopoverAnchorPos] = React.useState(null);
    //const popoverPermanent = React.useRef(false);

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
    const mapIdRef = useRef(null)

    function addRasterLayer(map, mapBoxId, placeBeforeLayerId) {
        map.addSource("hazard", {
            type: "raster",
            tiles: [
                "https://api.mapbox.com/v4/" + mapBoxId + "/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            maxzoom: 6,
        })

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

    function removeRasterLayer(map) {
        const layerId = "hazard"
        if (map.getLayer(layerId)) {
            map.removeLayer(layerId)
        }

        if (map.getSource(layerId)) {
            map.removeSource(layerId)
        }
    }

    function updateRaster(mapBoxId) {
        if (mapRef.current) {
            const map = mapRef.current

            const layers = map.getStyle().layers
            // Find the index of the first symbol layer in the map style.
            let firstSymbolId
            for (const layer of layers) {
                if (layer.type === "symbol") {
                    firstSymbolId = layer.id
                    break
                }
            }
            removeRasterLayer(map)
            addRasterLayer(map, "osc-mapbox." + mapBoxId, firstSymbolId)

            map.resize()
            map.triggerRepaint()
        }
    }

    if (mapIdRef.current != hazardMenu.mapId) {
        mapIdRef.current = hazardMenu.mapId
        updateRaster(hazardMenu.mapId)
    }

    useEffect(() => {
        mapRef.current?.resize()
    }, [visible])

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

            if (assetData) {
                newMap.addSource("assets", {
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

                newMap.addLayer({
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

                newMap.on("click", "assets-circle", (e) => { 
                    const rect = mapContainerRef.current.getBoundingClientRect()
                    setPopoverAnchorPos({ left: e.point.x + rect.x, top: e.point.y + rect.y })
                });

                newMap.on("mouseenter", "assets-circle", () => { // 
                    newMap.getCanvas().style.cursor = "pointer"
                });
                  
                newMap.on("mouseleave", "assets-circle", () => {
                    newMap.getCanvas().style.cursor = '';
                    //setPopoverAnchorPos(null)
                });
            }

            mapRef.current = newMap
            updateRaster(mapIdRef.current)
            CoordinatesInput(mapRef, mapboxgl, markerRef, onClick)
        })

        newMap.on("click", (e) => {
            if (assetData) {
                //const rect = mapContainerRef.current.getBoundingClientRect()
                //popoverPermanent.current = true
                //setPopoverAnchorPos({ left: e.point.x + rect.x, top: e.point.y + rect.y })
            }
            else {
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
    }, [assetData])

    const colorbarData = [
        { xValue: 0, value: 1 },
        { xValue: hazardMenu?.mapColorbar?.maxValue ?? 1, value: 1 },
    ]

    const colorbarStops = hazardMenu.mapColorbar?.stops ?? []

    return (
        <React.Fragment>
            <Box sx={{ position: "relative" }}>
                <ScatterMapMenu
                    hazardMenu={hazardMenu}
                    hazardMenuDispatch={hazardMenuDispatch}
                />
                <Box ref={mapContainerRef} className="map-container" 
                    // sx={{ "&.geocoder": { width: "500px" },
                    //     "&.mapboxgl-ctrl-geocoder" : { width: "500px" }
                    //     }} 
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
                        boxShadow: "0 0 10px 2px rgba(0,0,0,.1)",
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
                    {assetSummary ? assetSummary(0) : null}
                    {/* <Typography sx={{ p: 1 }}>I use Popover.</Typography> */}
                </Popover>
            </Box>
        </React.Fragment>
    )
}
