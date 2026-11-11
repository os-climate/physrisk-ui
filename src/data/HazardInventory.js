import axios from "axios"

/** JBA-backed resources natively serve 256px tiles; requesting the default
 *  512px size composites four of these per output tile, which is slower.
 *  Mirrors the "jba_" resource-path convention used server-side. */
export function isJbaResource(resourcePath) {
    return !!resourcePath && resourcePath.startsWith("jba_")
}

export const hazardMenuInitialiser = () => {
    return {
        inventory: null,
        indicatorOptions: null,
        selectedModel: null,
    }
}

/** Menu state is held as a selection by value: { hazardTypeId, modelPath,
 *  scenarioId, year, compare }. An "update" merges a partial selection into the
 *  current one, so e.g. changing indicator keeps the chosen scenario and year
 *  where the new indicator offers them. compare is null, or { scenarioId, year }
 *  of the same indicator to show the difference from on the map. */
export const hazardMenuReducer = (state, action) => {
    switch (action.type) {
        case "initialise": {
            const inventory = action.payload.inventory
            return {
                inventory: inventory,
                indicatorOptions: inventory.getIndicatorOptions(),
                ...resolveSelection(inventory, {}),
            }
        }
        case "update": {
            const current = {
                hazardTypeId: state.selectedHazardTypeId,
                modelPath: state.selectedModel.path,
                scenarioId: state.selectedScenario.id,
                year: state.selectedYear,
                compare: state.selectedCompare
                    ? {
                          scenarioId: state.selectedCompare.scenario.id,
                          year: state.selectedCompare.year,
                      }
                    : null,
            }
            return {
                ...state,
                ...resolveSelection(state.inventory, {
                    ...current,
                    ...action.payload,
                }),
            }
        }
        default:
            return state
    }
}

const emptyIfUndefined = (item) => {
    return item ? item : ""
}

/** Hazard type selected initially, if available (hazard types are listed
 *  alphabetically, so otherwise the first in the list). */
const defaultHazardTypeId = "RiverineInundation"

/** Preferred default model per hazard type, applied when the requested model
 *  is not of the selected hazard type (e.g. right after switching hazard type).
 *  Falls back to the top of the sorted list if no model matches. */
const defaultModelHints = {
    RiverineInundation: (model) => model.path.includes("river_tudelft"),
}

function defaultModel(hazardTypeId, sortedModels) {
    const hint = defaultModelHints[hazardTypeId]
    return (hint && sortedModels.find((m) => hint(m))) || sortedModels[0]
}

/** SSP/RCP pairs with the same nominal 2100 radiative forcing, used as a
 *  fallback when the new model does not offer the requested scenario. */
const equivalentScenarios = {
    ssp126: "rcp2p6",
    ssp245: "rcp4p5",
    ssp370: "rcp6p0",
    ssp585: "rcp8p5",
    rcp2p6: "ssp126",
    rcp4p5: "ssp245",
    rcp6p0: "ssp370",
    rcp8p5: "ssp585",
}

/** Year closest to the requested year, so that e.g. moving from historical to a
 *  future scenario lands on the earliest projection year. */
function nearestYear(years, year) {
    if (year === undefined) return years[0]
    return years.reduce((best, y) =>
        Math.abs(y - year) < Math.abs(best - year) ? y : best
    )
}

/** Resolve a (possibly partial or stale) selection against the inventory,
 *  keeping each requested value where available and falling back otherwise. */
function resolveSelection(inventory, selection) {
    const hazardTypeIds = inventory.getHazardTypeIds()
    const hazardTypeId = [
        selection.hazardTypeId,
        defaultHazardTypeId,
        hazardTypeIds[0],
    ].find((id) => hazardTypeIds.includes(id))
    const sortedModels = inventory.getSortedModels(hazardTypeId)
    const model =
        sortedModels.find((m) => m.path === selection.modelPath) ||
        defaultModel(hazardTypeId, sortedModels)
    const { scenario, year } = resolveScenarioYear(
        model,
        selection.scenarioId,
        selection.year
    )
    const compare =
        selection.compare && inventory.supportsDifference(model)
            ? resolveScenarioYear(
                  model,
                  selection.compare.scenarioId,
                  selection.compare.year
              )
            : null
    var mapInfo = inventory.getMapInfo(
        hazardTypeId,
        model.path,
        scenario.id,
        year
    )
    if (compare) {
        mapInfo = withDifference(mapInfo, compare, inventory.colormaps)
    }
    return {
        selectedHazardTypeId: hazardTypeId,
        selectedModel: model,
        selectedScenario: scenario,
        selectedYear: year,
        selectedCompare: compare,
        mapInfo: mapInfo,
        mapColorbar: mapInfo.colorbar,
    }
}

function resolveScenarioYear(model, scenarioId, year) {
    const scenario =
        model.scenarios.find((s) => s.id === scenarioId) ||
        model.scenarios.find((s) => s.id === equivalentScenarios[scenarioId]) ||
        model.scenarios[0]
    return { scenario, year: nearestYear(scenario.years, year) }
}

/** Tile request query parameters for a difference map, or "" if none. */
export function differenceQueryParams(mapInfo) {
    return mapInfo?.compareScenarioId
        ? "&compareScenarioId=" +
              mapInfo.compareScenarioId +
              "&compareYear=" +
              mapInfo.compareYear
        : ""
}

/** e.g. "Difference: SSP585 2050 minus Historical 2005" */
export function differenceCaption(mapInfo) {
    return mapInfo?.compareScenarioId
        ? "Difference: " +
              prettifyScenarioId(mapInfo.scenarioId) +
              " " +
              mapInfo.year +
              " minus " +
              prettifyScenarioId(mapInfo.compareScenarioId) +
              " " +
              mapInfo.compareYear
        : ""
}

/** Default scenario and year to compare with: historical if available. */
export function defaultCompare(model) {
    const scenario =
        model.scenarios.find((s) => s.id == "historical") || model.scenarios[0]
    return { scenarioId: scenario.id, year: scenario.years[0] }
}

/** Colour map used for differences: diverging, centred on no change. */
export const differenceColormapName = "coolwarm"

/** Map info for the difference between the selection and compare: a diverging
 *  colour map, symmetric about zero, spanning half the range of the indicator
 *  (a starting point; the range can be edited via the colour bar). */
function withDifference(mapInfo, compare, colormaps) {
    const range = (mapInfo.maxValue - mapInfo.minValue) / 2 || 1
    const colormap = {
        name: differenceColormapName,
        min_index: 1,
        max_index: 255,
        min_value: -range,
        max_value: range,
        units: mapInfo.colorbar?.units,
    }
    return {
        ...mapInfo,
        compareScenarioId: compare.scenario.id,
        compareYear: compare.year,
        colorbar: getColorbar(colormaps, colormap),
        colormapName: differenceColormapName,
        colormapMinIndex: 1,
        colormapMaxIndex: 255,
        minValue: -range,
        maxValue: range,
        scaling: "linear",
    }
}

export const loadHazardMenuData = async (globals) => {
    try {
        const apiHost = globals.services.apiHost

        var response = await axios.post(
            apiHost + "/api/get_hazard_data_availability",
            { sources: globals.inventorySources }
        )
        var inventory = new HazardInventory(
            response.data.models,
            response.data.colormaps
        )
        return { inventory: inventory }
    } catch (error) {
        console.log(error)
    }
}

/** Holds hazard event availability data */
export class HazardInventory {
    constructor(models, colormaps) {
        this.modelsOfHazardType = {}

        models.forEach((model) => {
            addItemToDict(this.modelsOfHazardType, model.hazard_type, model)
        })

        this.colormaps = colormaps
    }

    /** Return hazard event types. */
    getHazardTypeIds() {
        return Object.keys(this.modelsOfHazardType).sort((a, b) =>
            prettifyPascalCase(a).localeCompare(prettifyPascalCase(b))
        )
    }

    /** Models of hazard type, sorted by display group. */
    getSortedModels(hazardTypeId) {
        const groupOf = (m) => emptyIfUndefined(m.display_groups[0])
        // ungrouped models ("") sort after named groups, so a standalone model
        // doesn't preempt the multi-model entry of a named group as the default
        return [...this.modelsOfHazardType[hazardTypeId]].sort((a, b) => {
            if (groupOf(a) != groupOf(b)) {
                if (groupOf(a) == "") return 1
                if (groupOf(b) == "") return -1
                return groupOf(a) > groupOf(b) ? 1 : -1
            }
            return b.indicator_model_gcm.includes("multi_model_0") ||
                a.display_name > b.display_name
                ? 1
                : -1
        })
    }

    /** Flat list of options for the hazard indicator picker, across all hazard
     *  types. Display groups with more than one model get a "group" option
     *  placed before their "model" options, so the picker can collapse them. */
    getIndicatorOptions() {
        const options = []
        this.getHazardTypeIds().forEach((hazardTypeId) => {
            const hazardTypeLabel = prettifyPascalCase(hazardTypeId)
            const models = this.getSortedModels(hazardTypeId)
            const groupSizes = {}
            models.forEach((m) => {
                const group = emptyIfUndefined(m.display_groups[0])
                groupSizes[group] = (groupSizes[group] ?? 0) + 1
            })
            let previousGroup = null
            models.forEach((m) => {
                const group = emptyIfUndefined(m.display_groups[0])
                const isGrouped = group != "" && groupSizes[group] > 1
                if (isGrouped && group != previousGroup) {
                    options.push({
                        kind: "group",
                        id: hazardTypeId + "/" + group,
                        hazardTypeId,
                        hazardTypeLabel,
                        label: group,
                        size: groupSizes[group],
                    })
                }
                previousGroup = group
                options.push({
                    kind: "model",
                    id: m.path,
                    hazardTypeId,
                    hazardTypeLabel,
                    groupId: isGrouped ? hazardTypeId + "/" + group : null,
                    groupLabel: group,
                    label: prettifyGCM(m.display_name),
                    model: m,
                })
            })
        })
        return options
    }

    /** Whether the map can show differences between scenarios/years of the
     *  model: only for array pyramids served by the API (not JBA), and only if
     *  the API provides the diverging colour map, i.e. supports differences. */
    supportsDifference(model) {
        return (
            model.map.source == "map_array_pyramid" &&
            !isJbaResource(model.path) &&
            differenceColormapName in this.colormaps
        )
    }

    findModelByPath(path) {
        for (const [hazardTypeId, models] of Object.entries(
            this.modelsOfHazardType
        )) {
            const model = models.find((m) => m.path === path)
            if (model) return { hazardTypeId, model }
        }
        return null
    }

    getMapInfo(hazardTypeId, modelId, scenarioId, year) {
        // need some static typing here I feel (move this code to TypeScript?)
        const model = this.modelsOfHazardType[hazardTypeId].filter(
            (m) => m.path == modelId // path acts as the unique id
        )[0]
        // period lookup is only needed for mapbox sources; for map_array_pyramid
        // the API translates the requested scenario/year to what is available
        const scenario = model.scenarios.find((s) => s.id == scenarioId)
        const period = scenario?.periods?.find((p) => p.year == year)

        return {
            bounds: model.map.bounds,
            source: model.map.source,
            mapId:
                model.map.source == "mapbox" && period
                    ? "osc-mapbox." + period.map_id
                    : null,
            resource: model.path,
            scenarioId: scenarioId,
            year: year,
            colorbar: getColorbar(this.colormaps, model.map.colormap),
            colormapName: model.map.colormap.name,
            colormapMinIndex: model.map.colormap.min_index,
            colormapMaxIndex: model.map.colormap.max_index,
            colormaps: this.colormaps,
            minValue: model.map.colormap.min_value,
            maxValue: model.map.colormap.max_value,
            scaling: model.map.colormap.scaling ?? "linear",
        }
    }
}

/** Available colour map names a user may pick between when editing the map legend. */
export const availableColormapNames = [
    "flare",
    "heating",
    "viridis",
    "magma",
    "batlow",
    "turbo",
    "coolwarm", // diverging, for differences
]

/** Re-derive mapInfo's colorbar (and the name/min/max/scaling it was built from) after a
 *  user override, so map tiles and the legend stay in sync. `override` may be null/undefined
 *  (no override), or any subset of { name, minValue, maxValue, scaling }. */
export function withColorbarOverride(mapInfo, override) {
    if (!mapInfo) return mapInfo
    const name = override?.name ?? mapInfo.colormapName
    const minValue = override?.minValue ?? mapInfo.minValue
    const maxValue = override?.maxValue ?? mapInfo.maxValue
    const scaling = override?.scaling ?? mapInfo.scaling
    if (
        name === mapInfo.colormapName &&
        minValue === mapInfo.minValue &&
        maxValue === mapInfo.maxValue &&
        scaling === mapInfo.scaling
    ) {
        return mapInfo
    }
    const colorbar = getColorbar(mapInfo.colormaps, {
        name: name,
        min_index: mapInfo.colormapMinIndex,
        max_index: mapInfo.colormapMaxIndex,
        min_value: minValue,
        max_value: maxValue,
        units: mapInfo.colorbar?.units,
    })
    return {
        ...mapInfo,
        colormapName: name,
        minValue: minValue,
        maxValue: maxValue,
        scaling: scaling,
        colorbar: colorbar,
    }
}

/** Add an item to a dictionary were the value is a list */
function addItemToDict(dict, key, item) {
    if (!(key in dict)) dict[key] = []
    dict[key].push(item)
}

/** Name of the quantity a model gives, for axis labels: its display name
 *  without the source in brackets, e.g. "Flood depth" for "Flood depth (JRC)". */
export function quantityName(model) {
    return model.display_name.replace(/\s*\([^()]*\)\s*$/, "")
}

export function prettifyScenarioId(id) {
    switch (id) {
        case "rcp2p6":
            return "RCP 2.6"
        case "rcp4p5":
            return "RCP 4.5"
        case "rcp6p0":
            return "RCP 6.0"
        case "rcp8p5":
            return "RCP 8.5"
        case "ssp119":
            return "SSP119"
        case "ssp126":
            return "SSP126"
        case "ssp245":
            return "SSP245"
        case "ssp370":
            return "SSP370"
        case "ssp585":
            return "SSP585"
        case "historical":
            return "Historical"
        default:
            return id
    }
}

function prettifyPascalCase(text) {
    return text.replace(/([A-Z])/g, " $1").trim(0)
}

function prettifyGCM(text) {
    return text.replace("multi_model_0", "Multi-model")
}

// Note that all of this look-up information will be retrieved via API call.
// This includes inventory, map IDs, and map color bars.
// Added here as temporary measure pending update of API.

export function getColorbar(colormaps, mapColormap) {
    const minIndex = mapColormap["min_index"]
    const maxIndex = mapColormap["max_index"]
    const n = maxIndex - minIndex + 1
    const stops = [...Array(n).keys()].map((i) => ({
        offset: ((i * 100.0) / (n - 1)).toFixed(1) + "%",
        stopColor: rgbToHex(
            colormaps[mapColormap["name"]][(i + minIndex).toString()]
        ),
    }))
    return {
        stops: stops,
        minValue: mapColormap["min_value"],
        maxValue: mapColormap["max_value"],
        units: mapColormap.units,
    }
}

function componentToHex(c) {
    var hex = c.toString(16)
    return hex.length == 1 ? "0" + hex : hex
}

function rgbToHex(rgb) {
    return (
        "#" +
        componentToHex(rgb[0]) +
        componentToHex(rgb[1]) +
        componentToHex(rgb[2])
    )
}

export const exampleInventory = [
    {
        type: "Riverine Inundation",
        path: "riverine_inundation/wri/v2",
        id: "Baseline",
        display_name: "Baseline",
        description: "Baseline condition",
        filename: "inunriver_{scenario}_{id}_{year}",
        scenarios: [{ id: "Historical", years: [1980] }],
    },
]
