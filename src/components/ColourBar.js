import React from "react"
import { useTheme } from "@mui/material/styles"
import {
    Area,
    AreaChart,
    CartesianGrid,
    CartesianAxis,
    XAxis,
    YAxis,
    ResponsiveContainer,
} from "recharts"

export function ColourBar(props) {
    const { colorbarData, colorbarStops, units } = props
    const theme = useTheme()
    return (
        <ResponsiveContainer width={"100%"} height={50}>
            <AreaChart
                data={colorbarData}
                margin={{ top: 6, right: 7, left: 7, bottom: 8 }}
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
                        {/* <stop offset="0%" stopColor="#FF0000" stopOpacity={1.0}/>
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity={1.0}/> */}
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
                        value: "Intensity" + ((units && units != "" && units.toLowerCase() != "none") ?
                                " (" + units + ")" : ""),
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
    )
}