import { useContext, useEffect, useReducer, useState, React } from "react"
import { useTheme } from "@mui/material/styles"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Divider from "@mui/material/Divider"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import { Upload, List, PlayArrow} from "@mui/icons-material"
import LoadingButton from "@mui/lab/LoadingButton"
import { mapboxAccessToken, ScatterMap } from "../components/ScatterMap"
import Slider from '@mui/material/Slider'
import Stack from "@mui/material/Stack"
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Typography from "@mui/material/Typography"
import Papa from "papaparse"
import AssetTable from "../components/AssetTable"
import { AssetImpactSummary, AssetHazardSummary } from "../components/AssetImpactSummary"
import MenuButton from "../components/MenuButton"
import SingleAssetTable from "../components/SingleAssetTable"
import SingleAssetBarChart from "../components/SingleAssetBarChart"
import { hazardMenuReducer, loadHazardMenuData } from "../data/HazardInventory.js"
import { loadExamplePortfolio, portfolioReducer, portfolioInitialiser, runCalculation, setExamplePortfolioNames } from "../data/Portfolio.ts"
import { GlobalDataContext } from "../data/GlobalData"
import { createBarChartData, createDataTable, createHazardImpact, overallScores } from "../data/CalculationResult"


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

    // the screen has one asset, hazard type, scenario and year selected
    // although elements may choose to display more e.g. table of of risk scores
    // for multiple scenarios, where clicking on a row will change the selected scenario. 
    const [assetIndex, setAssetIndex] = useState(0);
    const [scenarioId, setScenarioId] = useState("ssp585")
    const [year, setYear] = useState(2050)
    const [hazardType, setHazardType] = useState("Coastal Flood")
    const [details, setDetails] = useState(null)

    const [assetScores, setAssetScores] = useState(null)
    const [dataTable, setDataTable] = useState(null)
    const [barChartData, setBarChartData] = useState(null)
    const [hazardImpact, setHazardImpact] = useState(null)

    const [impactTab, setImpactTab] = useState("1");
    const handleTabChange = (event, newValue) => {
        setImpactTab(newValue);
    };

    const globals = useContext(GlobalDataContext);

    const uploadFile = (event) => {
        const extension = event.target.files[0].name.split('.').pop(); 
        const reader = new FileReader()
        let portfolio = null
        reader.onload = (event) => {
            if (extension == "csv" || extension == "txt") {
                const transformHeader = h => {
                    const transforms = { "Asset class": "asset_class",
                        "Identifier": "id",
                        "Address": "address",
                        "Type": "type",
                        "Location": "location",
                        "Latitude": "latitude",
                        "Longitude": "longitude" }
                    return transforms[h]
                }
                let items = Papa.parse(event.target.result, { header: true,
                    transformHeader: transformHeader,
                    delimiter: extension == "csv" ? "," : "\t"
                 })?.data
                portfolio = { items: items }
            }
            else
            {
                portfolio = JSON.parse(event.target.result) 
                if (!portfolio.items) {
                    portfolio = {
                        items: [
                            { asset_class: "Invalid file; no asset items found." },
                        ],
                    }
                }
            }
            portfolioDispatch(({ type: "updatePortfolio", portfolioJson: portfolio}))
        }
        reader.readAsText(event.target.files[0])
    }
    const handleFileClick = event => {
        const { target = {} } = event || {};
        target.value = "";
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
            let dataTableRows = createDataTable(portfolio.calculationResult, assetIndex, year)
            setDataTable(dataTableRows)
            let selectedRow = dataTableRows.find(r => r.hazard == hazardType)
            setDetails(selectedRow.details[scenarioId])
            setAssetScores(overallScores(portfolio.calculationResult, scenarioId, year))
        }
        else {
            setDataTable(null)
            setAssetScores(null)
        }
    }, [portfolio, year, assetIndex])

    useEffect(() => {
        if (portfolio?.calculationResult)
        {
            setHazardImpact(createHazardImpact(portfolio.calculationResult, assetIndex, 
                hazardType, scenarioId))
            setBarChartData(createBarChartData(portfolio.calculationResult, assetIndex, hazardType))
            if (dataTable) {
                let selectedRow = dataTable.find(r => r.hazard == hazardType)
                setDetails(selectedRow.details[scenarioId])
            }
            setAssetScores(
                overallScores(portfolio.calculationResult, scenarioId, year)
            )
        } else {
            setHazardImpact(null)
        }
    }, [portfolio, hazardType, scenarioId, assetIndex])

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
            if (!assetIndex) setAssetIndex(0)
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
                                accept=".csv,.txt,.json,application/json"
                                onChange={uploadFile}
                                onClick={handleFileClick}
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
                        selectedAssetIndex={assetIndex}
                        setSelectedAssetIndex={setAssetIndex}
                        assetData={portfolio.portfolioJson}
                        assetScores={assetScores}
                        visible={visible}
                    />
                    <Box sx={{ mt: 2 }} />
                    <AssetTable data={portfolio.portfolioJson} portfolioDispatch={portfolioDispatch} apiKey={mapboxAccessToken} />
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
                        setHazardType={setHazardType}
                        setScenarioId={setScenarioId} 
                    />
                    {hazardType ?
                    <div>
                        <SingleAssetBarChart 
                            title={hazardType + " score evolution"}
                            data={barChartData}
                            hazard={hazardType}
                            scenarios={scenarioMarks.map(m => m.label)}
                        />
                        {hazardImpact ? 
                        <Box sx={{ width: '100%', typography: 'body1', mt: 1 }}>
                            <TabContext value={impactTab}>
                                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList onChange={handleTabChange} aria-label="lab API tabs example">
                                    <Tab label="Score details" value="1" />
                                    <Tab label="Impact details" value="2" />
                                    <Tab label="Hazard details" value="3" />
                                </TabList>
                                </Box>
                                <TabPanel value="1">
                                    {details ?
                                        <div>
                                            <Typography sx={{ mt: 1 }} variant="body2">
                                                {`For hazard type '${hazardType}' and ${scenarioId.toUpperCase()} scenario the impact is '${details?.valueText}'. `}
                                                {details?.label}
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 0.5, fontStyle: "italic" }}>
                                                {details?.description}
                                            </Typography>
                                        </div>
                                    : <></>}
                                </TabPanel>    
                                <TabPanel value="2">
                                    <AssetImpactSummary
                                        singleHazardImpact={hazardImpact}
                                    />
                                </TabPanel>
                                <TabPanel value="3">
                                    <AssetHazardSummary
                                        singleHazardImpact={hazardImpact} 
                                    />
                                </TabPanel>
                            </TabContext>
                        </Box> : <></>}
                    </div>
                    : <></>}
                </Paper>
            </Grid>
        </Grid>
    )
}
