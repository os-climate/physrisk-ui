import axios from 'axios';

export const hazardMenuInitialiser = () => {
    return {
        inventory: null,
        menus: null,
        menuOptions: null,
        selectedIndices: [0],
        model: null
    }
};

export const hazardMenuReducer = (state, action) => {
    switch (action.type) {
        case "initialise":
            var [menuOptions, newSelectedIndices, selection] = updateMenuOptions(action.payload.inventory, action.payload.selectedIndices)  
            var [hazardTypeId, model, scenario, year] = selection
            var [mapId, colorbar] = action.payload.inventory.getMapIdColorbar(hazardTypeId, model.id, scenario.id, year)
            return {
                inventory: action.payload.inventory,
                selectedIndices: newSelectedIndices,
                selectedHazardTypeId: hazardTypeId, 
                selectedModel: model, // model object 
                selectedScenario: scenario, // scenario object
                selectedYear: year, 
                mapId: mapId,
                mapColorbar: colorbar,
                menus: action.payload.menus,
                menuOptions: menuOptions 
            };
        case "update":
            var [menuOptions, newSelectedIndices, selection] = updateMenuOptions(state.inventory, action.payload.selectedIndices)
            var [hazardTypeId, model, scenario, year] = selection
            var [mapId, colorbar] = state.inventory.getMapIdColorbar(hazardTypeId, model.id, scenario.id, year)
            return {
                ...state,
                selectedIndices: newSelectedIndices,
                selectedHazardTypeId: hazardTypeId, 
                selectedModel: model, // model object 
                selectedScenario: scenario, // scenario object
                selectedYear: year, 
                mapId: mapId,
                mapColorbar: colorbar,
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
        //const apiHost = 'http://127.0.0.1:5000';
        var response = await axios.post(apiHost+'/api/get_hazard_data_availability', {});
        var inventory = new HazardInventory(response.data.models, response.data.colormaps);
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
export class HazardInventory {
    constructor(models, colormaps) {
        this.modelsOfHazardType = {};

        models.forEach(model => {
            addItemToDict(this.modelsOfHazardType, model.event_type, model);
        });

        this.colorbars = {}
        for (const [key, value] of Object.entries(colormaps)) {
            this.colorbars[key] = getColorbar(value)
        }
    }

    /** Return hazard event types. */
    getHazardTypeIds() {
        return Object.keys(this.modelsOfHazardType);
    }

    getMapIdColorbar(hazardTypeId, modelId, scenarioId, year) {
        // need some static typing here I feel (move this code to TypeScript?)
        const model = this.modelsOfHazardType[hazardTypeId]
            .filter(m => m.id == modelId)[0]
        const period = model.scenarios
            .filter(s => s.id == scenarioId)[0].periods
            .filter(p => p.year == year)[0]
        
        const colorbar = this.colorbars[model.map.colormap]
        return [period.map_id, colorbar]
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

// Note that all of this look-up information will be retrieved via API call.
// This includes inventory, map IDs, and map color bars.
// Added here as temporary measure pending update of API.

function getColorbar(colormap)
{
    //const colormap = {"colormap":{"0":[255,255,255,0],"1":[255,255,255,0],"2":[236,173,127,200],"3":[236,172,126,200],"4":[236,171,126,200],"5":[236,170,125,200],"6":[236,169,124,200],"7":[236,168,124,200],"8":[236,167,123,200],"9":[236,166,123,200],"10":[236,166,122,200],"11":[236,165,121,200],"12":[235,164,121,200],"13":[235,163,120,200],"14":[235,162,120,200],"15":[235,161,119,200],"16":[235,160,118,200],"17":[235,159,118,200],"18":[235,158,117,200],"19":[235,157,117,200],"20":[235,156,116,200],"21":[235,155,116,200],"22":[235,154,115,200],"23":[234,153,114,200],"24":[234,152,114,200],"25":[234,151,113,200],"26":[234,150,113,200],"27":[234,149,112,200],"28":[234,148,111,200],"29":[234,147,111,200],"30":[234,146,110,200],"31":[234,145,110,200],"32":[233,144,109,200],"33":[233,143,109,200],"34":[233,142,108,200],"35":[233,141,107,200],"36":[233,140,107,200],"37":[233,139,106,200],"38":[233,138,106,200],"39":[233,137,105,200],"40":[232,136,105,200],"41":[232,135,104,200],"42":[232,134,103,200],"43":[232,133,103,200],"44":[232,132,102,200],"45":[232,131,102,200],"46":[232,130,101,200],"47":[232,129,101,200],"48":[231,128,100,200],"49":[231,127,100,200],"50":[231,126,99,200],"51":[231,125,99,200],"52":[231,124,98,200],"53":[231,123,98,200],"54":[230,122,98,200],"55":[230,121,97,200],"56":[230,120,97,200],"57":[230,119,96,200],"58":[230,118,96,200],"59":[229,118,96,200],"60":[229,117,95,200],"61":[229,116,95,200],"62":[229,115,95,200],"63":[229,114,94,200],"64":[228,113,94,200],"65":[228,112,94,200],"66":[228,111,93,200],"67":[228,110,93,200],"68":[227,109,93,200],"69":[227,108,93,200],"70":[227,107,92,200],"71":[227,106,92,200],"72":[226,105,92,200],"73":[226,104,92,200],"74":[226,103,92,200],"75":[225,102,92,200],"76":[225,101,91,200],"77":[225,100,91,200],"78":[224,99,91,200],"79":[224,98,91,200],"80":[224,97,91,200],"81":[223,96,91,200],"82":[223,95,91,200],"83":[223,94,91,200],"84":[222,93,91,200],"85":[222,92,91,200],"86":[221,91,91,200],"87":[221,90,91,200],"88":[221,89,91,200],"89":[220,89,92,200],"90":[220,88,92,200],"91":[219,87,92,200],"92":[219,86,92,200],"93":[218,85,92,200],"94":[218,84,92,200],"95":[217,83,93,200],"96":[217,83,93,200],"97":[216,82,93,200],"98":[215,81,93,200],"99":[215,80,94,200],"100":[214,79,94,200],"101":[214,79,94,200],"102":[213,78,94,200],"103":[212,77,95,200],"104":[212,77,95,200],"105":[211,76,95,200],"106":[211,75,96,200],"107":[210,75,96,200],"108":[209,74,96,200],"109":[208,73,97,200],"110":[208,73,97,200],"111":[207,72,97,200],"112":[206,71,98,200],"113":[206,71,98,200],"114":[205,70,98,200],"115":[204,70,99,200],"116":[203,69,99,200],"117":[202,69,99,200],"118":[202,68,100,200],"119":[201,68,100,200],"120":[200,67,101,200],"121":[199,67,101,200],"122":[198,66,101,200],"123":[197,66,102,200],"124":[197,66,102,200],"125":[196,65,102,200],"126":[195,65,103,200],"127":[194,65,103,200],"128":[193,64,103,200],"129":[192,64,104,200],"130":[191,63,104,200],"131":[190,63,104,200],"132":[189,63,104,200],"133":[188,63,105,200],"134":[187,62,105,200],"135":[186,62,105,200],"136":[186,62,105,200],"137":[185,61,106,200],"138":[184,61,106,200],"139":[183,61,106,200],"140":[182,61,106,200],"141":[181,60,107,200],"142":[180,60,107,200],"143":[179,60,107,200],"144":[178,60,107,200],"145":[177,59,108,200],"146":[176,59,108,200],"147":[175,59,108,200],"148":[174,59,108,200],"149":[173,58,108,200],"150":[172,58,109,200],"151":[171,58,109,200],"152":[170,58,109,200],"153":[169,57,109,200],"154":[168,57,109,200],"155":[168,57,110,200],"156":[167,57,110,200],"157":[166,56,110,200],"158":[165,56,110,200],"159":[164,56,110,200],"160":[163,56,110,200],"161":[162,55,110,200],"162":[161,55,111,200],"163":[160,55,111,200],"164":[159,55,111,200],"165":[158,54,111,200],"166":[157,54,111,200],"167":[156,54,111,200],"168":[155,54,111,200],"169":[154,53,111,200],"170":[154,53,111,200],"171":[153,53,112,200],"172":[152,53,112,200],"173":[151,52,112,200],"174":[150,52,112,200],"175":[149,52,112,200],"176":[148,52,112,200],"177":[147,51,112,200],"178":[146,51,112,200],"179":[145,51,112,200],"180":[144,51,112,200],"181":[143,50,112,200],"182":[142,50,112,200],"183":[141,50,112,200],"184":[141,50,112,200],"185":[140,49,112,200],"186":[139,49,112,200],"187":[138,49,112,200],"188":[137,49,112,200],"189":[136,48,112,200],"190":[135,48,112,200],"191":[134,48,112,200],"192":[133,48,112,200],"193":[132,48,112,200],"194":[131,47,112,200],"195":[130,47,112,200],"196":[129,47,112,200],"197":[128,47,112,200],"198":[127,47,112,200],"199":[126,46,112,200],"200":[126,46,112,200],"201":[125,46,111,200],"202":[124,46,111,200],"203":[123,46,111,200],"204":[122,45,111,200],"205":[121,45,111,200],"206":[120,45,111,200],"207":[119,45,111,200],"208":[118,45,110,200],"209":[117,44,110,200],"210":[116,44,110,200],"211":[115,44,110,200],"212":[114,44,110,200],"213":[113,44,109,200],"214":[112,44,109,200],"215":[111,43,109,200],"216":[110,43,109,200],"217":[109,43,109,200],"218":[108,43,108,200],"219":[108,43,108,200],"220":[107,43,108,200],"221":[106,42,108,200],"222":[105,42,107,200],"223":[104,42,107,200],"224":[103,42,107,200],"225":[102,42,107,200],"226":[101,41,106,200],"227":[100,41,106,200],"228":[99,41,106,200],"229":[98,41,105,200],"230":[97,41,105,200],"231":[96,40,105,200],"232":[95,40,104,200],"233":[94,40,104,200],"234":[93,40,104,200],"235":[93,40,104,200],"236":[92,39,103,200],"237":[91,39,103,200],"238":[90,39,103,200],"239":[89,39,102,200],"240":[88,38,102,200],"241":[87,38,102,200],"242":[86,38,101,200],"243":[85,38,101,200],"244":[84,38,101,200],"245":[83,37,100,200],"246":[82,37,100,200],"247":[82,37,100,200],"248":[81,36,100,200],"249":[80,36,99,200],"250":[79,36,99,200],"251":[78,36,99,200],"252":[77,35,98,200],"253":[76,35,98,200],"254":[75,35,98,200],"255":[74,34,98,200]},"nodata":{"color_index":0},"min":{"data":0.0,"color_index":1},"max":{"data":2.0,"color_index":255}}
    const minIndex = colormap["min"]["color_index"]
    const maxIndex = colormap["max"]["color_index"]
    const n = maxIndex - minIndex + 1
    const stops = [...Array(n).keys()].map(i => 
        ({ 
            offset: (i * 100.0 / (n - 1)).toFixed(1) + "%",
            stopColor: rgbToHex(colormap["colormap"][(i + minIndex).toString()]),
        }))
    return { stops: stops, minValue: colormap["min"]["data"], maxValue: colormap["max"]["data"], units: colormap["units"] }
}


function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  
  function rgbToHex(rgb) {
    return "#" + componentToHex(rgb[0]) + componentToHex(rgb[1]) + componentToHex(rgb[2]);
  }

export const exampleInventory = [
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
    }
]
