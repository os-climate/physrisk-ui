/* eslint-disable */
import React, { useRef } from "react"
import { useTheme } from "@mui/material/styles"
import { IconButton, Popover, Tooltip, Typography, styled } from "@mui/material"
import Box from "@mui/material/Box"
import Breadcrumbs from "@mui/material/Breadcrumbs"
import Collapse from "@mui/material/Collapse"
import HazardMenus from "./HazardMenus.jsx"
import ExpandLess from "@mui/icons-material/ExpandLess"
import ExpandMore from "@mui/icons-material/ExpandMore"

/* Component comprising two hazard menu selectors. Keeping disabled until this
feature is complete.
 */
export default function HazardMenusCompare(props) {
    const { hazardMenu1, hazardMenuDispatch1 } = props

    return (
        <React.Fragment>
            <HazardMenus
                hazardMenu={hazardMenu1}
                hazardMenuDispatch={hazardMenuDispatch1}
            />
        </React.Fragment>
    )
}
