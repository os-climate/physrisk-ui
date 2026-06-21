import Grid from "@mui/material/Grid"
import Link from "@mui/material/Link"
import Paper from "@mui/material/Paper"
import Typography from "@mui/material/Typography"
import { useTheme } from "@mui/material/styles"

export default function AboutPage() {
    const theme = useTheme()
    return (
        <Grid container spacing={0} sx={{ m: 0, p: 0 }}>
            <Grid item xs={12} md={12} lg={12} sx={{ p: 0, m: 0 }}>
                <Paper
                    sx={{
                        p: 2,
                        color: theme.palette.text.primary,
                        display: "block",
                        fontSize: "13px",
                        lineHeight: "20px",
                    }}
                >
                    <Typography variant="body2" gutterBottom>
                        The OS-Climate physical risk app is intended to be a
                        reference UI: a place to test visualizations and receive
                        feedback.
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                        <Link
                            href="https://physrisk.readthedocs.io/en/latest/"
                            target="_blank"
                            rel="noopener"
                        >
                            Physrisk documentation
                        </Link>
                    </Typography>
                    <Typography variant="body2">
                        <Link
                            href="https://www.finos.org/os-climate"
                            target="_blank"
                            rel="noopener"
                        >
                            OS-Climate on FINOS
                        </Link>
                    </Typography>
                </Paper>
            </Grid>
        </Grid>
    )
}
