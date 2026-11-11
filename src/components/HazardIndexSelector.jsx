import React, { useState } from "react"
import Button from "@mui/material/Button"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import Tooltip from "@mui/material/Tooltip"
import ArrowDropDown from "@mui/icons-material/ArrowDropDown"
import { indexValueCaption } from "../data/HazardIndexValues"

/** Selector, in the map legend, of the index value (e.g. return period or
 *  threshold) shown on the map. Applies to the map only: clicking a location
 *  shows values for all index values. */
export default function HazardIndexSelector(props) {
    const { indexValues, indexValuesDispatch } = props
    const [anchorEl, setAnchorEl] = useState(null)
    if (!(indexValues?.allIndexValues?.length > 1)) return null

    const handleSelected = (indexValue) => {
        setAnchorEl(null)
        indexValuesDispatch({
            type: "SELECTED",
            payload: { indexSelectedValue: indexValue },
        })
    }

    return (
        <>
            <Tooltip
                title={
                    "Select the " +
                    indexValues.indexDisplayName +
                    " shown on the map. Click a point on the map to view all values."
                }
            >
                <Button
                    id="hazard-index-button"
                    aria-controls={anchorEl ? "hazard-index-menu" : undefined}
                    aria-haspopup="true"
                    aria-expanded={anchorEl ? "true" : undefined}
                    onClick={(event) => setAnchorEl(event.currentTarget)}
                    endIcon={<ArrowDropDown />}
                    size="small"
                    sx={{
                        fontSize: 12,
                        fontWeight: 500,
                        textTransform: "none",
                        p: 0,
                        px: 1,
                        minWidth: 0,
                        "& .MuiButton-endIcon": { ml: 0.25, mr: 0 },
                        "&:hover": {
                            backgroundColor: "transparent",
                            textDecoration: "underline",
                        },
                    }}
                >
                    {indexValueCaption(indexValues)}
                </Button>
            </Tooltip>
            <Menu
                id="hazard-index-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                MenuListProps={{ "aria-labelledby": "hazard-index-button" }}
            >
                {indexValues.availableIndexValues.map((v) => (
                    <MenuItem
                        key={v}
                        selected={v == indexValues.indexSelectedValue}
                        onClick={() => handleSelected(v)}
                        sx={{ fontSize: 14 }}
                    >
                        {v}
                    </MenuItem>
                ))}
            </Menu>
        </>
    )
}
