import * as React from "react"
import PropTypes from "prop-types"
import { Link as RouterLink } from "react-router-dom"
import ListItem from "@mui/material/ListItem"
import ListItemIcon from "@mui/material/ListItemIcon"
import ListItemText from "@mui/material/ListItemText"
import Typography from "@mui/material/Typography"
import { styled } from "@mui/material/styles"

export function ListItemLink(props) {
    const { icon, primary, to } = props

    const renderLink = React.useMemo(
        () =>
            React.forwardRef(function Link(itemProps, ref) {
                return (
                    <RouterLink
                        to={to}
                        ref={ref}
                        {...itemProps}
                        role={undefined}
                    />
                )
            }),
        [to]
    )

    return (
        <li>
            <StyledListItem button component={renderLink}>
                {icon ? <StyledListItemIcon>{icon}</StyledListItemIcon> : null}
                <StyledListItemText
                    primary={
                        <Typography style={{ fontSize: 14 }}>
                            {primary}
                        </Typography>
                    }
                />
            </StyledListItem>
        </li>
    )
}

ListItemLink.propTypes = {
    icon: PropTypes.element,
    primary: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
}

const StyledListItem = styled(ListItem)`
    margin: 10px 10px 0;
    border-radius: 5px;
    padding: 10px 15px;
    width: auto;

    color: #f2f2f2;
    :hover,
    :focus,
    :visited {
        background: rgba(255, 255, 255, 0.13);
        opacity: 1;
    }
`

const StyledListItemIcon = styled(ListItemIcon)`
    color: #f2f2f2;
`

const StyledListItemText = styled(ListItemText)`
    text-transform: uppercase;
    .MuiListItemText-primary {
        font-size: 2;
    }
`
