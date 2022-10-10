import axios from "axios"

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
   | { status: PortfolioState.RunComplete, calculationResult: string };

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
    | { type: "updateCalculationResult", newState: PortfolioState, calculationResult: any }
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
                portfolioJson: action.portfolioJson
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
    dispatch(({ type: "setExamplePortfolioNames", examplePortfolioNames: ["Mixed portfolio"] }))
}

export const loadExamplePortfolio = async (dispatch: any, examplePortfolioName: string, globals: any) => {
    try {
        console.log(globals.services.apiHost)

        dispatch(({ type: "updateStatus", newState: PortfolioState.Loading}))
        // TODO: obtain examples via API, along the lines

        //const apiHost = globals.services.apiHost;
        //var response = await axios.post(
        //    apiHost + "/api/get_example_portfolio",
        //    {}
        //)
        //console.log(response)
        
        dispatch(({ type: "updatePortfolio", portfolioJson: examplePortfolios[examplePortfolioName] }))
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
        const apiHost = globals.services.apiHost; // "http://127.0.0.1:5000"
        
        const request = {
            "assets": portfolio.portfolioJson,
                "include_asset_level": true,
                "include_calc_details": true,
                "year": 2050,
                "scenario": "rcp8p5"
        }

        var response = await axios.post(
            apiHost + "/api/get_asset_impact",
            request
        )

        return response.data
        console.log(response)
        return {}
    } catch (error) {
        console.log(error)
    }
}

const testLongitudes = [69.4787, 68.71, 20.1047, 19.8936, 19.6359]
const testLatitudes = [34.556, 35.9416, 39.9116, 41.6796, 42.0137]

const assets = {
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

const examplePortfolios: { [id: string] : any; } = {
    "Mixed portfolio": assets
}

const exampleRequest = {
    "assets": assets,
        "include_asset_level": true,
        "include_calc_details": true,
        "year": 2050,
        "scenario": "rcp8p5"
}

