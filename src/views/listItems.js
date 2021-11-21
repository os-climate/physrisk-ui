import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import LayersIcon from '@mui/icons-material/Layers';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { Assessment, HolidayVillage, LocalFireDepartment, PrecisionManufacturing, Water } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledListItem = styled(ListItem)`
  margin: 10px 15px 0;
  border-radius: 5px;
  padding: 10px 15px;
  width: auto;

  color: #F2F2F2;
  :hover,:focus,:visited {
    background: rgba(255, 255, 255, 0.13);
    opacity: 1;
  }
`;

const StyledListItem2 = styled(ListItem)`
  color: #F2F2F2;
  fill: #F2F2F2;

  margin: 10px 15px 0;
  border-radius: 3px;
  padding: 10px 15px;

  :hover,:focus,:visited {
    background: rgba(255, 255, 255, 0.15);
    opacity: 1;
  }
`;

const StyledListItemIcon = styled(ListItemIcon)`
  color: #F2F2F2;
`;

const StyledListItemText = styled(ListItemText)`
  text-transform: uppercase;  
  .MuiListItemText-primary {
    font-size: 2;
  }
`;

const StyledListSubheader = styled(ListSubheader)`
  color: #AAA;
  background: rgba(255, 255, 255, 0);
`;

const StyledList = styled(List)`
  color: #AAA;
  background: rgba(255, 255, 255, 0);
  padding: 0, margin: 0;
`;

export const mainListItems = (
  <StyledList>
    <StyledListItem button>
      <StyledListItemIcon>
        <DashboardIcon />
      </StyledListItemIcon>
      <StyledListItemText
        disableTypography
        primary={<Typography style={{ fontSize: 14 }}>Dashboard</Typography>}
      />
    </StyledListItem>
    <StyledListItem button>
      <StyledListItemIcon>
        <PrecisionManufacturing />
      </StyledListItemIcon>
      <StyledListItemText
        disableTypography
        primary={<Typography style={{ fontSize: 14 }}>Assets</Typography>}
      />
      {/* <StyledListItemText primary="Assets" /> */}
    </StyledListItem>
    <StyledListItem button>
      <StyledListItemIcon>
        <LocalFireDepartment />
      </StyledListItemIcon>
      <StyledListItemText
        disableTypography
        primary={<Typography style={{ fontSize: 14 }}>Hazards</Typography>}
      />
    </StyledListItem>
    <StyledListItem button>
      <StyledListItemIcon>
        <BarChartIcon />
      </StyledListItemIcon>
      <StyledListItemText
        disableTypography
        primary={<Typography style={{ fontSize: 14 }}>Risk</Typography>}
      />
    </StyledListItem>
  </StyledList>
);

export const secondaryListItems = (
  <div>
    <StyledListSubheader inset>Saved results</StyledListSubheader>
    <StyledListItem button>
      <StyledListItemIcon>
        <AssignmentIcon />
      </StyledListItemIcon>
      <ListItemText primary="Risk analysis" />
    </StyledListItem>

  </div>
);
