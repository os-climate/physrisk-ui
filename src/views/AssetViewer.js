import { useContext, useEffect, useReducer, React } from "react"
import Button from "@mui/material/Button"
import Divider from "@mui/material/Divider"
import Grid from "@mui/material/Grid"
import Box from "@mui/material/Box"
import Paper from "@mui/material/Paper"
import { Upload, List, PlayArrow} from "@mui/icons-material"
import LoadingButton from "@mui/lab/LoadingButton"
import ScatterMap from "../components/ScatterMap"
import Stack from "@mui/material/Stack"
import AssetTable from "../components/AssetTable"
import AssetImpactSummary from "../components/AssetImpactSummary"
import MenuButton from "../components/MenuButton"
import { hazardMenuReducer, loadHazardMenuData } from "../data/HazardInventory.js"
import { loadExamplePortfolio, portfolioReducer, portfolioInitialiser, runCalculation, setExamplePortfolioNames } from "../data/Portfolio.ts"
import { GlobalDataContext } from "../data/GlobalData"

export default function AssetViewer(props) {
    const { visible } = props
    const hazardMenuInitialState = {
        inventory: null,
        menus: [],
        menuOptions: [[], [], [], []],
        selectedIndices: [0, 0, 0, 0],
    }

    const [hazardMenu, hazardMenuDispatch] = useReducer(
        hazardMenuReducer,
        hazardMenuInitialState
    )

    const [portfolio, portfolioDispatch] = useReducer(
        portfolioReducer,
        portfolioInitialiser()
    )

    const globals = useContext(GlobalDataContext);

    const uploadFile = (event) => {
        const reader = new FileReader()
        reader.onload = (event) => {
            const content = JSON.parse(event.target.result)
            if (content.items) {
                portfolioDispatch(({ type: "updatePortfolio", portfolioJson: content}))
            } else {
                // TODO: improve validation (JSON schema?) & error handling
                portfolioDispatch(({ type: "updatePortfolio", portfolioJson: {
                    items: [
                        { asset_class: "Invalid file; no asset items found." },
                    ],
                }}))
            }
        }
        reader.readAsText(event.target.files[0])
    }

    useEffect(() => {
        async function fetchHazardMenuData() {
            const hazardMenuData = await loadHazardMenuData()
            hazardMenuDispatch({ type: "initialise", payload: hazardMenuData })
        }
        fetchHazardMenuData()
        setExamplePortfolioNames(portfolioDispatch)
    }, [])

    const handleClick = async () => {
        // This is currently a no-op.
        // There are no plans for an effect as of writing.
    }

    const handleCalculateButtonClick = async () => {
        async function run() {
            portfolioDispatch(({ type: "updateStatus", newState: "running" }))
            const result = await runCalculation(portfolio, portfolioDispatch, globals)
            portfolioDispatch({ type: "updateCalculationResult", calculationResult: result })
            portfolioDispatch(({ type: "updateStatus", newState: "runComplete" }))
            console.log(result)
        }
        run()
    }

    return (
        <Grid container spacing={1}>
            {/* Map */}
            <Grid item xs={12} md={12} lg={12}>
                <Paper
                    sx={{
                        p: 2,
                        display: "flex",
                        flexDirection: "column",
                        m: 0,
                    }}
                >
                    <Stack spacing={2} direction="row">
                        <Button variant="text" component="label" endIcon={<Upload />}>
                            Load portfolio
                            <input
                                type="file"
                                multiple={false}
                                accept=".json,application/json"
                                onChange={uploadFile}
                                hidden
                            ></input>
                        </Button>
                        <MenuButton buttonText="Example portfolios" buttonIcon={<List />} 
                            menuOptions={portfolio.examplePortfolioNames}
                            onPortfolioSelected={portfolioName => loadExamplePortfolio(portfolioDispatch, portfolioName, globals)}
                        >
                        </MenuButton>
                        <LoadingButton
                            onClick={handleCalculateButtonClick}
                            endIcon={<PlayArrow />}
                            loading={portfolio.status == "running"}
                            loadingPosition="end"
                            variant="outlined"
                        >
                            Calculate impacts
                        </LoadingButton>
                    </Stack>
                    <Divider light sx={{ mt: 2 }} />
                    <ScatterMap
                        hazardMenu={hazardMenu}
                        hazardMenuDispatch={hazardMenuDispatch}
                        onClick={handleClick}
                        assetData={portfolio.portfolioJson}
                        visible={visible}
                        assetSummary={(index) => (<AssetImpactSummary assetIndex={index} assetImpact={portfolio?.calculationResult?.asset_impacts[index]}/>)} 
                    />
                    <Box sx={{ mt: 2 }} />
                    <AssetTable data={portfolio.portfolioJson} />
                </Paper>
            </Grid>
        </Grid>
    )
}
