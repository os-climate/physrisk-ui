import axios from "axios"

export const hazardMenuInitialiser = () => {
    return {
        inventory: null,
        menus: null,
        menuOptions: null,
        selectedIndices: [0],
        model: null,
    }
}

export const hazardMenuReducer = (state, action) => {
    switch (action.type) {
        case "initialise": {
            const [menuOptions, newSelectedIndices, selection] =
                updateMenuOptions(
                    action.payload.inventory,
                    action.payload.selectedIndices
                )
            const [hazardTypeId, model, scenario, year] = selection
            const mapInfo = action.payload.inventory.getMapInfo(
                hazardTypeId,
                model.path,
                scenario.id,
                year
            )
            return {
                inventory: action.payload.inventory,
                selectedIndices: newSelectedIndices,
                selectedHazardTypeId: hazardTypeId,
                selectedModel: model,
                selectedScenario: scenario,
                selectedYear: year,
                mapInfo: mapInfo,
                mapColorbar: mapInfo.colorbar,
                menus: action.payload.menus,
                menuOptions: menuOptions,
            }
        }
        case "update": {
            const [menuOptions, newSelectedIndices, selection] =
                updateMenuOptions(
                    state.inventory,
                    action.payload.selectedIndices
                )
            const [hazardTypeId, model, scenario, year] = selection
            const mapInfo = state.inventory.getMapInfo(
                hazardTypeId,
                model.path,
                scenario.id,
                year
            )
            return {
                ...state,
                selectedIndices: newSelectedIndices,
                selectedHazardTypeId: hazardTypeId,
                selectedModel: model,
                selectedScenario: scenario,
                selectedYear: year,
                mapInfo: mapInfo,
                mapColorbar: mapInfo.colorbar,
                menuOptions: menuOptions,
            }
        }
        default:
            return state
    }
}

const emptyIfUndefined = (item) => {
    return item ? item : ""
}

/** Update options as necessary and get current selection, adjusting indices as needed. */
export function updateMenuOptions(inventory, selectedIndices) {
    // menu order: hazard types, models, scenarios, years
    var newSelectedIndices = [...selectedIndices]
    var hazardTypeId = inventory.getHazardTypeIds()[selectedIndices[0]]
    var models = inventory.modelsOfHazardType[hazardTypeId]

    var sortedModels = models.map((m) => {
        return {
            group: emptyIfUndefined(
                m.display_groups.filter((group) =>
                    m.display_name.includes(group)
                )[0]
            ),
            value: m,
        }
    })
    sortedModels = sortedModels.sort((a, b) =>
        a.group > b.group ||
        (a.group == b.group &&
            (b.value.indicator_model_gcm.includes("multi_model_0") ||
                a.value.display_name > b.value.display_name))
            ? 1
            : -1
    )

    var sortedModelNames = sortedModels.map((m) => {
        return { group: m.group, value: prettifyGCM(m.value.display_name) }
    })

    newSelectedIndices[1] = Math.min(
        selectedIndices[1],
        sortedModels.length - 1
    )
    var model = sortedModels[newSelectedIndices[1]].value
    newSelectedIndices[2] = Math.min(
        selectedIndices[2],
        model.scenarios.length - 1
    )
    var scenario = model.scenarios[newSelectedIndices[2]]
    newSelectedIndices[3] = Math.min(
        selectedIndices[3],
        scenario.years.length - 1
    )
    var year = scenario.years[newSelectedIndices[3]]

    return [
        [
            inventory.getHazardTypeIds().map((h) => {
                return { group: "", value: prettifyPascalCase(h) }
            }),
            sortedModelNames,
            model.scenarios.map((s) => {
                return { group: "", value: prettifyScenarioId(s.id) }
            }),
            scenario.years.map((y) => {
                return { group: "", value: y.toString() }
            }),
        ],
        newSelectedIndices,
        [hazardTypeId, model, scenario, year],
    ]
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
        const menus = [
            {
                name: "Hazard type",
                minWidth: 100,
            },
            {
                name: "Hazard indicator",
                minWidth: 100,
            },
            {
                name: "Scenario",
                minWidth: 100,
            },
            {
                name: "Year",
                minWidth: 100,
            },
        ]
        return {
            inventory: inventory,
            menus: menus,
            selectedIndices: [0, 0, 0, 0],
        }
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
        return Object.keys(this.modelsOfHazardType)
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

function prettifyScenarioId(id) {
    switch (id) {
        case "rcp4p5":
            return "RCP 4.5"
        case "rcp8p5":
            return "RCP 8.5"
        case "ssp119":
            return "SSP119"
        case "ssp126":
            return "SSP126"
        case "ssp245":
            return "SSP245"
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
