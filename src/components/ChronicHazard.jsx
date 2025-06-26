import * as React from "react"
import Typography from "@mui/material/Typography"
import Title from "./Title"

function ChronicHazard(props) {
    const { title, data, units } = props
    return (
        <React.Fragment>
            <Title>{title}</Title>
            <Typography
                color="text.secondary"
                sx={{ flex: 1, overflow: "auto" }}
            >
                {data[0].y.toPrecision(5) + " " + units}
            </Typography>
        </React.Fragment>
    )
}

export default ChronicHazard
