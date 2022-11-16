import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';

export default function MenuButton(props: { buttonText: string,
    buttonIcon: any,
    menuOptions: string[] 
    onPortfolioSelected: any 
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
    props.onPortfolioSelected(portfolioName);
  };

  return (
    <Box sx={{ overflow: "auto", flexShrink: 0 }}>
      <Button
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        endIcon={props.buttonIcon}
        size="small"
        sx={{ overflow: "auto", flexShrink: 0 }}
      >
        {props.buttonText}
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        {props.menuOptions.map((option) => 
          <MenuItem sx={{ fontSize: 14 }} onClick={() => handleSelected(option)} key={option}>{option}</MenuItem>)
        }
      </Menu>
    </Box>
  );
}

export { MenuButton };