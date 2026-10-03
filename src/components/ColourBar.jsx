import React, { useMemo, useState } from "react"
import { useTheme } from "@mui/material/styles"
import {
    Area,
    AreaChart,
    CartesianAxis,
    CartesianGrid,
    XAxis,
    YAxis,
    ResponsiveContainer,
} from "recharts"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import FormControl from "@mui/material/FormControl"
import InputLabel from "@mui/material/InputLabel"
import MenuItem from "@mui/material/MenuItem"
import Popover from "@mui/material/Popover"
import Select from "@mui/material/Select"
import Slider from "@mui/material/Slider"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import { availableColormapNames, getColorbar } from "../data/HazardInventory"

export function ColourBar(props) {
    const {
        colorbarData,
        colorbarStops,
        units,
        colormapName,
        minValue,
        maxValue,
        colormaps,
        colormapMinIndex,
        colormapMaxIndex,
        opacity,
        editable,
        isOverridden,
        onChange,
    } = props
    const theme = useTheme()

    const previewGradients = useMemo(() => {
        if (!colormaps || colormapMinIndex == null || colormapMaxIndex == null)
            return {}
        return Object.fromEntries(
            availableColormapNames
                .filter((name) => colormaps[name])
                .map((name) => {
                    const stops = getColorbar(colormaps, {
                        name: name,
                        min_index: colormapMinIndex,
                        max_index: colormapMaxIndex,
                        min_value: 0,
                        max_value: 1,
                    }).stops
                    const gradient = stops
                        .map((s) => `${s.stopColor} ${s.offset}`)
                        .join(", ")
                    return [name, `linear-gradient(to right, ${gradient})`]
                })
        )
    }, [colormaps, colormapMinIndex, colormapMaxIndex])

    const [anchorEl, setAnchorEl] = useState(null)
    const [draftName, setDraftName] = useState(colormapName)
    const [draftMin, setDraftMin] = useState(minValue)
    const [draftMax, setDraftMax] = useState(maxValue)
    const [draftOpacity, setDraftOpacity] = useState(opacity ?? 1)

    const handleOpen = (event) => {
        if (!editable) return
        setDraftName(colormapName)
        setDraftMin(minValue)
        setDraftMax(maxValue)
        setDraftOpacity(opacity ?? 1)
        setAnchorEl(event.currentTarget)
    }
    const handleClose = () => setAnchorEl(null)

    const isValid =
        draftMin !== "" &&
        draftMax !== "" &&
        !isNaN(Number(draftMin)) &&
        !isNaN(Number(draftMax)) &&
        Number(draftMin) < Number(draftMax)

    const handleApply = () => {
        if (!isValid) return
        onChange({
            name: draftName,
            minValue: Number(draftMin),
            maxValue: Number(draftMax),
            opacity: draftOpacity,
        })
        handleClose()
    }

    const handleReset = () => {
        onChange(null)
        handleClose()
    }

    return (
        <>
            <Tooltip title={editable ? "Click to edit colour scale" : ""}>
                <Box
                    onClick={handleOpen}
                    sx={{ cursor: editable ? "pointer" : "default" }}
                >
                    <ResponsiveContainer width={"100%"} height={50}>
                        <AreaChart
                            data={colorbarData}
                            margin={{ top: 0, right: 7, left: 7, bottom: 6 }}
                            backgroundColor="white"
                        >
                            <defs>
                                <linearGradient
                                    id={"colorUv"}
                                    x1="0"
                                    y1="0"
                                    x2="1"
                                    y2="0"
                                >
                                    {colorbarStops.map((prop, key) => {
                                        return (
                                            <stop
                                                offset={prop.offset}
                                                stopColor={prop.stopColor}
                                                key={key}
                                            />
                                        )
                                    })}
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                fillOpacity={1.0}
                                isAnimationActive={false}
                                fill={"url(#colorUv)"}
                            />
                            <XAxis
                                dataKey="xValue"
                                tickCount="5"
                                interval="preserveStart"
                                domain={["dataMin", "dataMax"]}
                                type="number"
                                style={theme.typography.caption}
                                fontSize="9"
                                //fontFamily="Arial"
                                stroke="rgb(117,117,117"
                                label={{
                                    value:
                                        "Indicator value" +
                                        (units &&
                                        units != "" &&
                                        units.toLowerCase() != "none"
                                            ? " (" + units + ")"
                                            : ""),
                                    position: "insideBottom",
                                    dy: 3,
                                    fontSize: 11,
                                    //fontFamily: "Arial",
                                    fill: "rgb(117,117,117",
                                }}
                            />

                            <YAxis hide={true}></YAxis>
                            <CartesianAxis />
                            <CartesianGrid
                                strokeDasharray="0"
                                vertical={true}
                                horizontal={true}
                                stroke="rgb(117,117,117"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </Box>
            </Tooltip>
            {editable && (
                <Popover
                    open={Boolean(anchorEl)}
                    anchorEl={anchorEl}
                    onClose={handleClose}
                    anchorOrigin={{ vertical: "top", horizontal: "center" }}
                    transformOrigin={{
                        vertical: "bottom",
                        horizontal: "center",
                    }}
                >
                    <Stack spacing={2} sx={{ p: 2, width: 220 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="colour-map-select-label">
                                Colour map
                            </InputLabel>
                            <Select
                                labelId="colour-map-select-label"
                                label="Colour map"
                                value={draftName ?? ""}
                                onChange={(e) => setDraftName(e.target.value)}
                            >
                                {availableColormapNames.map((name) => (
                                    <MenuItem key={name} value={name}>
                                        <Stack
                                            direction="row"
                                            alignItems="center"
                                            justifyContent="space-between"
                                            sx={{ width: "100%" }}
                                        >
                                            <span>{name}</span>
                                            {previewGradients[name] && (
                                                <Box
                                                    sx={{
                                                        width: 48,
                                                        height: 14,
                                                        ml: 1.5,
                                                        borderRadius: 0.5,
                                                        border: "1px solid rgba(0,0,0,0.2)",
                                                        background:
                                                            previewGradients[
                                                                name
                                                            ],
                                                    }}
                                                />
                                            )}
                                        </Stack>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Min value"
                            type="number"
                            size="small"
                            value={draftMin}
                            error={
                                draftMin !== "" &&
                                !isNaN(Number(draftMax)) &&
                                Number(draftMin) >= Number(draftMax)
                            }
                            onChange={(e) => setDraftMin(e.target.value)}
                        />
                        <TextField
                            label="Max value"
                            type="number"
                            size="small"
                            value={draftMax}
                            error={
                                draftMax !== "" &&
                                !isNaN(Number(draftMin)) &&
                                Number(draftMax) <= Number(draftMin)
                            }
                            onChange={(e) => setDraftMax(e.target.value)}
                        />
                        <Box>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Opacity ({Math.round(draftOpacity * 100)}%)
                            </Typography>
                            <Slider
                                size="small"
                                min={0}
                                max={1}
                                step={0.05}
                                value={draftOpacity}
                                onChange={(_event, value) =>
                                    setDraftOpacity(value)
                                }
                            />
                        </Box>
                        <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="space-between"
                        >
                            <Button
                                size="small"
                                onClick={handleReset}
                                disabled={!isOverridden}
                            >
                                Reset
                            </Button>
                            <Button
                                size="small"
                                variant="contained"
                                onClick={handleApply}
                                disabled={!isValid}
                            >
                                Apply
                            </Button>
                        </Stack>
                    </Stack>
                </Popover>
            )}
        </>
    )
}
