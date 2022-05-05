
/** Holds hazard event availability data */
export class HazardAvailability {
    constructor(models) {
        this.modelsOfHazardType = {};

        models.forEach(model => {
            addItemToDict(this.modelsOfHazardType, model.event_type, model);
        });
    }

    /** Return hazard event types. */
    getHazardTypeOptions() {
        return Object.keys(this.modelsOfHazardType);
    }

    /** Return Model instance with given hazard event type and display name. */
    getModel(hazardType, modelDisplayName) {
        return this.modelsOfHazardType[hazardType]
            .find(model => model.display_name === modelDisplayName);
    }

    /** Return display names of Models for given hazard event types. */
    getModelOptions(hazardType) {
        return this.modelsOfHazardType[hazardType]
            .map(model => model.display_name);
      }

    /** Return scenarios for Model with given hazard event type and display name. */
    getScenarioOptions(hazardType, modelDisplayName) {
        return this.getModel(hazardType, modelDisplayName)
            .scenarios
            .map(scen => scen.id);
      }

    /** Return description for Model with given hazard event type and display name.  */
    getModelDescription(hazardType, modelDisplayName) {
        return this.getModel(hazardType, modelDisplayName)?.description; // '?' needed to handle transient state
    }

    /** Return valid projection years for Model with given hazard event type, display name and scenario.  */
    getYearOptions(hazardType, modelDisplayName, scenario) {
        return this.getModel(hazardType, modelDisplayName)
            .scenarios
            .find(scen => scen.id === scenario)
            .years;
      }
}

/** Add an item to a dictionary were the value is a list */
function addItemToDict(dict, key, item)
{
    if (!(key in dict)) dict[key] = [];
    dict[key].push(item);
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
