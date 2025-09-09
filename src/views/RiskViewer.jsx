import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import { React } from "react"
import { useTheme } from "@mui/material/styles"

export default function RiskViewer() {
    const theme = useTheme()
    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={12} lg={12}>
                <Paper
                    sx={{
                        p: 2,
                        bottom: "10px",
                        color: theme.palette.text.primary,
                        display: "block",
                        fontSize: "13px",
                        lineHeight: "13px",
                    }}
                >
                    Risk viewer goes here.
                </Paper>
            </Grid>
        </Grid>
    )
}
