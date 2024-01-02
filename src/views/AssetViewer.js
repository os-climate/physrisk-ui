import { useContext, useEffect, useReducer, useState, React } from "react"
import { useTheme } from "@mui/material/styles"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Divider from "@mui/material/Divider"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import { Upload, List, PlayArrow} from "@mui/icons-material"
import LoadingButton from "@mui/lab/LoadingButton"
import ScatterMap from "../components/ScatterMap"
import Slider from '@mui/material/Slider'
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import AssetTable from "../components/AssetTable"
import AssetImpactSummary from "../components/AssetImpactSummary"
import MenuButton from "../components/MenuButton"
import SingleAssetTable from "../components/SingleAssetTable"
import { hazardMenuReducer, loadHazardMenuData } from "../data/HazardInventory.js"
import { loadExamplePortfolio, portfolioReducer, portfolioInitialiser, runCalculation, setExamplePortfolioNames } from "../data/Portfolio.ts"
import { GlobalDataContext } from "../data/GlobalData"
import { createDataTable, createSingleHazardImpact, overallScores } from "../data/CalculationResult"


export default function AssetViewer(props) {
    const { visible } = props
    const theme = useTheme()
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

    const [selectedAssetIndex, setSelectedAssetIndex] = useState(0);
    const [scenarioId, setScenarioId] = useState("ssp585")
    const [year, setYear] = useState(2050)
    const [assetScores, setAssetScores] = useState(null)
    const [selectedHazard, setSelectedHazard] = useState("Coastal Flood")
    // items for results display:
    const [dataTable, setDataTable] = useState(null)
    const [singleHazardImpact, setSingleHazardImpact] = useState(null)

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
            const hazardMenuData = await loadHazardMenuData(globals)
            hazardMenuDispatch({ type: "initialise", payload: hazardMenuData })
        }
        fetchHazardMenuData()
        setExamplePortfolioNames(portfolioDispatch)
    }, [])

    useEffect(() => {
        if (portfolio?.calculationResult)
        {
            setDataTable(createDataTable(portfolio.calculationResult, selectedAssetIndex, year))
            setAssetScores(overallScores(portfolio.calculationResult, scenarioId, year))
        }
        else {
            setDataTable(null)
            setAssetScores(null)
        }
    }, [portfolio, year, selectedAssetIndex])

    useEffect(() => {
        if (portfolio?.calculationResult)
        {
            setSingleHazardImpact(createSingleHazardImpact(portfolio.calculationResult, selectedAssetIndex, 
                selectedHazard, scenarioId))
        }
        else {
            setSingleHazardImpact(null)
        }
    }, [portfolio, selectedHazard, scenarioId, selectedAssetIndex])

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
            if (!selectedAssetIndex) setSelectedAssetIndex(0)
        }
        run()        
    }

    const yearMarks = [
        {
          value: 2030,
          label: '2030',
        },
        {
          value: 2040,
          label: '2040',
        },
        {
          value: 2050,
          label: '2050',
        }
      ];
    function yearValueText(value) {
        return `${value}`;
    }
    const handleYearChange = (event, newValue) => {
        setYear(newValue);
      };
      
    const scenarioMarks = [
        {
          value: 1,
          label: 'SSP126',
        },
        {
          value: 2,
          label: 'SSP245',
        },
        {
          value: 3,
          label: 'SSP585',
        }
      ];
    function scenarioValueText(value) {
        return `${value}`;
    }
    const handleScenarioChange = (event, newValue) => {
        setScenarioId(scenarioMarks.find(m => m.value == newValue).label.toLowerCase())
      };

    return (
        <Grid container spacing={1}>
            <Grid item xs={12} md={7} lg={7}>
                <Paper
                    sx={{
                        p: 1,
                        display: "flex",
                        flexDirection: "column",
                        m: 0
                    }} 
                >
                    <Stack spacing={2} direction="row" sx={{
                        display: "flex",
                        alignItems: "center",
                        textAlign: "center",
                        whitespace: "nowrap",
                        overflow: "auto",
                        "&::-webkit-scrollbar": {
                            display: "none",
                        },
                    }}>
                        <Button variant="text" component="label" endIcon={<Upload />} size="small" sx={{ flexShrink: 0 }}>
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
                            size="small"
                            sx={{ flexShrink: 0 }}
                        >
                            Calculate impacts
                        </LoadingButton>
                    </Stack>
                    <Divider light sx={{ mt: 2, mb: 1 }} />
                    <ScatterMap
                        hazardMenu={null} // {hazardMenu}
                        hazardMenuDispatch={null} // {hazardMenuDispatch}
                        onClick={handleClick}
                        selectedAssetIndex={selectedAssetIndex}
                        setSelectedAssetIndex={setSelectedAssetIndex}
                        assetData={portfolio.portfolioJson}
                        assetScores={assetScores}
                        visible={visible}
                        // assetSummary={(index) => (<AssetImpactSummary 
                        //     assetIndex={index} assetImpact={portfolio?.calculationResult?.result?.asset_impacts[index]}/>)} 
                    />
                    <Box sx={{ mt: 2 }} />
                    <AssetTable data={portfolio.portfolioJson} />
                </Paper>
            </Grid>
            <Grid item xs={12} md={5} lg={5}>
                <Paper
                    sx={{
                        p: 1,
                        display: "flex",
                        flexDirection: "column",
                        m: 0
                    }}>
                    <Stack spacing={2} direction="row" alignItems="center"
                        useFlexGap flexWrap="wrap"
                        sx={{justifyContent: 'space-evenly'}}>
                        <Box sx={{ width: 150, ml: 2, mr: 2 }} alignSelf="center">
                            <Typography align="center" style={theme.typography.body2}>
                                Projected year
                            </Typography>
                            <Slider
                                sx={{ 
                                    '& .MuiSlider-markLabel': { fontSize: 14 },
                                    '& .MuiSlider-mark': { height: 6 }
                                }}
                                aria-label="Projected year"
                                value={year}
                                getAriaValueText={yearValueText}
                                marks={yearMarks}
                                min={2028}
                                max={2052}
                                size="normal"
                                step={null}
                                track={false}
                                valueLabelDisplay="off"
                                onChange={handleYearChange}
                            />
                        </Box>
                        <Box sx={{ width: 150, ml: 2, mr: 2 }} alignSelf="center">
                            <Typography align="center" style={theme.typography.body2}>
                                Scenario
                            </Typography>
                            <Slider
                                sx={{ 
                                    '& .MuiSlider-markLabel': { fontSize: 14 },
                                    '& .MuiSlider-mark': { height: 6 }
                                }}
                                aria-label="Scenario"
                                value={scenarioMarks.find(m => m.label == scenarioId.toUpperCase()).value}
                                getAriaValueText={scenarioValueText}
                                marks={scenarioMarks}
                                min={0.8}
                                max={3.2}
                                size="normal"
                                step={null}
                                track={false}
                                valueLabelDisplay="off"
                                onChange={handleScenarioChange}
                            />
                        </Box>
                    </Stack>
                    <SingleAssetTable title={`Risk scores (${year}) `} 
                        rows={dataTable}
                        hazardMenu={hazardMenu}
                        selectedHazard={selectedHazard}
                        setSelectedHazard={setSelectedHazard}
                        scenarioId={scenarioId} 
                        setScenarioId={setScenarioId} 
                    />
                    {selectedHazard ? 
                    <AssetImpactSummary
                        singleHazardImpact={singleHazardImpact}
                    />
                    : <></>}
                </Paper>
            </Grid>
        </Grid>
    )
}
