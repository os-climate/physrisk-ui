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
import { Divider, FormControl, InputLabel, MenuItem, Paper } from "@mui/material";
import LineGraph from "./LineGraph";

const data = [
    {
        "hazardType": "Riverine" + "\n" + "flood",
        "mean": 0.01,
        "100Year": 0.03,
    },
    {
        "hazardType": "Coastal flood",
        "mean": 0.0,
        "100Year": 0.0,
    },
    {
        "hazardType": "Chronic heat",
        "mean": 0.02,
        "100Year": 0.05,
    },
    {
        "hazardType": "Acute heat",
        "mean": 0.001,
        "100Year": 0.003,
    },
    {
        "hazardType": "Water \n stress",
        "mean": 0.004,
        "100Year": 0.004,
    }
]

const hazardNames: { [id: string]: string; } = {
    "RiverineInundation": "Riverine flood",
    "CoastalInundation": "Coastal flood",
    "ChronicHeat": "Chronic heat",
    "AcuteHeat": "Acute heat",
    "WaterStress": "Water stress",
 };

export default function AssetImpactSummary(props: { assetIndex: any, assetImpact: any }) {
    const { assetIndex, assetImpact } = props
    const theme = useTheme()
    console.log(assetIndex)
    return (
        <React.Fragment>
            <Typography component="h2" variant="h6" align="center" color={theme.palette.text.primary} gutterBottom>
                Impact summary
            </Typography>
            <RadarChart margin={{ top: 0, left: 0, right: 0, bottom: 0 }} startAngle={90} endAngle={-270} innerRadius={20} outerRadius={80} width={400} height={200} data={data} style={{ margin: "20 auto" }}>
                <PolarGrid />
                <PolarAngleAxis dataKey="hazardType" 
                    style={theme.typography.body2}
                    dy={3}
                />
                <PolarRadiusAxis angle={90-360/10} 
                    domain={[0, 0.05]} 
                    style={theme.typography.body2}
                    stroke={theme.palette.text.secondary}
                    tickFormatter={tick => (tick * 100).toPrecision(2)+ "%"} //eslint-disable-line no-unused-vars
                    dx={1} />
                <Radar name="Mean" dataKey="mean" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Radar name="100 year return" dataKey="100Year" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
            </RadarChart>
            <AssetImpactGraphs assetIndex={0} assetImpact={assetImpact} />
        </React.Fragment>
    )
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

    console.log(hazardNames)

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
                        <MenuItem value={key}>{hazardNames[key]}</MenuItem>)}
                </Select>
            </FormControl>
            <Divider />
            <SingleHazardTypeGraph singleHazardImpact={singleHazardImpact}></SingleHazardTypeGraph>
        </Box>
      )
    }

function SingleHazardTypeGraph(props: { singleHazardImpact: any }) {
    const { singleHazardImpact } = props
    
    //const impact_bins = singleHazardImpact.impact_bin_edges
    //const impact_probs = singleHazardImpact.probabilities

    //const hazard_bins = singleHazardImpact.calc_details.hazard_distribution.intensity_bin_edges
    //const hazard_probs = singleHazardImpact.calc_details.hazard_distribution.probabilities

    //const hazard_return_periods = singleHazardImpact.calc_details.hazard_exceedance.return_periods
    //const hazard_intensities = singleHazardImpact.calc_details.hazard_exceedance.intensities

    return (
        <Box
            sx={{
                //p: 2,
                //display: "flex",
                //flexDirection: "column",
                width: "100%",
                height: 250,
            }}>
                <LineGraph 
                        x={singleHazardImpact.impact_exceedance.exceed_probabilities}
                        y={(singleHazardImpact.impact_exceedance.values as any[]).map(v => v*100)}
                        xQuantity="Exceedance probability" 
                        yQuantity="% impact"
                        />
        </Box>)
}

 
