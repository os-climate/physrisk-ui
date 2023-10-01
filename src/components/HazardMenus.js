import React, { useRef } from "react"
import Collapse from '@mui/material/Collapse';
import { Popover, styled } from "@mui/material";
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Chip from '@mui/material/Chip';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Box from "@mui/material/Box"
import TextField from "@mui/material/TextField"
import { Autocomplete } from "@mui/material"
import { useTheme } from "@mui/material/styles"

function Group(props) {
    const { header, children } = props
    const [open, setOpen] = React.useState(false);
    const handleClickExpand = () => {
        setOpen(!open);
    };
    return (
        (!header || children.length == 1) ?
            <React.Fragment>
                {children.map(c => 
                    <ListItemText key={c.key} primaryTypographyProps={{fontSize: '12px'}} primary={c} />
                )}
            </React.Fragment>
        :
            <React.Fragment>
                <ListItemButton onClick={handleClickExpand}>
                    <ListItemText primaryTypographyProps={{fontSize: '12px'}} primary={header} />
                    {open ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={open}>
                    {children.map(c => 
                        <ListItemText sx={{ pl:1 }} key={c.key} primaryTypographyProps={{fontSize: '12px'}} primary={c} />
                    )}
                </Collapse>
            </React.Fragment>
    )
}

export default function HazardMenus(props) {
    const { hazardMenu, hazardMenuDispatch } = props
    if (!hazardMenu.menus) return null

    function setSelectedIndex(menuIndex, selectedIndex) {
        var newSelectedIndices = [...hazardMenu.selectedIndices]
        newSelectedIndices[menuIndex] = selectedIndex
        hazardMenuDispatch({
            type: "update",
            payload: { selectedIndices: newSelectedIndices },
        })
    }

    function onValueChange(menuIndex, newValue) {
        var optionValues = hazardMenu.menuOptions[menuIndex].map(option => option.value)
        if (newValue) setSelectedIndex(menuIndex, optionValues.indexOf(newValue))
    }

    return (
        <Box
            component="div"
            sx={{
                display: "flex",
                maxWidth: "100%",
                alignItems: "center",
                textAlign: "center",
                whiteSpace: "nowrap",
                overflowX: "auto",
                "&::-webkit-scrollbar": {
                    display: "none",
                },
            }}
        >
            <Breadcrumbs aria-label="breadcrumb">
                {hazardMenu.menus.map((item, mIndex) => {
                    return ( 
                        <HazardMenuCrumbs key={mIndex} menu={item} options={hazardMenu.menuOptions[mIndex]} 
                            currentValue={hazardMenu.menuOptions[mIndex][hazardMenu.selectedIndices[mIndex]]}
                            onValueChange={(newValue) => onValueChange(mIndex, newValue)} />
                        
                    )
                })}
            </Breadcrumbs>     
        </Box>
    )
}

const StyledChip = styled(Chip)(({ chiptitle }) => ({
    "&::before": {
      content: `"${chiptitle}"`,
      position: "absolute",
      top: "-14px",
      left: "10px",
      fontSize: "11px",
      padding: "0 8px"
    }
  }));

function HazardMenuCrumbs(props) {
    const { menu, options, currentValue, onValueChange } = props
    const [anchorEl, setAnchorEl] = React.useState(null);
    const theme = useTheme()
    var optionValues = options.map(option => option.value)
    const groups = {}
    options.forEach(({ group, value }) =>
        groups[value] = group ) 
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
      setAnchorEl(event.currentTarget);
    };
    const handleClickDel = (event) => {
        setAnchorEl(event.currentTarget.parentElement);
      };
    const autocompleteTextFieldRef = useRef(null);
    const handleClose = () => {
      setAnchorEl(null);
    };
    return (
        <Box sx={{ pt: 1.5, pb: 1 }}>
            <StyledChip
                sx = {{ minWidth: menu.minWidth }}
                label={currentValue.value}
                onClick={handleClick}
                chiptitle={menu.name}
                deleteIcon={<ExpandMore />}
                onDelete={handleClickDel}
            />
            <Popover
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                TransitionProps={{
                    onEntered: () => autocompleteTextFieldRef.current.focus()
                  }}
            >
                <Autocomplete
                    size="small"
                    blurOnSelect
                    disableClearable
                    groupBy={(option) => option in groups ? groups[option] : option}
                    options={optionValues}
                    renderInput={(params) => <TextField {...params} sx={{ input: { color: theme.palette.primary.main, fontSize: 14 }}} inputRef={autocompleteTextFieldRef} />}
                    onChange={(event, newValue) => {
                        handleClose()
                        onValueChange(newValue)
                    }}
                    openOnFocus
                    value={currentValue.value}
                    renderGroup={(params) => (
                            <li key={params.key}>
                                <Group header={params.group}>
                                    {params.children} 
                                </Group>
                            </li>
                        )}
                    
                    sx={{ width: "320px", boxShadow: 'none', "& .MuiOutlinedInput-root": { border: 0 },
                        "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": { border: 0 },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { border: 0 },
                        "&.Mui-focused": { border: 0 },
                    }}
                    fullWidth
                />
            </Popover>
        </Box>
    );
}



