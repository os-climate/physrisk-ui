import * as React from "react"
import { useTheme } from "@mui/material/styles"
import Box from "@mui/material/Box"
import { ContentCopy } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton"
import { Paper, styled } from "@mui/material";
import Typography from "@mui/material/Typography";
import { scaleLinear as d3ScaleLinear, scaleLog as d3ScaleLog } from 'd3-scale';
import {
    CartesianGrid,
    Scatter,
    ScatterChart,
    XAxis,
    YAxis,
    Label,
    ResponsiveContainer,
    Tooltip
} from "recharts"
import Title from "./Title"

function graphDataPoint(x, y) {
    return { x, y }
}

export default function ExceedancePlot(props) {
    const { title, data, quantity, units, graphType } = props
    
    const theme = useTheme()

    var dataPoints, ticks, labelTicks, tickFormat, domain, scale, tickFormatAll
    if (graphType == "exceedance")
    {
        dataPoints = data.map((item) =>
            graphDataPoint(
                1.0 / item.x,
                item.y)
        )
        
        domain = dataPoints.map(d => d.x)
        scale = d3ScaleLog().domain(domain).range([0, 1]);
        ticks = scale.ticks(10)
        tickFormatAll = scale.tickFormat(10, "f")
        tickFormat = (t) => (Math.log10(t) % 1 == 0 ? tickFormatAll(t) : '')
    }
    else
    {
        dataPoints = data
        domain = dataPoints.map(d => d.x)
        scale = d3ScaleLinear().domain(domain).range([0, 1]);
        ticks = scale.ticks(10)
        labelTicks = scale.ticks(5)
        tickFormatAll = scale.tickFormat(10, "f")
        tickFormat = (t) => (labelTicks.includes(t) ? tickFormatAll(t) : '')
    }
    
    const xAxisLabel = graphType == "returnPeriod" ? "Return period (years)" : "Exceedance probability"
    const xAxisLabelShort = graphType == "returnPeriod" ? "Return period" : "Exceedance prob"
    const xAxisLabelUnits = graphType == "returnPeriod" ? " years" : ""

    function copyData()
    {
        const returns = "returns = array(" + dataPoints.reverse().map(d => d.x.toPrecision(8)).join(',') + ")"
        const intensity = "intensity = array(" + dataPoints.reverse().map(d => d.y.toPrecision(8)).join(',') + ")"
        window.navigator.clipboard.writeText(returns + "\n" + intensity)
    }

    const Item = styled(Paper)(({ theme }) => ({
        ...theme.typography.body2,
        textAlign: 'center',
        color: theme.palette.text.secondary,
        //height: 60,
        lineHeight: '60px',
      }));

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
          return (
            <Item elevation={4}>
                <Typography sx={{ m: 1, fontSize: 14 }}>
                    <pre style={{ fontFamily: 'inherit' }}>
                        {`${xAxisLabelShort}: ${payload[0].value.toPrecision(4) / 1}${xAxisLabelUnits} \n ${prettify(quantity)}: ${payload[1].value.toPrecision(4)} ${units}`}
                    </pre>
                </Typography>
            </Item>
          );
        }
      
        return null;
      }

    return (
        <React.Fragment>
            <Box sx={{ width: '100%', height: '100%', position: "relative" }} 
                // sx={{
                //     position: "relative"
                // }}
            >
            <Title>{title}</Title>
            <IconButton sx={{
                position: "absolute",
                //top: 40,
                right: 0,
                bottom: 14,
                //top: 0,
                zIndex: 1,
                    }} aria-label="info" size="small" onClick={copyData}>
                <ContentCopy fontSize="inherit" color="primary" />
            </IconButton>
            <ResponsiveContainer>
                <ScatterChart
                    data={dataPoints}
                    margin={{
                        top: 16,
                        right: 18,
                        bottom: 34,
                        left: 42,
                    }}
                >
                    <CartesianGrid />
                    <XAxis
                        dataKey="x"
                        type="number"
                        stroke={theme.palette.text.secondary}
                        style={theme.typography.body2}
                        reversed={graphType == "exceedance"}
                        domain={['dataMin', 'dataMax']}
                        //domain={['auto', 'auto']}
                        interval={0}
                        tickFormatter = {tickFormat}
                        scale={(graphType == "returnPeriod") ? "linear" : "log"}
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
                        dataKey="y"
                        type="number"
                        stroke={theme.palette.text.secondary}
                        style={theme.typography.body2}
                    >
                        <Label
                            angle={270}
                            offset={32}
                            position="left"
                            style={{
                                textAnchor: "middle",
                                fill: theme.palette.text.primary,
                                ...theme.typography.body1,
                            }}>
                            {prettify(quantity)}
                        </Label>
                        <Label
                            angle={270}
                            offset={16}
                            position="left"
                            style={{
                                textAnchor: "middle",
                                fill: theme.palette.text.primary,
                                ...theme.typography.body1,
                            }}>
                            {"(" + units + ")"}
                        </Label>
                    </YAxis>
                    <Scatter name="" isAnimationActive={false} data={dataPoints} fill={theme.palette.primary.main} line shape="dot" />
                    <Tooltip content={<CustomTooltip />} />
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

function prettify(text) {
    var pretty = text.replace("_", " ")
    pretty = pretty.charAt(0).toUpperCase() + pretty.slice(1);
    return pretty
}
