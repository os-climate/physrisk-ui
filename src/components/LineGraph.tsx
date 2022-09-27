import * as React from "react"
import { useTheme } from "@mui/material/styles"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Label,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts"
import Title from "./Title"

// Generate Sales Data
function graphDataPoint(x: number, y: number) {
    return { x, y }
}

function dataFromArrays(x: number[], y: number[]) {    
    var points = x.map((item, i) =>
        graphDataPoint(item, y[i]))
    
    points = points.filter(i => i.x > 0)
    //const sorted = unsorted.sort((i, j) => i.x - j.x)
    return points
}

export default function LineGraph(props: { title?: any, x: number[], y: number[], 
    xQuantity: string, yQuantity: string, xUnits?: string, yUnits?: string  }) {
    const { title, x, y, xQuantity, yQuantity, xUnits, yUnits } = props
    const theme = useTheme()

    return (
        <React.Fragment>
            <Title>{title}</Title>
            <ResponsiveContainer>
                <LineChart
                    data={dataFromArrays(x, y)}
                    margin={{
                        top: 16,
                        right: 24,
                        bottom: 34,
                        left: 24,
                    }}
                >
                    <XAxis
                        dataKey="x"
                        stroke={theme.palette.text.secondary}
                        style={theme.typography.body2}
                        scale="log"
                        interval="preserveStartEnd"
                        domain={["dataMin", "dataMax"]}
                        type="number"
                        reversed
                        ticks={[0.002, 0.005, 0.01, 0.05, 0.1, 0.5]}
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
                            {xQuantity + (xUnits ? "[" + xUnits + "]" : "")}
                        </Label>
                    </XAxis>
                    <YAxis
                        stroke={theme.palette.text.secondary}
                        style={theme.typography.body2}
                    >
                        <Label
                            angle={270}
                            position="left"
                            style={{
                                textAnchor: "middle",
                                fill: theme.palette.text.primary,
                                ...theme.typography.body1,
                            }}
                        >
                            {yQuantity + (yUnits ? "[" + yUnits + "]" : "")}
                        </Label>
                    </YAxis>
                    <Line
                        isAnimationActive={false}
                        type="monotone"
                        dataKey="y"
                        stroke={theme.palette.primary.main}
                        dot={true}
                    />
                    <CartesianGrid horizontal={true} vertical={true} />
                </LineChart>
            </ResponsiveContainer>
        </React.Fragment>
    )
}
