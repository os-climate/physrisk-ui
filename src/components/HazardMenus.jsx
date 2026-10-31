import React, { useMemo, useRef, useState } from "react"
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete"
import Box from "@mui/material/Box"
import ListSubheader from "@mui/material/ListSubheader"
import MenuItem from "@mui/material/MenuItem"
import Select from "@mui/material/Select"
import Switch from "@mui/material/Switch"
import TextField from "@mui/material/TextField"
import ToggleButton from "@mui/material/ToggleButton"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import ExpandLess from "@mui/icons-material/ExpandLess"
import ExpandMore from "@mui/icons-material/ExpandMore"
import { defaultCompare, prettifyScenarioId } from "../data/HazardInventory"
import { capitalise } from "../data/HazardIndexValues"

export default function HazardMenus(props) {
    const { hazardMenu, hazardMenuDispatch, indexValues, indexValuesDispatch } =
        props
    if (!hazardMenu.selectedModel) return null

    const update = (selection) =>
        hazardMenuDispatch({ type: "update", payload: selection })
    const model = hazardMenu.selectedModel
    const scenario = hazardMenu.selectedScenario
    const compare = hazardMenu.selectedCompare
    const supportsDifference = hazardMenu.inventory.supportsDifference(model)

    return (
        <Box
            sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-start",
                columnGap: 2,
                rowGap: 1,
                pt: 0.5,
                pb: 1,
            }}
        >
            <Labelled
                id="hazard-indicator-label"
                label="Hazard indicator"
                sx={{ flex: "1 1 320px", minWidth: 260, maxWidth: 520 }}
            >
                <IndicatorPicker
                    options={hazardMenu.indicatorOptions}
                    selectedId={model.path}
                    labelId="hazard-indicator-label"
                    onSelect={(option) =>
                        update({
                            hazardTypeId: option.hazardTypeId,
                            modelPath: option.id,
                        })
                    }
                />
            </Labelled>
            <Labelled id="hazard-scenario-label" label="Scenario">
                <OptionToggles
                    labelId="hazard-scenario-label"
                    value={scenario.id}
                    options={model.scenarios.map((s) => ({
                        value: s.id,
                        label: prettifyScenarioId(s.id),
                    }))}
                    onChange={(scenarioId) => update({ scenarioId })}
                />
            </Labelled>
            <Labelled id="hazard-year-label" label="Year">
                <OptionToggles
                    labelId="hazard-year-label"
                    value={hazardMenu.selectedYear}
                    options={scenario.years.map((y) => ({
                        value: y,
                        label: y.toString(),
                    }))}
                    onChange={(year) => update({ year })}
                />
            </Labelled>
            {indexValues?.allIndexValues?.length > 1 ? (
                <Labelled
                    id="hazard-index-label"
                    label={
                        capitalise(indexValues.indexDisplayName) +
                        (indexValues.indexUnits
                            ? " (" + indexValues.indexUnits + ")"
                            : "")
                    }
                >
                    <Select
                        size="small"
                        labelId="hazard-index-label"
                        value={indexValues.indexSelectedValue ?? ""}
                        onChange={(event) =>
                            indexValuesDispatch({
                                type: "SELECTED",
                                payload: {
                                    indexSelectedValue: event.target.value,
                                },
                            })
                        }
                        // sized to its content (e.g. "35" or "1000")
                        sx={{
                            height: 40,
                            fontSize: 14,
                            "& .MuiSelect-select": { pl: 1.25 },
                        }}
                    >
                        {indexValues.availableIndexValues.map((v) => (
                            <MenuItem key={v} value={v} sx={{ fontSize: 14 }}>
                                {v}
                            </MenuItem>
                        ))}
                    </Select>
                </Labelled>
            ) : null}
            <DifferenceSwitch
                checked={Boolean(compare)}
                disabled={!supportsDifference}
                onChange={(checked) =>
                    update({ compare: checked ? defaultCompare(model) : null })
                }
            />
            {compare ? (
                // second row: what the selection is compared with
                <Box
                    sx={{
                        flexBasis: "100%",
                        display: "flex",
                        flexWrap: "wrap",
                        columnGap: 2,
                        rowGap: 1,
                    }}
                >
                    <Labelled
                        id="compare-scenario-label"
                        label="Minus scenario"
                    >
                        <OptionToggles
                            labelId="compare-scenario-label"
                            value={compare.scenario.id}
                            options={model.scenarios.map((s) => ({
                                value: s.id,
                                label: prettifyScenarioId(s.id),
                            }))}
                            onChange={(scenarioId) =>
                                update({
                                    compare: { scenarioId, year: compare.year },
                                })
                            }
                        />
                    </Labelled>
                    <Labelled id="compare-year-label" label="Minus year">
                        <OptionToggles
                            labelId="compare-year-label"
                            value={compare.year}
                            options={compare.scenario.years.map((y) => ({
                                value: y,
                                label: y.toString(),
                            }))}
                            onChange={(year) =>
                                update({
                                    compare: {
                                        scenarioId: compare.scenario.id,
                                        year,
                                    },
                                })
                            }
                        />
                    </Labelled>
                </Box>
            ) : null}
        </Box>
    )
}

function DifferenceSwitch(props) {
    const { checked, disabled, onChange } = props
    const control = (
        <Labelled id="hazard-difference-label" label="Difference">
            <Box sx={{ height: 40, display: "flex", alignItems: "center" }}>
                <Switch
                    checked={checked}
                    disabled={disabled}
                    onChange={(event) => onChange(event.target.checked)}
                    inputProps={{
                        "aria-labelledby": "hazard-difference-label",
                    }}
                />
            </Box>
        </Labelled>
    )
    return (
        <Tooltip
            title={
                disabled
                    ? "Differences are not available for this indicator."
                    : "Show the difference from another scenario or year on the map."
            }
        >
            <span>{control}</span>
        </Tooltip>
    )
}

function Labelled(props) {
    const { id, label, sx, children } = props
    return (
        <Box sx={sx}>
            <Typography
                id={id}
                variant="caption"
                color="text.secondary"
                component="div"
                sx={{ pl: 0.5 }}
            >
                {label}
            </Typography>
            {children}
        </Box>
    )
}

function OptionToggles(props) {
    const { labelId, value, options, onChange } = props
    return (
        <ToggleButtonGroup
            size="small"
            exclusive
            color="primary"
            value={value}
            aria-labelledby={labelId}
            onChange={(event, newValue) => {
                // null when the selected button is clicked again: keep selection
                if (newValue !== null) onChange(newValue)
            }}
        >
            {options.map((o) => (
                <ToggleButton
                    key={o.value}
                    value={o.value}
                    // same height as the small indicator TextField
                    sx={{ textTransform: "none", height: 40, px: 1.25 }}
                >
                    {o.label}
                </ToggleButton>
            ))}
        </ToggleButtonGroup>
    )
}

const searchFilter = createFilterOptions({
    stringify: (option) =>
        option.hazardTypeLabel + " " + option.groupLabel + " " + option.label,
})

const optionLabel = (option) =>
    option.kind == "model"
        ? option.hazardTypeLabel + ": " + option.label
        : option.label

/** Searchable picker over all hazard indicators, grouped by hazard type. Display
 *  groups (e.g. one indicator across many climate models) appear as "group"
 *  options which expand/collapse rather than select. When browsing, only the
 *  group of the selected model starts expanded; when searching, every group
 *  with a match starts expanded. */
function IndicatorPicker(props) {
    const { options, selectedId, labelId, onSelect } = props
    const selected = options.find((o) => o.id === selectedId)
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState(optionLabel(selected))
    // search text typed since opening; "" while the input still shows the selection
    const [searchText, setSearchText] = useState("")
    const [expanded, setExpanded] = useState(() => new Set())
    const [collapsedInSearch, setCollapsedInSearch] = useState(() => new Set())
    const inputRef = useRef(null)
    const toggledGroup = useRef(false)
    const searching = searchText != ""
    const groupLabels = useMemo(
        () =>
            new Set(
                options.filter((o) => o.kind == "group").map((o) => o.label)
            ),
        [options]
    )

    const isExpanded = (groupId) =>
        searching ? !collapsedInSearch.has(groupId) : expanded.has(groupId)

    const handleOpen = () => {
        // show the selected model within its group
        setExpanded(new Set(selected.groupId ? [selected.groupId] : []))
        setSearchText("")
        setOpen(true)
        // select the text so typing replaces it (MUI only does this on first focus)
        requestAnimationFrame(() => inputRef.current?.select())
    }

    const handleChange = (event, option) => {
        if (option.kind == "group") {
            toggledGroup.current = true
            const [groupIds, setGroupIds] = searching
                ? [collapsedInSearch, setCollapsedInSearch]
                : [expanded, setExpanded]
            const newGroupIds = new Set(groupIds)
            newGroupIds.has(option.id)
                ? newGroupIds.delete(option.id)
                : newGroupIds.add(option.id)
            setGroupIds(newGroupIds)
        } else {
            onSelect(option)
        }
    }

    const handleClose = (event, reason) => {
        if (reason == "selectOption" && toggledGroup.current) {
            toggledGroup.current = false
            return
        }
        setOpen(false)
    }

    const handleInputChange = (event, value, reason) => {
        if (reason == "reset") {
            // MUI resets the text to the label of whatever was picked, before
            // calling onChange; for a group toggle, keep the text as it is
            if (groupLabels.has(value)) return
            setSearchText("")
        } else {
            setSearchText(value)
            setCollapsedInSearch(new Set())
        }
        setInputValue(value)
    }

    const filterOptions = (allOptions, state) => {
        if (!searching) {
            return allOptions.filter(
                (o) => o.kind == "group" || !o.groupId || isExpanded(o.groupId)
            )
        }
        const matches = searchFilter(
            allOptions.filter((o) => o.kind == "model"),
            { ...state, inputValue: searchText }
        )
        const matchedGroupIds = new Set(matches.map((o) => o.groupId))
        const matchIds = new Set(matches.map((o) => o.id))
        return allOptions.filter((o) =>
            o.kind == "group"
                ? matchedGroupIds.has(o.id)
                : matchIds.has(o.id) && (!o.groupId || isExpanded(o.groupId))
        )
    }

    return (
        <Autocomplete
            size="small"
            disableClearable
            autoHighlight
            open={open}
            onOpen={handleOpen}
            onClose={handleClose}
            options={options}
            value={selected}
            onChange={handleChange}
            inputValue={inputValue}
            onInputChange={handleInputChange}
            groupBy={(option) => option.hazardTypeLabel}
            renderGroup={(params) => (
                <li key={params.key}>
                    <ListSubheader
                        sx={{
                            color: "primary.main",
                            fontWeight: 600,
                            lineHeight: "36px",
                            borderBottom: 1,
                            borderColor: "divider",
                        }}
                    >
                        {params.group}
                    </ListSubheader>
                    <ul style={{ padding: 0 }}>{params.children}</ul>
                </li>
            )}
            getOptionLabel={optionLabel}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            filterOptions={filterOptions}
            ListboxProps={{ style: { maxHeight: "60vh" } }}
            renderOption={(props, option) => {
                // eslint-disable-next-line no-unused-vars
                const { key, ...rest } = props
                return option.kind == "group" ? (
                    <li {...rest} key={option.id}>
                        <Typography sx={{ fontSize: 14, flexGrow: 1 }}>
                            {option.label}
                        </Typography>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mx: 0.5 }}
                        >
                            {option.size}
                        </Typography>
                        {isExpanded(option.id) ? (
                            <ExpandLess fontSize="small" />
                        ) : (
                            <ExpandMore fontSize="small" />
                        )}
                    </li>
                ) : (
                    <li {...rest} key={option.id}>
                        <Typography
                            sx={{
                                fontSize: option.groupId ? 13 : 14,
                                pl: option.groupId ? 2 : 0,
                            }}
                        >
                            {option.label}
                        </Typography>
                    </li>
                )
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    inputRef={inputRef}
                    inputProps={{
                        ...params.inputProps,
                        "aria-labelledby": labelId,
                    }}
                    placeholder="Search hazard indicators"
                />
            )}
        />
    )
}
