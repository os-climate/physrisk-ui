import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';

export default function HazardIndexSelector(props: { buttonText: string,
    // buttonIcon: any,
    menuOptions: string[] 
    // onPortfolioSelected: any 
  }) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (portfolioName: string) => {
    setAnchorEl(null);
  };
  const handleSelected = (portfolioName: string) => {
    setAnchorEl(null);
    // props.onPortfolioSelected(portfolioName);
  };
  // sx={{ overflow: "auto", flexShrink: 0 }}>
  // sx={{
  //               width: 175,
  //               fontSize: 11,
  //               fontWeight: 400
  //           }}
  //           margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
  
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
        sx={{ overflow: "auto", flexShrink: 0, fontSize: 11, fontWeight: 400 }}
      >
        {props.buttonText}
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
        {props.menuOptions.map((option) => 
          <MenuItem sx={{ fontSize: 14 }} onClick={() => handleSelected(option)} key={option}>{option}</MenuItem>)
        }
      </Menu>
    </Box>
  );
}

export { HazardIndexSelector };

    //     <Button
    //         sx={{
    //             width: 175,
    //             fontSize: 11,
    //             fontWeight: 400
    //         }}
    //         margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
    //         size="small"
    //         id="hazard-index"
    //         //aria-controls={open ? 'demo-positioned-menu' : undefined}
    //         aria-haspopup="true"
    //         //aria-expanded={open ? 'true' : undefined}
    //         //onClick={handleClick}
    //     >
    //         Hazard index
    //     </Button>
    //     <Menu
    //         id="hazard-index-menu"
    //         aria-labelledby="hazard-index"
    //         //anchorEl={anchorEl}
    //         //open={open}
    //         //onClose={handleClose}
    //         anchorOrigin={{
    //         vertical: 'top',
    //         horizontal: 'left',
    //         }}
    //         transformOrigin={{
    //         vertical: 'top',
    //         horizontal: 'left',
    //         }}
    //     >
    //         <MenuItem>100 years</MenuItem>
    //         {/* <MenuItem onClick={handleClose}>200 years</MenuItem>
    //         <MenuItem onClick={handleClose}>1000 years</MenuItem> */}
    //     </Menu>
    // )
