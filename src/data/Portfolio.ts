import axios from "axios"
import { CalculationResult, RiskMeasuresHelper } from "./CalculationResult"

export const portfolioInitialiser = () => {
    return {
        examplePortfolios: {},
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
    | { type: "setExamplePortfolios", examplePortfolios: any }
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
        case "setExamplePortfolios":
            return {
                ...state,
                examplePortfolios: action.examplePortfolios
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

export const loadExamplePortfolio = async (portfolio: any, dispatch: any, examplePortfolioName: string, globals: any) => {
    try {
        
        dispatch(({ type: "updateStatus", newState: PortfolioState.Loading}))

        dispatch(({ type: "updatePortfolio", portfolioJson: portfolio.examplePortfolios[examplePortfolioName] }))
        
        // in case calculation result is set:
        dispatch(({ type: "updateCalculationResult", calculationResult: null}))
        
        dispatch(({ type: "updateStatus", newState: PortfolioState.Loaded}))

        return {
            inventory: "example portfolio loaded"
        }
    } catch (error) {
        console.log(error)
    }
}

export const loadExamplePortfolios = async (globals: any) => {
    try {
        const apiHost = globals.services.apiHost;
        
        var response = await axios.get(
            apiHost + "/api/get_example_portfolios",
            {}
        )
        return response.data.portfolios

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