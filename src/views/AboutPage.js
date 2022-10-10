import { React } from "react"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import { useTheme } from "@mui/material/styles"
//import { Typography } from "@mui/material"

export default function AboutPage() {
    const theme = useTheme()
    return (
        <Grid container spacing={0} sx={{ m: 0, p: 0 }} >
            <Grid item xs={12} md={12} lg={12} sx={{ p: 0, m: 0 }} >
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
                    The OS-Climate Physical Risk app is intended to be a
                    reference UI: a place to test visualizations and receive
                    feedback.
                </Paper>
            </Grid>
        </Grid>
    )
}
