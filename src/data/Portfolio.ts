import axios from "axios"
import { CalculationResult, RiskMeasuresHelper } from "./CalculationResult"

export const portfolioInitialiser = () => {
    return {
        examplePortfolioNames: [],
        status: PortfolioState.Empty,
        portfolioJson: { items: [] }
    }
}

type State =
   | { status: PortfolioState.Empty, examplePortfolioNames: string[] }
   | { status: PortfolioState.Loading, examplePortfolioNames: string[] }
   | { status: PortfolioState.Loaded, portfolioJson: string }
   | { status: PortfolioState.RunComplete, calculationResult: CalculationResult };

enum PortfolioState {
    Empty = "empty",
    Loading = "loading",
    Loaded = "loaded",
    Running = "running",
    RunComplete = "runComplete"
  };

type Action =
    | { type: "updateStatus", newState: PortfolioState }
    | { type: "setExamplePortfolioNames", examplePortfolioNames: string[] }
    | { type: "updatePortfolio", newState: PortfolioState, portfolioJson: string }
    | { type: "updateCalculationResult", newState: PortfolioState, calculationResult: CalculationResult }
    | { type: "failure", error: string };

export const portfolioReducer = (state: State, action: Action) => {
    switch (action.type) {
        case "updateStatus":
            return {
                ...state,
                status: action.newState
            }
        case "setExamplePortfolioNames":
            return {
                ...state,
                examplePortfolioNames: action.examplePortfolioNames
            }
        case "updatePortfolio":
            return {
                ...state,
                status: PortfolioState.Loaded,
                portfolioJson: action.portfolioJson,
                calculationResult: null
            }
        case "updateCalculationResult":
            return {
                ...state,
                status: PortfolioState.RunComplete,
                calculationResult: action.calculationResult
            }
        default:
            return state
        }
    }

export const setExamplePortfolioNames = async (dispatch: any) => {
    dispatch(({ type: "setExamplePortfolioNames", examplePortfolioNames: Object.keys(examplePortfolios) }))
}

export const loadExamplePortfolio = async (dispatch: any, examplePortfolioName: string, globals: any) => {
    try {
        
        dispatch(({ type: "updateStatus", newState: PortfolioState.Loading}))
        // TODO: obtain examples via API, along the lines

        //const apiHost = globals.services.apiHost;
        //var response = await axios.post(
        //    apiHost + "/api/get_example_portfolio",
        //    {}
        //)
        //console.log(response)
        
        dispatch(({ type: "updatePortfolio", portfolioJson: examplePortfolios[examplePortfolioName] }))
        
        // in case calculation result is set:
        dispatch(({ type: "updateCalculationResult", calculationResult: null}))
        
        dispatch(({ type: "updateStatus", newState: PortfolioState.Loaded}))

        return {
            inventory: "AAA"
        }
    } catch (error) {
        console.log(error)
    }
}

export const runCalculation = async (portfolio: any, dispatch: any, globals: any) => {
    try {
        const apiHost = globals.services.apiHost;
        
        const request = {
            "assets": portfolio.portfolioJson,
                "include_asset_level": true,
                "include_calc_details": true,
                "include_measures": true,
                "years": [2030, 2040, 2050],
                "scenarios": ["ssp126", "ssp245", "ssp585"]
        }

        var response = await axios.post(
            apiHost + "/api/get_asset_impact",
            request
        )

        return new CalculationResult(response.data)

    } catch (error) {
        console.log(error)
    }
}

const testLongitudes = [69.4787, 68.71, 20.1047, 19.8936, 19.6359]
const testLatitudes = [34.556, 35.9416, 39.9116, 41.6796, 42.0137]

const mixed = {
    "items": [
        {
            "asset_class": "RealEstateAsset",
            "type": "Buildings/Industrial",
            "location": "Asia",
            "longitude": testLongitudes[0],
            "latitude": testLatitudes[0],
        },
        {
            "asset_class": "PowerGeneratingAsset",
            "type": "Nuclear",
            "location": "Asia",
            "longitude": testLongitudes[1],
            "latitude": testLatitudes[1],
        }
    ],
}

const industrialActivity =
{
    "items": [
        {
            "asset_class": "IndustrialActivity",
            "type": "Construction",
            "location": "Asia",
            "latitude": 32.322,
            "longitude": 65.119
        },
        {
            "asset_class": "IndustrialActivity",
            "type": "Construction",
            "location": "South America",
            "latitude": -39.1009,
            "longitude": -68.5982
        },
        {
            "asset_class": "IndustrialActivity",
            "type": "Construction",
            "location": "South America",
            "latitude": -35.055,
            "longitude": -64.2406
        },
        {
            "asset_class": "IndustrialActivity",
            "type": "Construction",
            "location": "South America",
            "latitude": -38.7833,
            "longitude": -61.8984
        },
        {
            "asset_class": "IndustrialActivity",
            "type": "Construction",
            "location": "Oceania",
            "latitude": -32.0739,
            "longitude": 115.8914
        },
        {
            "asset_class": "IndustrialActivity",
            "type": "Construction",
            "location": "Oceania",
            "latitude": -20.485,
            "longitude": 147.75
        },
        {
            "asset_class": "IndustrialActivity",
            "type": "Construction",
            "location": "nan",
            "latitude": -38.3916,
            "longitude": 144.8553
        },
        {
            "asset_class": "IndustrialActivity",
            "type": "Construction",
            "location": "Oceania",
            "latitude": -33.85,
            "longitude": 150.9495
        },
        {
            "asset_class": "IndustrialActivity",
            "type": "Construction",
            "location": "Oceania",
            "latitude": -34.8348,
            "longitude": 138.5572
        }
    ]
}
    
const powerGenerating =
{
    "items": [
        {
            "asset_class": "PowerGeneratingAsset",
            "type": "Hydro",
            "location": "Asia",
            "latitude": 34.556,
            "longitude": 69.4787
        },
        {
            "asset_class": "PowerGeneratingAsset",
            "type": "Hydro",
            "location": "Asia",
            "latitude": 35.9416,
            "longitude": 68.71
        },
        {
            "asset_class": "PowerGeneratingAsset",
            "type": "Hydro",
            "location": "Europe",
            "latitude": 39.9116,
            "longitude": 20.1047
        },
        {
            "asset_class": "PowerGeneratingAsset",
            "type": "Gas",
            "location": "Africa",
            "latitude": 36.8789,
            "longitude": 6.9366
        },
        {
            "asset_class": "PowerGeneratingAsset",
            "type": "Gas",
            "location": "Africa",
            "latitude": 36.88,
            "longitude": 6.935
        },
        {
            "asset_class": "PowerGeneratingAsset",
            "type": "Oil",
            "location": "Africa",
            "latitude": -12.4706,
            "longitude": 13.7319
        },
        {
            "asset_class": "PowerGeneratingAsset",
            "type": "Hydro",
            "location": "Africa",
            "latitude": -12.4706,
            "longitude": 13.7319
        },
        {
            "asset_class": "PowerGeneratingAsset",
            "type": "Hydro",
            "location": "Africa",
            "latitude": -9.7523,
            "longitude": 14.4809
        },
        {
            "asset_class": "PowerGeneratingAsset",
            "type": "Oil",
            "location": "South America",
            "latitude": -39.2145,
            "longitude": -70.9157
        },
        {
            "asset_class": "PowerGeneratingAsset",
            "type": "Hydro",
            "location": "South America",
            "latitude": -31.5192,
            "longitude": -68.9814
        }
    ]
}

const reaslEstate =
{
    "items": [
        {
            "asset_class": "RealEstateAsset",
            "type": "Buildings/Industrial",
            "location": "Asia",
            "latitude": 24.0426,
            "longitude": 91.0158
        },
        {
            "asset_class": "RealEstateAsset",
            "type": "Buildings/Industrial",
            "location": "Asia",
            "latitude": 22.6588,
            "longitude": 90.3373
        },
        {
            "asset_class": "RealEstateAsset",
            "type": "Buildings/Industrial",
            "location": "Asia",
            "latitude": 23.6473,
            "longitude": 90.3473
        },
        {
            "asset_class": "RealEstateAsset",
            "type": "Buildings/Industrial",
            "location": "Asia",
            "latitude": 23.9186,
            "longitude": 90.6926
        },
        {
            "asset_class": "RealEstateAsset",
            "type": "Buildings/Industrial",
            "location": "Asia",
            "latitude": 23.6839,
            "longitude": 90.5314
        },
        {
            "asset_class": "RealEstateAsset",
            "type": "Buildings/Industrial",
            "location": "Asia",
            "latitude": 22.2972,
            "longitude": 91.8062
        },
        {
            "asset_class": "RealEstateAsset",
            "type": "Buildings/Industrial",
            "location": "Asia",
            "latitude": 23.6783,
            "longitude": 90.4295
        },
        {
            "asset_class": "RealEstateAsset",
            "type": "Buildings/Industrial",
            "location": "Asia",
            "latitude": 23.5699,
            "longitude": 90.4804
        },
        {
            "asset_class": "RealEstateAsset",
            "type": "Buildings/Industrial",
            "location": "Asia",
            "latitude": 22.8646,
            "longitude": 89.5357
        },
        {
            "asset_class": "RealEstateAsset",
            "type": "Buildings/Industrial",
            "location": "Asia",
            "latitude": 23.9904,
            "longitude": 90.3429
        }
    ]
}

const examplePortfolios: { [id: string] : any; } = {
    "Mixed portfolio (sample)": mixed,
    "Industrial activity (sample)": industrialActivity,
    "Power generating assets (sample)": powerGenerating,
    "Real estate (sample)": reaslEstate
}

