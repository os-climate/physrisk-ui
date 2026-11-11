import * as React from "react"
import { useTheme } from "@mui/material/styles"
import Box from "@mui/material/Box"
import { ContentCopy } from "@mui/icons-material"
import IconButton from "@mui/material/IconButton"
import { Paper, styled } from "@mui/material"
import MuiTooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import { scaleLog as d3ScaleLog } from "d3-scale" // scaleLinear as d3ScaleLinear,
import {
    CartesianGrid,
    Scatter,
    ScatterChart,
    XAxis,
    YAxis,
    Label,
    Legend,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
} from "recharts"
import Title from "./Title"
import { prettifyScenarioId } from "../data/HazardInventory"

function graphDataPoint(x, y) {
    return { x, y }
}

/** Names of series hidden by clicking their legend entries; recharts shows
 *  hidden series greyed out in the legend, so they can be clicked back. */
function useHiddenSeries(initiallyHidden) {
    const [hidden, setHidden] = React.useState(
        () => new Set(initiallyHidden ?? [])
    )
    const toggle = (entry) =>
        setHidden((current) => {
            const updated = new Set(current)
            updated.has(entry.value)
                ? updated.delete(entry.value)
                : updated.add(entry.value)
            return updated
        })
    return [hidden, toggle]
}

/** Dashed vertical line marking the index value (e.g. return period or
 *  threshold) shown on the map, which is one point of the curve. The label
 *  goes on the side of the line facing the middle of the chart, so that it is
 *  not cut off at the edge. */
function mapIndexLine(x, xValues, reversed, theme) {
    if (typeof x != "number" || xValues.length == 0) return null
    const sorted = [...xValues].sort((a, b) => a - b)
    const middle = sorted[Math.floor(sorted.length / 2)]
    const onRight = reversed ? x < middle : x >= middle
    return (
        <ReferenceLine
            x={x}
            stroke={theme.palette.text.secondary}
            strokeDasharray="4 4"
            ifOverflow="discard"
            label={{
                value: "Map",
                position: onRight ? "insideTopRight" : "insideTopLeft",
                fill: theme.palette.text.secondary,
                fontSize: 12,
            }}
        />
    )
}

/** Copies curves to the clipboard as arrays, e.g. "returns = array(...)" and
 *  "intensity = array(...)"; several curves are each headed by their name. */
function copyCurves(dataPointsSet, xName, labelled) {
    const array = (name, values) =>
        name + " = array(" + values.map((v) => v.toPrecision(8)).join(",") + ")"
    const text = Object.entries(dataPointsSet)
        .map(([key, points]) => {
            const ordered = points.toReversed()
            return (
                (labelled ? "# " + key + "\n" : "") +
                array(
                    xName,
                    ordered.map((d) => d.x)
                ) +
                "\n" +
                array(
                    "intensity",
                    ordered.map((d) => d.y)
                )
            )
        })
        .join("\n\n")
    window.navigator.clipboard.writeText(text)
}

/** Chart height, allowing room for extra legend rows when there are many
 *  curves (a single row, up to around 5 curves, fits in the default). */
function chartHeight(dataSets) {
    const n = dataSets ? Object.keys(dataSets).length : 0
    return 240 + 22 * Math.max(0, Math.ceil(n / 5) - 1)
}

export function ExceedancePlot(props) {
    const {
        title,
        data,
        dataSets,
        colours,
        initiallyHidden,
        quantity,
        units,
        graphType,
        mapIndexValue,
        heading,
    } = props

    const theme = useTheme()
    const [hidden, toggleSeries] = useHiddenSeries(initiallyHidden)

    var ticks, tickFormat, domain, scale, tickFormatAll
    const dataPointsSet = {}
    for (const [key, value] of Object.entries(
        dataSets ? dataSets : { data: data }
    )) {
        if (graphType == "exceedance") {
            dataPointsSet[key] = value.map((item) => ({
                ...graphDataPoint(1.0 / item.x, item.y),
                series: key,
            }))
        } else {
            dataPointsSet[key] = value.map((item) => ({ ...item, series: key }))
        }
    }
    var dataPoints = Object.entries(dataPointsSet).map(([, v]) => v)[0]
    if (!dataPoints) return <></>

    domain = dataPoints.map((d) => d.x)
    // domain = (graphType == "exceedance") ? [0.001, 0.01, 0.1, 0.2] : [1000, 100, 10, 5]
    scale = d3ScaleLog().domain(domain).range([0, 1])
    ticks = scale.ticks(10)
    // labelTicks = scale.ticks(5)
    tickFormatAll = scale.tickFormat(10, "f")
    tickFormat = (t) => (Math.log10(t) % 1 == 0 ? tickFormatAll(t) : "")
    // tickFormat = (t) => (labelTicks.includes(t) ? tickFormatAll(t) : '')

    const xAxisLabel =
        graphType == "returnPeriod"
            ? "Return period (years)"
            : "Annual exceedance probability"
    const xAxisLabelShort =
        graphType == "returnPeriod" ? "Return period" : "Exceedance prob"
    const xAxisLabelUnits = graphType == "returnPeriod" ? " years" : ""

    const copyData = () => copyCurves(dataPointsSet, "returns", dataSets)

    const Item = styled(Paper)(({ theme }) => ({
        ...theme.typography.body2,
        textAlign: "center",
        color: theme.palette.text.secondary,
        lineHeight: "60px",
    }))

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <Item elevation={4}>
                    <Typography sx={{ m: 1, fontSize: 14 }}>
                        <pre style={{ fontFamily: "inherit" }}>
                            {`${
                                dataSets
                                    ? payload[0].payload.series + " \n "
                                    : ""
                            }${xAxisLabelShort}: ${
                                payload[0].value.toPrecision(4) / 1
                            }${xAxisLabelUnits} \n ${quantityLabel(
                                quantity
                            )}: ${payload[1].value.toPrecision(4)} ${units}`}
                        </pre>
                    </Typography>
                </Item>
            )
        }

        return null
    }

    return (
        <React.Fragment>
            <Title>{title}</Title>
            <ChartHeading onCopy={copyData}>{heading}</ChartHeading>
            <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
                <ResponsiveContainer height={chartHeight(dataSets)}>
                    <ScatterChart
                        margin={{
                            top: 0,
                            right: 20,
                            bottom: 15,
                            left: yAxisMargin(quantity),
                        }}
                    >
                        <CartesianGrid />
                        <XAxis
                            allowDataOverflow={false}
                            dataKey="x"
                            type="number"
                            stroke={theme.palette.text.secondary}
                            style={theme.typography.body2}
                            reversed={graphType == "exceedance"}
                            domain={
                                graphType == "exceedance"
                                    ? [() => 0.001, "dataMax"]
                                    : ["dataMin", "dataMax"]
                            }
                            //domain={['auto', 'auto']}
                            interval={0}
                            tickFormatter={tickFormat}
                            scale="log"
                            ticks={ticks}
                        >
                            <Label
                                position="bottom"
                                offset={0}
                                style={{
                                    textAnchor: "middle",
                                    fill: theme.palette.text.primary,
                                    ...theme.typography.body1,
                                }}
                            >
                                {xAxisLabel}
                            </Label>
                        </XAxis>
                        <YAxis
                            allowDataOverflow={false}
                            dataKey="y"
                            type="number"
                            stroke={theme.palette.text.secondary}
                            style={theme.typography.body2}
                        >
                            {yAxisLabels(quantity, units, theme)}
                        </YAxis>
                        {Object.entries(dataPointsSet).map(([k, v], i) => (
                            <Scatter
                                key={k}
                                name={k}
                                hide={hidden.has(k)}
                                isAnimationActive={false}
                                data={v}
                                fill={colours?.[k] ?? theme.graphs[i]}
                                line
                                shape="dot"
                            />
                        ))}
                        {/* <Scatter name="" isAnimationActive={false} data={dataPoints} fill={theme.palette.primary.main} line shape="dot" /> */}
                        {mapIndexLine(
                            graphType == "exceedance" && mapIndexValue
                                ? 1.0 / mapIndexValue
                                : mapIndexValue,
                            dataPoints.map((d) => d.x),
                            graphType == "exceedance",
                            theme
                        )}
                        <Tooltip content={<CustomTooltip />} />
                        {dataSets ? (
                            <Legend
                                verticalAlign="top"
                                onClick={toggleSeries}
                                wrapperStyle={{ cursor: "pointer" }}
                            />
                        ) : (
                            <></>
                        )}
                        {/* <Line
                            isAnimationActive={false}
                            type="monotone"
                            dataKey="y"
                            stroke={theme.palette.primary.main}
                            dot={false}
                        /> */}
                    </ScatterChart>
                </ResponsiveContainer>
            </Box>
        </React.Fragment>
    )
}

export function ThresholdPlot(props) {
    const {
        title,
        data,
        dataSets,
        colours,
        initiallyHidden,
        quantity,
        units,
        mapIndexValue,
        heading,
    } = props

    const theme = useTheme()
    const [hidden, toggleSeries] = useHiddenSeries(initiallyHidden)
    const dataPointsSet = {}
    for (const [key, value] of Object.entries(
        dataSets ? dataSets : { data: data }
    )) {
        dataPointsSet[key] = value.map((item) => ({ ...item, series: key }))
    }
    var dataPoints = Object.entries(dataPointsSet).map(([, v]) => v)[0]
    if (!dataPoints) return <></>

    //domain = dataPoints.map(d => d.x)
    //scale = d3ScaleLog().domain(domain).range([0, 1]);
    //ticks = scale.ticks(10)
    //tickFormatAll = scale.tickFormat(10, "f")
    //tickFormat = (t) => (Math.log10(t) % 1 == 0 ? tickFormatAll(t) : '')

    const xAxisLabel = "Threshold"
    const xAxisLabelShort = "Threshold"
    const xAxisLabelUnits = ""

    const copyData = () => copyCurves(dataPointsSet, "thresholds", dataSets)

    const Item = styled(Paper)(({ theme }) => ({
        ...theme.typography.body2,
        textAlign: "center",
        color: theme.palette.text.secondary,
        lineHeight: "60px",
    }))

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <Item elevation={4}>
                    <Typography sx={{ m: 1, fontSize: 14 }}>
                        <pre style={{ fontFamily: "inherit" }}>
                            {`${
                                dataSets
                                    ? payload[0].payload.series + " \n "
                                    : ""
                            }${xAxisLabelShort}: ${
                                payload[0].value.toPrecision(4) / 1
                            }${xAxisLabelUnits} \n ${quantityLabel(
                                quantity
                            )}: ${payload[1].value.toPrecision(4)} ${units}`}
                        </pre>
                    </Typography>
                </Item>
            )
        }

        return null
    }

    return (
        <React.Fragment>
            <Title>{title}</Title>
            <ChartHeading onCopy={copyData}>{heading}</ChartHeading>
            <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
                <ResponsiveContainer height={chartHeight(dataSets)}>
                    <ScatterChart
                        margin={{
                            top: 5,
                            right: 20,
                            bottom: 15,
                            left: yAxisMargin(quantity),
                        }}
                    >
                        <CartesianGrid />
                        <XAxis
                            allowDataOverflow={false}
                            dataKey="x"
                            type="number"
                            stroke={theme.palette.text.secondary}
                            style={theme.typography.body2}
                            //reversed={graphType == "exceedance"}
                            //domain={(graphType == "exceedance") ? [ () => (0.001), 'dataMax'] : ['dataMin', 'dataMax']}
                            //domain={['auto', 'auto']}
                            interval={0}
                            //tickFormatter = {tickFormat}
                            //scale="log"
                            //ticks={ticks}
                        >
                            <Label
                                position="bottom"
                                offset={0}
                                style={{
                                    textAnchor: "middle",
                                    fill: theme.palette.text.primary,
                                    ...theme.typography.body1,
                                }}
                            >
                                {xAxisLabel}
                            </Label>
                        </XAxis>
                        <YAxis
                            allowDataOverflow={false}
                            dataKey="y"
                            type="number"
                            stroke={theme.palette.text.secondary}
                            style={theme.typography.body2}
                        >
                            {yAxisLabels(quantity, units, theme)}
                        </YAxis>
                        {Object.entries(dataPointsSet).map(([k, v], i) => (
                            <Scatter
                                key={k}
                                name={k}
                                hide={hidden.has(k)}
                                isAnimationActive={false}
                                data={v}
                                fill={colours?.[k] ?? theme.graphs[i]}
                                line
                                shape="dot"
                            />
                        ))}
                        {mapIndexLine(
                            mapIndexValue,
                            dataPoints.map((d) => d.x),
                            false,
                            theme
                        )}
                        <Tooltip content={<CustomTooltip />} />
                        {dataSets ? (
                            <Legend
                                verticalAlign="top"
                                onClick={toggleSeries}
                                wrapperStyle={{ cursor: "pointer" }}
                            />
                        ) : (
                            <></>
                        )}
                    </ScatterChart>
                </ResponsiveContainer>
            </Box>
        </React.Fragment>
    )
}

/** Indicator value against year, one line per scenario. */
export function ScenarioTimeSeriesPlot(props) {
    const { historical, series, initiallyHidden, quantity, units, heading } =
        props
    const theme = useTheme()
    const [hidden, toggleSeries] = useHiddenSeries(initiallyHidden)
    const allPoints = [...historical, ...series.flatMap((s) => s.points)]
    if (allPoints.length == 0) return <></>
    const years = [...new Set(allPoints.map((p) => p.x))].sort((a, b) => a - b)
    const colour = (scenarioId) =>
        theme.scenarios[scenarioId] ?? theme.palette.primary.main

    const Item = styled(Paper)(({ theme }) => ({
        ...theme.typography.body2,
        textAlign: "center",
        color: theme.palette.text.secondary,
        lineHeight: "60px",
    }))

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const point = payload[0].payload
            return (
                <Item elevation={4}>
                    <Typography sx={{ m: 1, fontSize: 14 }}>
                        <pre style={{ fontFamily: "inherit" }}>
                            {`${prettifyScenarioId(point.scenarioId)}, ${
                                point.x
                            } \n ${quantityLabel(
                                quantity
                            )}: ${point.y.toPrecision(4)} ${units}`}
                        </pre>
                    </Typography>
                </Item>
            )
        }
        return null
    }

    return (
        <>
            <ChartHeading>{heading}</ChartHeading>
            <ResponsiveContainer height={260}>
                <ScatterChart
                    margin={{
                        top: 5,
                        right: 20,
                        bottom: 15,
                        left: yAxisMargin(quantity),
                    }}
                >
                    <CartesianGrid />
                    <XAxis
                        dataKey="x"
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        ticks={years}
                        interval={0}
                        stroke={theme.palette.text.secondary}
                        style={theme.typography.body2}
                    >
                        <Label
                            position="bottom"
                            offset={0}
                            style={{
                                textAnchor: "middle",
                                fill: theme.palette.text.primary,
                                ...theme.typography.body1,
                            }}
                        >
                            Year
                        </Label>
                    </XAxis>
                    <YAxis
                        dataKey="y"
                        type="number"
                        stroke={theme.palette.text.secondary}
                        style={theme.typography.body2}
                    >
                        {yAxisLabels(quantity, units, theme)}
                    </YAxis>
                    {series.map((s) => (
                        <Scatter
                            key={s.scenarioId}
                            name={prettifyScenarioId(s.scenarioId)}
                            hide={hidden.has(prettifyScenarioId(s.scenarioId))}
                            isAnimationActive={false}
                            data={s.points}
                            fill={colour(s.scenarioId)}
                            line
                            shape="dot"
                        />
                    ))}
                    {historical.length > 0 ? (
                        <Scatter
                            name="Historical"
                            hide={hidden.has("Historical")}
                            isAnimationActive={false}
                            data={historical}
                            fill={colour("historical")}
                            shape="diamond"
                        />
                    ) : null}
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="top"
                        onClick={toggleSeries}
                        wrapperStyle={{ cursor: "pointer" }}
                    />
                </ScatterChart>
            </ResponsiveContainer>
        </>
    )
}

const hasUnits = (units) => units && units != "none"

/** Y-axis label: the quantity, then the units on a second line; or, where the
 *  quantity is given as a heading instead, just the units. */
function yAxisLabels(quantity, units, theme) {
    const unitsLines = hasUnits(units) ? ["(" + units + ")"] : []
    const lines = quantity
        ? [quantityLabel(quantity), ...unitsLines]
        : unitsLines
    return lines.map((line, i) => (
        <Label
            key={i}
            angle={270}
            offset={14 + 18 * (lines.length - 1 - i)}
            position="left"
            style={{
                textAnchor: "middle",
                fill: theme.palette.text.primary,
                ...theme.typography.body1,
            }}
        >
            {line}
        </Label>
    ))
}

/** Left margin of a chart, allowing for the lines of its y-axis label. */
function yAxisMargin(quantity) {
    return quantity ? 50 : 32
}

/** Name of what is plotted, above the chart, where long names have room,
 *  with a button to copy the chart data on the right. */
function ChartHeading(props) {
    const { children, onCopy } = props
    if (!children && !onCopy) return null
    const buttonWidth = 28
    return (
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
            {/* balances the copy button, so that the heading is centred */}
            <Box sx={{ width: buttonWidth, flexShrink: 0 }} />
            <Typography
                sx={{
                    flexGrow: 1,
                    fontSize: 14,
                    fontWeight: 500,
                    textAlign: "center",
                }}
            >
                {children}
            </Typography>
            <Box sx={{ width: buttonWidth, flexShrink: 0 }}>
                {onCopy ? (
                    <MuiTooltip title="Copy data">
                        <IconButton
                            aria-label="copy data"
                            size="small"
                            onClick={onCopy}
                        >
                            <ContentCopy fontSize="inherit" color="primary" />
                        </IconButton>
                    </MuiTooltip>
                ) : null}
            </Box>
        </Box>
    )
}

const quantityLabel = (quantity) => (quantity ? prettify(quantity) : "Value")

function prettify(text) {
    var pretty = text.replaceAll("_", " ")
    pretty = pretty.charAt(0).toUpperCase() + pretty.slice(1)
    return pretty
}
