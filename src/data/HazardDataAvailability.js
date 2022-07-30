import axios from 'axios';

export const hazardMenuInitialState = {
    inventory: null,
    menus: [],
    menuOptions: [[],[],[],[]],
    selectedIndices: [0, 0, 0, 0]
}

export const hazardMenuInitialiser = () => {
    return {
        inventory: null,
        menus: [],
        menuOptions: [[],[],[],[]],
        selectedIndices: [0, 0, 0, 0]
    }
};

export const hazardMenuReducer = (state, action) => {
    switch (action.type) {
        case "initialise":
            var [menuOptions, newSelectedIndices, selection] = updateMenuOptions(action.payload.inventory, action.payload.selectedIndices)  
            return {
                inventory: action.payload.inventory,
                selectedIndices: newSelectedIndices,
                menus: action.payload.menus,
                menuOptions: menuOptions 
            };
        case "update":
            var [menuOptions, newSelectedIndices, selection] = updateMenuOptions(state.inventory, action.payload.selectedIndices)
            return {
                ...state,
                selectedIndices: newSelectedIndices,
                menuOptions: menuOptions 
            };
      default:
        return state;
    }
  };

/** Update options as necessary and get current selection, adjusting indices as needed. */
export function updateMenuOptions(inventory, selectedIndices)
{
    // menu order: hazard types, models, scenarios, years
    var newSelectedIndices = [...selectedIndices]
    var hazardTypeId = inventory.getHazardTypeIds()[selectedIndices[0]]
    var models = inventory.modelsOfHazardType[hazardTypeId]
    newSelectedIndices[1] = Math.min(selectedIndices[1], models.length - 1)
    var model = models[newSelectedIndices[1]]
    newSelectedIndices[2] = Math.min(selectedIndices[2], model.scenarios.length - 1)
    var scenario = model.scenarios[newSelectedIndices[2]]
    newSelectedIndices[3] = Math.min(selectedIndices[3], scenario.years.length - 1)
    var year = scenario.years[newSelectedIndices[3]]
    return [[inventory.getHazardTypeIds().map(h => prettifyPascalCase(h)), models.map(m => m.display_name), model.scenarios.map(s => prettifyScenarioId(s.id)), scenario.years],
        newSelectedIndices,
        [hazardTypeId, model, scenario, year]];
}

export const loadHazardMenuData = async () => {
    try {
        const apiHost = 'http://physrisk-api-sandbox.apps.odh-cl1.apps.os-climate.org';
        var response = await axios.post(apiHost+'/api/get_hazard_data_availability', {});
        var inventory = new HazardAvailability(response.data.models);
        const menus = [
            {
                name: "Hazard type",
                size: "medium"
            },
            {
                name: "Model",
                size: "small"
            },
            {
                name: "Scenario",
                size: "small"
            },
            {
                name: "Year",
                size: "small"
            },
        ];
        return {
            inventory: inventory,
            menus: menus,
            selectedIndices: [0, 0, 0, 0]
        };

    } catch (error) {
      console.log(error);
    }
  };


/** Holds hazard event availability data */
export class HazardAvailability {
    constructor(models) {
        this.modelsOfHazardType = {};

        models.forEach(model => {
            addItemToDict(this.modelsOfHazardType, model.event_type, model);
        });
    }

    /** Return hazard event types. */
    getHazardTypeIds() {
        return Object.keys(this.modelsOfHazardType);
    }

    /** Return description for Model with given hazard event type and display name.  */
    getModelDescription(hazardType, modelDisplayName) {
        return this.getModel(hazardType, modelDisplayName)?.description; // '?' needed to handle transient state
    }
}

/** Add an item to a dictionary were the value is a list */
function addItemToDict(dict, key, item)
{
    if (!(key in dict)) dict[key] = [];
    dict[key].push(item);
}

function prettifyScenarioId(id)
{
    switch (id)
    {
        case "rcp4p5":
            return "RCP 4.5"
        case "rcp8p5":
            return "RCP 8.5"
        case "historical":
            return "Historical"
        default:
            return id;
    }
}

function prettifyPascalCase(text)
{
    return text.replace( /([A-Z])/g, " $1" ).trim(0);
}

export const inventory = [
    {
        "event_type": "Riverine Inundation",
        "path": "riverine_inundation/wri/v2",
        "id": "Baseline",
        "display_name": "Baseline",
        "description": "Baseline condition",
        "filename": "inunriver_{scenario}_{id}_{year}",
        "scenarios": [
            {"id": "Historical", "years": [1980]},
        ],
    },
    {
        "event_type": "Riverine Inundation",
        "path": "riverine_inundation/wri/v2",
        "id": "NorESM1-M",
        "display_name": "NorESM1-M",
        "description": "GCM model: Bjerknes Centre for Climate Research, Norwegian Meteorological Institute",
        "filename": "inunriver_{scenario}_{id}_{year}",
        "scenarios": [
            {"id": "RCP 4.5", "years": [2030, 2050, 2080]},
            {"id": "RCP 8.5", "years": [2030, 2050, 2080]},
        ],
    },
    {
        "event_type": "Riverine Inundation",
        "path": "riverine_inundation/wri/v2",
        "id": "GFDL-ESM2M",
        "display_name": "GFDL-ESM2M",
        "description": "GCM model: Geophysical Fluid Dynamics Laboratory (NOAA)",
        "filename": "inunriver_{scenario}_{id}_{year}",
        "scenarios": [
            {"id": "RCP 4.5", "years": [2030, 2050, 2080]},
            {"id": "RCP 8.5", "years": [2030, 2050, 2080]},
        ],
    },
    {
        "event_type": "Riverine Inundation",
        "path": "riverine_inundation/wri/v2",
        "id": "HadGEM2-ES",
        "display_name": "HadGEM2-ES",
        "description": "GCM model: Met Office Hadley Centre",
        "filename": "inunriver_{scenario}_{id}_{year}",
        "scenarios": [
            {"id": "RCP 4.5", "years": [2030, 2050, 2080]},
            {"id": "RCP 8.5", "years": [2030, 2050, 2080]},
        ],
    },
    {
        "event_type": "Riverine Inundation",
        "path": "riverine_inundation/wri/v2",
        "id": "IPSL-CM5A-LR",
        "display_name": "IPSL-CM5A-LR",
        "description": "GCM model: Institut Pierre Simon Laplace",
        "filename": "inunriver_{scenario}_{id}_{year}",
        "scenarios": [
            {"id": "RCP 4.5", "years": [2030, 2050, 2080]},
            {"id": "RCP 8.5", "years": [2030, 2050, 2080]},
        ],
    },
    {
        "event_type": "Riverine Inundation",
        "path": "riverine_inundation/wri/v2",
        "id": "MIROC-ESM-CHEM",
        "display_name": "MIROC-ESM-CHEM",
        "description": "GCM model: Atmosphere and Ocean Research Institute (The University of Tokyo), National Institute for Environmental Studies, and Japan Agency for Marine-Earth Science and Technology",
        "filename": "inunriver_{scenario}_{id}_{year}",
        "scenarios": [
            {"id": "RCP 4.5", "years": [2030, 2050, 2080]},
            {"id": "RCP 8.5", "years": [2030, 2050, 2080]},
        ],
    },
    {
        "event_type": "Coastal Inundation",
        "path": "coastal_inundation/wri/v2",
        "id": "nosub",
        "display_name": "Baseline no subsidence",
        "description": "Baseline; no sub.",
        "scenarios": [
            {"id": "Historical", "years": [1980]},
            {"id": "RCP 4.5", "years": [2030, 2050, 2080]},
            {"id": "RCP 8.5", "years": [2030, 2050, 2080]},
        ],
    },
    {
        "event_type": "Coastal Inundation",
        "path": "coastal_inundation/wri/v2",
        "id": "nosub_95",
        "display_name": "95% no subsidence",
        "description": "No subsidence; 95th percentile sea rise",
        "scenarios": [
            {"id": "Historical", "years": [1980]},
            {"id": "RCP 4.5", "years": [2030, 2050, 2080]},
            {"id": "RCP 8.5", "years": [2030, 2050, 2080]},
        ],
    },
    {
        "event_type": "Coastal Inundation",
        "path": "coastal_inundation/wri/v2",
        "id": "nosub_05",
        "display_name": "5% no subsidence",
        "description": "No subsidence; 5th percentile sea rise",
        "scenarios": [
            {"id": "Historical", "years": [1980]},
            {"id": "RCP 4.5", "years": [2030, 2050, 2080]},
            {"id": "RCP 8.5", "years": [2030, 2050, 2080]},
        ],
    },
    {
        "event_type": "Coastal Inundation",
        "path": "coastal_inundation/wri/v2",
        "id": "nosub_50",
        "display_name": "50% no subsidence",
        "description": "No subsidence; 50th percentile sea rise",
        "scenarios": [
            {"id": "Historical", "years": [1980]},
            {"id": "RCP 4.5", "years": [2030, 2050, 2080]},
            {"id": "RCP 8.5", "years": [2030, 2050, 2080]},
        ],
    },
    {
        "event_type": "Coastal Inundation",
        "path": "coastal_inundation/wri/v2",
        "id": "wtsub",
        "display_name": "Baseline with subsidence",
        "description": "Baseline condition; with subsidence",
        "scenarios": [
            {"id": "Historical", "years": [1980]},
            {"id": "RCP 4.5", "years": [2030, 2050, 2080]},
            {"id": "RCP 8.5", "years": [2030, 2050, 2080]},
        ],
    },
    {
        "event_type": "Coastal Inundation",
        "path": "coastal_inundation/wri/v2",
        "id": "wtsub_95",
        "display_name": "95% with subsidence",
        "description": "With subsidence; 95th percentile sea rise",
        "scenarios": [
            {"id": "RCP 4.5", "years": [2030, 2050, 2080]},
            {"id": "RCP 8.5", "years": [2030, 2050, 2080]},
        ],
    },
    {
        "event_type": "Coastal Inundation",
        "path": "coastal_inundation/wri/v2",
        "id": "wtsub_05",
        "display_name": "5% with subsidence",
        "description": "With subsidence; 5th percentile sea rise",
        "scenarios": [
            {"id": "Historical", "years": [1980]},
            {"id": "RCP 4.5", "years": [2030, 2050, 2080]},
            {"id": "RCP 8.5", "years": [2030, 2050, 2080]},
        ],
    },
    {
        "event_type": "Coastal Inundation",
        "path": "coastal_inundation/wri/v2",
        "id": "wtsub_50",
        "display_name": "50% with subsidence",
        "description": "With subsidence; 50th percentile sea rise",
        "scenarios": [
            {"id": "Historical", "years": [1980]},
            {"id": "RCP 4.5", "years": [2030, 2050, 2080]},
            {"id": "RCP 8.5", "years": [2030, 2050, 2080]},
        ],
    },
]
