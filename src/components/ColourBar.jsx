import React, { useMemo, useState } from "react"
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
import ToggleButton from "@mui/material/ToggleButton"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import { availableColormapNames, getColorbar } from "../data/HazardInventory"

// Keep axis labels compact: plain decimal for everyday magnitudes, standard
// form (mantissa x10 with a true superscript exponent) once a number gets too
// wide to read comfortably.
const TICK_FILL = "rgb(117,117,117)"
const TICK_FONT_SIZE = 10.5

function renderTickLabel({ x, y, payload }) {
    const value = payload.value
    const abs = Math.abs(value)
    const textProps = {
        x,
        y: y + 9,
        textAnchor: "middle",
        fontSize: TICK_FONT_SIZE,
        fill: TICK_FILL,
    }
    if (value === 0 || (abs >= 0.001 && abs <= 1000)) {
        return <text {...textProps}>{value}</text>
    }
    const [mantissaRaw, exponentRaw] = value.toExponential(1).split("e")
    const mantissa = mantissaRaw.replace(/\.0$/, "")
    const exponent = exponentRaw.replace("+", "")
    return (
        <text {...textProps}>
            <tspan>{mantissa === "1" ? "10" : `${mantissa}×10`}</tspan>
            <tspan dy={-5} fontSize={TICK_FONT_SIZE * 0.7}>
                {exponent}
            </tspan>
        </text>
    )
}

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
        scaling,
        editable,
        isOverridden,
        onChange,
    } = props

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

    // d3's log-scale tick generator only returns "nice" powers of ten, which
    // can collapse to a single tick (or none) when min/max span less than a
    // decade. Always anchor on the actual min/max, and add a middle tick only
    // if a power of ten actually falls inside the range (picking the one
    // closest to the log-midpoint) rather than an arbitrary interpolated value.
    const logTicks = useMemo(() => {
        if (scaling !== "log" || !(minValue > 0) || !(maxValue > minValue))
            return undefined
        const logMin = Math.log10(minValue)
        const logMax = Math.log10(maxValue)
        const candidates = []
        for (let e = Math.ceil(logMin); e <= Math.floor(logMax); e++) {
            const v = 10 ** e
            if (v > minValue && v < maxValue) candidates.push(v)
        }
        if (candidates.length === 0) return [minValue, maxValue]
        const targetLog = (logMin + logMax) / 2
        const middle = candidates.reduce((best, v) =>
            Math.abs(Math.log10(v) - targetLog) <
            Math.abs(Math.log10(best) - targetLog)
                ? v
                : best
        )
        return [minValue, middle, maxValue]
    }, [scaling, minValue, maxValue])

    // Recharts' own "nice tick" heuristic only rounds nicely when the domain
    // starts at 0; for an arbitrary min (e.g. 0.01) it falls back to naive
    // even spacing, producing odd values like 2.01. Compute our own "nice"
    // middle tick (a 1/2/5 x 10^n step closest to the midpoint) instead.
    const linearTicks = useMemo(() => {
        if (scaling === "log" || !(maxValue > minValue)) return undefined
        const mid = (minValue + maxValue) / 2
        const roughStep = (maxValue - minValue) / 4
        const magnitude = 10 ** Math.floor(Math.log10(roughStep))
        const residual = roughStep / magnitude
        const niceResidual = residual >= 5 ? 10 : residual >= 2 ? 5 : residual >= 1 ? 2 : 1
        const step = niceResidual * magnitude
        const snapped = Number((Math.round(mid / step) * step).toPrecision(10))
        return snapped > minValue && snapped < maxValue
            ? [minValue, snapped, maxValue]
            : [minValue, maxValue]
    }, [scaling, minValue, maxValue])

    const axisTicks = scaling === "log" ? logTicks : linearTicks

    const [anchorEl, setAnchorEl] = useState(null)
    const [draftName, setDraftName] = useState(colormapName)
    const [draftMin, setDraftMin] = useState(minValue)
    const [draftMax, setDraftMax] = useState(maxValue)
    const [draftOpacity, setDraftOpacity] = useState(opacity ?? 1)
    const [draftScaling, setDraftScaling] = useState(scaling ?? "linear")

    const handleOpen = (event) => {
        if (!editable) return
        setDraftName(colormapName)
        setDraftMin(minValue)
        setDraftMax(maxValue)
        setDraftOpacity(opacity ?? 1)
        setDraftScaling(scaling ?? "linear")
        setAnchorEl(event.currentTarget)
    }
    const handleClose = () => setAnchorEl(null)

    const isValid =
        draftMin !== "" &&
        draftMax !== "" &&
        !isNaN(Number(draftMin)) &&
        !isNaN(Number(draftMax)) &&
        Number(draftMin) < Number(draftMax) &&
        (draftScaling !== "log" || Number(draftMin) > 0)

    const handleApply = () => {
        if (!isValid) return
        onChange({
            name: draftName,
            minValue: Number(draftMin),
            maxValue: Number(draftMax),
            opacity: draftOpacity,
            scaling: draftScaling,
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
                            margin={{ top: 0, right: 18, left: 18, bottom: 6 }}
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
                                domain={["dataMin", "dataMax"]}
                                type="number"
                                ticks={axisTicks}
                                interval={0}
                                tick={renderTickLabel}
                                {...(scaling === "log"
                                    ? { scale: "log" }
                                    : {})}
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
                                Scale
                            </Typography>
                            <ToggleButtonGroup
                                size="small"
                                exclusive
                                fullWidth
                                value={draftScaling}
                                onChange={(_event, value) =>
                                    value && setDraftScaling(value)
                                }
                            >
                                <ToggleButton value="linear">
                                    Linear
                                </ToggleButton>
                                <ToggleButton value="log">Log</ToggleButton>
                            </ToggleButtonGroup>
                            {draftScaling === "log" &&
                                Number(draftMin) <= 0 && (
                                    <Typography
                                        variant="caption"
                                        color="error"
                                    >
                                        Log scale requires min value &gt; 0
                                    </Typography>
                                )}
                        </Box>
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
