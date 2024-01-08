import React from "react"
import { useTheme } from "@mui/material/styles"
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from "recharts"
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { Divider, FormControl, InputLabel, MenuItem, Tooltip } from "@mui/material";
import ExceedancePlot from "../components/Chart"
import LineGraph from "./LineGraph";
import Title from "./Title";

interface DataItem {
    displayName: string;
    key: string;
    mean: number;
    return100: number; 
}

const data: DataItem[] = [
    {
        "displayName": "Riverine \n flood: fractional asset damage/disruption as a result of an inundation event occurring in specified year",
        "key": "RiverineInundation",
        "mean": 0.01,
        "return100": 0.03,
    },
    {
        "displayName": "Coastal flood: fractional annual asset damage/disruption as a result of an inundation event occurring in specified year",
        "key": "CoastalInundation",
        "mean": 0.0,
        "return100": 0.0,
    },
    {
        "displayName": "Chronic heat: fractional disruption (e.g. fractional labour loss) occurring in specified year",
        "key": "ChronicHeat",
        "mean": 0.02,
        "return100": 0.05,
    },
    {
        "displayName": "Acute heat",
        "key": "AcuteHeat",
        "mean": 0.001,
        "return100": 0.003,
    },
    {
        "displayName": "Water \n stress",
        "key": "WaterStress",
        "mean": 0.004,
        "return100": 0.004,
    }
]

const hazardNames: { [id: string]: string; } = {
    "RiverineInundation": "Riverine flood",
    "CoastalInundation": "Coastal flood",
    "ChronicHeat": "Chronic heat",
    "AcuteHeat": "Acute heat",
    "WaterStress": "Water stress",
 };

export default function AssetImpactSummary(props: { singleHazardImpact: any }) {
    const { singleHazardImpact } = props
    const theme = useTheme()
    if (!singleHazardImpact?.curveSet) {
        return (<></>)
    }
    let curveSet = singleHazardImpact.curveSet
    return (
        (curveSet && Object.entries(curveSet).length > 0) ?
        <Box>
            {/* <Typography style={theme.typography.h1}>
                {singleHazardImpact.hazardType + " impacts"}
            </Typography> */}
            {/* <Title>{singleHazardImpact.hazardType + " impacts"}</Title> */}
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', flexDirection: 'row' }} >
                <Box sx={{ width: '100%', height: 280 }} >
                    <ExceedancePlot
                            title={singleHazardImpact.hazardType + " impacts (" + singleHazardImpact.scenario + ")"} 
                            dataSets={curveSet.curves}
                            quantity="Impact" 
                            units={curveSet.units}
                            graphType="exceedance"
                            />
                </Box>
            </Box>
        </Box> : <Box></Box>)
}

function AssetImpactSummaryOld(props: { assetIndex: any, assetImpact: any }) {
    const { assetIndex, assetImpact } = props
    const theme = useTheme()

    if (assetIndex == null || !assetImpact) {
        return (
            <React.Fragment>
                <Typography component="h2" variant="h6" align="center" color={theme.palette.text.primary} gutterBottom
                    width={200} height={50}>
                    Impact summary
                </Typography>
                <Typography align="center" style={theme.typography.body2}>
                    [Not calculated]
                </Typography>
            </React.Fragment>)
    }
    const impacts: any[] = assetImpact.impacts
    const dataItems: DataItem[] = data.map(d => getRadarData(impacts, d))

    function customTick({ payload, x, y, textAnchor, stroke, radius }: any) {
        return (
          <g
            className="recharts-layer recharts-polar-angle-axis-tick"
          >
            <Tooltip title={payload.value.split(':').length > 1 ? payload.value.split(':')[1].trim() : payload.value} arrow>
                <text
                    radius={radius}
                    stroke={stroke}
                    x={x}
                    y={y}
                    className="recharts-text recharts-polar-angle-axis-tick-value"
                    text-anchor={textAnchor} 
                >
                <tspan x={x} dy="0em">
                    {payload.value.split(':')[0]}
                </tspan>
                </text>
            </Tooltip>
          </g>
        );
      }

    return (
        <React.Fragment>
            <Typography component="h2" variant="h6" align="center" color={theme.palette.text.primary} gutterBottom>
                Impact summary
            </Typography>
            <RadarChart margin={{ top: 0, left: 0, right: 0, bottom: 0 }} startAngle={90} endAngle={-270} innerRadius={20} outerRadius={80} width={400} height={200} data={dataItems} style={{ margin: "20 auto" }}>
                <PolarGrid />
                <PolarAngleAxis dataKey="displayName" 
                    style={theme.typography.body2}
                    dy={3}
                    tick={customTick}
                />
                <PolarRadiusAxis angle={90-360/10} 
                    domain={[0, 0.05]} 
                    style={theme.typography.body2}
                    stroke={theme.palette.text.secondary}
                    tickFormatter={tick => (tick * 100).toPrecision(2)+ "%"} //eslint-disable-line no-unused-vars
                    dx={1} />
                <Radar name="Mean" dataKey="mean" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Radar name="100 year return" dataKey="return100" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
            </RadarChart>
            <AssetImpactGraphs assetIndex={0} assetImpact={assetImpact} />
        </React.Fragment>
    )
}

function getRadarData(impacts: any[], item: DataItem): DataItem
{
    const singleHazardImpact = impacts.filter(i => i.hazard_type == item.key)[0]
    if (singleHazardImpact)
    {
        const probs: number[] = singleHazardImpact.impact_exceedance.exceed_probabilities
        const values: number[] = singleHazardImpact.impact_exceedance.values
        const index = probs.findIndex(p => p < 0.01)
    }
    return { displayName: item.displayName, key: item.key, mean: singleHazardImpact ? singleHazardImpact.impact_mean : 0, return100: singleHazardImpact ? singleHazardImpact.impact_mean : 0
    }
}

function AssetImpactGraphs(props: { assetIndex: any, assetImpact: any }) {
    const { assetIndex, assetImpact } = props
    const theme = useTheme()
    
    const [value, setValue] = React.useState(Object.keys(hazardNames)[0]);

    const handleChange = (event: SelectChangeEvent<string>) => {
        setValue(event.target.value);
      };

    if (!assetImpact) return (<Box></Box>);

    const impacts: any[] = assetImpact.impacts // calculationResult.asset_impacts[assetIndex].impacts
    
    const singleHazardImpact = impacts.filter(i => i.hazard_type == value)[0]

    return (
        <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" >
            <FormControl sx={{ m: 1, minWidth: 80 }} size="small">
                <InputLabel id="hazard-select-label">Hazard</InputLabel>
                <Select
                    labelId="hazard-select-label"
                    id="demo-simple-select"
                    value={value}
                    label="Hazard"
                    onChange={handleChange}
                >
                    {Object.keys(hazardNames).map((key, index) => 
                        <MenuItem value={key} key={key}>{hazardNames[key]}</MenuItem>)}
                </Select>
            </FormControl>
            <Divider />
            <SingleHazardTypeGraph singleHazardImpact={singleHazardImpact}></SingleHazardTypeGraph>
        </Box>
      )
    }

function SingleHazardTypeGraph(props: { singleHazardImpact: any }) {
    const { singleHazardImpact } = props
    
    return (
        singleHazardImpact ?
        <Box
            sx={{
                width: "100%",
                height: 250,
            }}>
                <LineGraph 
                        x={singleHazardImpact.impact_exceedance.exceed_probabilities}
                        y={(singleHazardImpact.impact_exceedance.values as any[]).map(v => v*100)}
                        xQuantity="Exceedance probability" 
                        yQuantity="% impact"
                        />
        </Box> : <Box></Box>)
}

 
