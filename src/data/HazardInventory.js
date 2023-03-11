import axios from "axios"
import path from "path-browserify"

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
        case "initialise":
            var [menuOptions, newSelectedIndices, selection] =
                updateMenuOptions(
                    action.payload.inventory,
                    action.payload.selectedIndices
                )
            var [hazardTypeId, model, scenario, year] = selection
            var mapInfo = action.payload.inventory.getMapInfo(
                hazardTypeId,
                model.id,
                scenario.id,
                year
            )
            return {
                inventory: action.payload.inventory,
                selectedIndices: newSelectedIndices,
                selectedHazardTypeId: hazardTypeId,
                selectedModel: model, // model object
                selectedScenario: scenario, // scenario object
                selectedYear: year,
                mapInfo: mapInfo,
                mapColorbar: mapInfo.colorbar,
                menus: action.payload.menus,
                menuOptions: menuOptions,
            }
        case "update":
            var [menuOptions, newSelectedIndices, selection] = // eslint-disable-line no-redeclare
                updateMenuOptions(
                    state.inventory,
                    action.payload.selectedIndices
                )
            var [hazardTypeId, model, scenario, year] = selection // eslint-disable-line no-redeclare
            var mapInfo = state.inventory.getMapInfo( // eslint-disable-line no-redeclare
                hazardTypeId,
                model.id,
                scenario.id,
                year
            )
            return {
                ...state,
                selectedIndices: newSelectedIndices,
                selectedHazardTypeId: hazardTypeId,
                selectedModel: model, // model object
                selectedScenario: scenario, // scenario object
                selectedYear: year,
                mapInfo: mapInfo,
                mapColorbar: mapInfo.colorbar,
                menuOptions: menuOptions,
            }
        default:
            return state
    }
}

/** Update options as necessary and get current selection, adjusting indices as needed. */
export function updateMenuOptions(inventory, selectedIndices) {
    // menu order: hazard types, models, scenarios, years
    var newSelectedIndices = [...selectedIndices]
    var hazardTypeId = inventory.getHazardTypeIds()[selectedIndices[0]]
    var models = inventory.modelsOfHazardType[hazardTypeId]
    newSelectedIndices[1] = Math.min(selectedIndices[1], models.length - 1)
    var model = models[newSelectedIndices[1]]
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
            inventory.getHazardTypeIds().map((h) => prettifyPascalCase(h)),
            models.map((m) => m.display_name),
            model.scenarios.map((s) => prettifyScenarioId(s.id)),
            scenario.years,
        ],
        newSelectedIndices,
        [hazardTypeId, model, scenario, year],
    ]
}

export const loadHazardMenuData = async (globals) => {
    try {
        const apiHost = globals.services.apiHost;
    
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
                size: "medium",
            },
            {
                name: "Model",
                size: "small",
            },
            {
                name: "Scenario",
                size: "small",
            },
            {
                name: "Year",
                size: "small",
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
            addItemToDict(this.modelsOfHazardType, model.type, model)
        })

        this.colormaps = colormaps
    }

    /** Return hazard event types. */
    getHazardTypeIds() {
        return Object.keys(this.modelsOfHazardType)
    }

    getMapInfo(hazardTypeId, modelId, scenarioId, year) {
        // need some static typing here I feel (move this code to TypeScript?)
        const model = this.modelsOfHazardType[hazardTypeId].filter(
            (m) => m.id == modelId
        )[0]
        const scenario = model.scenarios
            .filter((s) => s.id == scenarioId)[0]
        const period = scenario.periods ? scenario.periods.filter((p) => p.year == year)[0] : null

        const result = { 
            mapId: model.map.source == "mapbox" ? "osc-mapbox." + period.map_id : null,
            resource: path.join(model.path, model.id), // model.map.array_name.replace("{scenario}", scenarioId).replace("{year}", year)),
            scenarioId: scenario.id,
            year: year,
            colorbar: getColorbar(this.colormaps, model.map.colormap),
            minValue: model.map.colormap.min_value,
            maxValue: model.map.colormap.max_value 
        }

        return result 
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
        case "ssp126":
            return "SSP126"
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

// Note that all of this look-up information will be retrieved via API call.
// This includes inventory, map IDs, and map color bars.
// Added here as temporary measure pending update of API.


function getColorbar(colormaps, mapColormap) {
    const minIndex = mapColormap["min_index"]
    const maxIndex = mapColormap["max_index"]
    const n = maxIndex - minIndex + 1
    const stops = [...Array(n).keys()].map((i) => ({
        offset: ((i * 100.0) / (n - 1)).toFixed(1) + "%",
        stopColor: rgbToHex(colormaps[mapColormap["name"]][(i + minIndex).toString()]),
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
