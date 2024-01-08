/* eslint-disable */
import * as React from "react"
import { useTheme } from "@mui/material/styles"
import { blue, purple, lime, pink, teal } from '@mui/material/colors';
import Box from "@mui/material/Box"
import {
    BarChart,
    XAxis,
    YAxis,
    Label,
    LabelList,
    Legend,
    Tooltip,
    Bar,
    CartesianGrid,
    ResponsiveContainer
} from "recharts"
import Title from "./Title"
import { scoreText } from "../data/CalculationResult";

const colours = {
    0 : purple[800],
    1 : lime[900],
    2 : pink[900],
    3 : blue[900],
    4 : teal[800]
}

export default function SingleAssetBarChart(props) {
    const { title, data, scenarios } = props // hazardType
    const theme = useTheme()
    if (!data)
        return (<></>)
    let barsData = data.map(d => {
        let barGroupItem = {...d};
        for (const [s, v] of Object.entries(barGroupItem))
        {
            if (s != "year") { // s is then scenario
                let value = barGroupItem[s]
                barGroupItem[s + "_label"] = value
                barGroupItem[s] = value <= 0 ? 0.1 : value 
            }
        };
        return barGroupItem;
    })
    return (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', flexDirection: 'row' }}>
            <Box sx={{ width: '100%' }}>
            <Title>{title}</Title>
            <ResponsiveContainer width="100%" height={200}>
                <BarChart 
                    data={barsData} 
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 0,
                  }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="year" 
                        stroke={theme.palette.text.secondary}
                        style={theme.typography.body2}
                                            />
                    <YAxis
                        domain={[dataMin => 0, dataMax => 4]}
                        interval={0}
                        stroke={theme.palette.text.secondary}
                        style={theme.typography.body2}
                        ticks={[0, 1, 2, 3, 4]}
                        tickFormatter={(t) => scoreText(t)}
                    >
                        <Label
                            angle={270}
                            position="insideLeft"
                            style={{
                                textAnchor: "middle",
                                fill: theme.palette.text.primary,
                                ...theme.typography.body1
                            }}
                    />
                    </YAxis>
                    <Legend />
                    {scenarios.map((scenario, i) => {
                        return (
                        <Bar dataKey={scenario} key={i} fill={theme.graphs[i]} barSize={10} >
                        </Bar>)
                    })}
                </BarChart>
            </ResponsiveContainer>
            </Box>
        </Box>
    )
}