import React from "react"
import { useTheme } from "@mui/material/styles"
import Box from '@mui/material/Box';
import { ExceedancePlot } from "../components/Chart"


export function AssetImpactSummary(props: { singleHazardImpact: any }) {
    const { singleHazardImpact } = props
    const theme = useTheme()
    if (!singleHazardImpact?.impactCurveSet) {
        return (<></>)
    }
    let curveSet = singleHazardImpact.impactCurveSet
    return (
        (curveSet && Object.entries(curveSet).length > 0) ?
        <Box>
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

export function AssetHazardSummary(props: { singleHazardImpact: any }) {
    const { singleHazardImpact } = props
    const theme = useTheme()
    if (!singleHazardImpact?.hazardCurveSet) {
        return (<></>)
    }
    let curveSet = singleHazardImpact.hazardCurveSet
    return (
        (curveSet && Object.entries(curveSet).length > 0) ?
        <Box>
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', flexDirection: 'row' }} >
                <Box sx={{ width: '100%', height: 280 }} >
                    <ExceedancePlot
                            title={singleHazardImpact.hazardType + " indicators (" + singleHazardImpact.scenario + ")"} 
                            dataSets={curveSet.curves}
                            quantity="Indicator value" 
                            units={curveSet.units}
                            graphType="exceedance"
                            />
                </Box>
            </Box>
        </Box> : <Box></Box>)
}

 
