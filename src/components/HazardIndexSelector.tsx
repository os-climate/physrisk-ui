import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';

export default function HazardIndexSelector(props: { 
    allIndexValues: any[],
    availableIndexValues: any[],
    indexDisplayName: string,
    indexSelectedValue: any,
    indexUnits: string,
    indexValuesDispatch: React.Dispatch<any>,
  }) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (indexValue: string) => {
    setAnchorEl(null);
  };
  const handleSelected = (indexValue: string) => {
    setAnchorEl(null);
    props.indexValuesDispatch({ type: 'SELECTED', payload: { indexSelectedValue: indexValue }});
  };
  var buttonText = props.indexDisplayName + 
    (props.indexSelectedValue !== null ? (": " + props.indexSelectedValue + 
      (props.indexUnits ? " " + props.indexUnits : ""))
       : "");

  return (
    <Box> 
      <Button
        id="basic-hazard-index"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        // endIcon={props.buttonIcon}
        size="small"
        sx={{ overflow: "auto", flexShrink: 0, fontSize: 11, fontWeight: 400,
          m: 0,
          p: 0,
          display: (props.allIndexValues?.length > 1) ? undefined : 'none' 
         }}
      >
        {buttonText}
      </Button>
      <Menu
        id="basic-hazard-index-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-hazard-button',
        }}
      >
        {props.availableIndexValues.map((option) => 
          <MenuItem sx={{ fontSize: 14 }} onClick={() => handleSelected(option)} key={option}>{option}</MenuItem>)
        }
      </Menu>
    </Box>
  );
}

export { HazardIndexSelector };

