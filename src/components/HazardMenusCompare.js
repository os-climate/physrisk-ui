/* eslint-disable */
import React, { useRef } from "react"
import { useTheme } from "@mui/material/styles"
import { IconButton, Popover, Tooltip, Typography, styled } from "@mui/material";
import Box from "@mui/material/Box"
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Collapse from '@mui/material/Collapse';
import HazardMenus from "./HazardMenus.js"
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

/* Component comprising two hazard menu selectors. Keeping disabled until this
feature is complete.
 */
export default function HazardMenusCompare(props) {
    const { hazardMenu1, hazardMenuDispatch1 } = props
    //const { hazardMenu1, hazardMenuDispatch1, hazardMenu2, hazardMenuDispatch2 } = props
    //const [open, setOpen] = React.useState(false);

    //const handleClick = () => {
    //    setOpen(!open);
    //  };

    return (
        <React.Fragment>
            <HazardMenus hazardMenu={hazardMenu1} hazardMenuDispatch={hazardMenuDispatch1} />
            {/* <Box sx={{ display: "flex", alignItems: "center" }}>
                <HazardMenus hazardMenu={hazardMenu1} hazardMenuDispatch={hazardMenuDispatch1} />
                <Tooltip title="Compare to indicator">
                    <IconButton onClick={handleClick}>
                        {open ? <ExpandLess color="primary" /> : <ExpandMore color="primary" />}
                    </IconButton>
                </Tooltip>
            </Box>
            <Collapse in={open} timeout="auto" unmountOnExit>
                <HazardMenus hazardMenu={hazardMenu1} hazardMenuDispatch={hazardMenuDispatch1} />
            </Collapse> */}
        </React.Fragment>
    )
}