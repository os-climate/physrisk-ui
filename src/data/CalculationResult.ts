type ScoreBasedRiskMeasureDefinition = {
  hazard_types: string[]
  values: {
    value: number // or category
    label: string
    description: string 
  }[]
  underlying_measures: {
    measure_id: string
    label: string
    description: string
  }[]
}

type RiskMeasuresForAssets = {
  key: { 
    hazard_type: string
    scenario_id: string
    year: string
    measure_id: string
  }
  scores: number[] // scores for each asset
  measures_0: number[] // measure_0 for each asset
  measures_1: number[] // measure_1 for each asset
}

type RiskMeasures = {
  measures_for_assets: RiskMeasuresForAssets[]
  score_based_measure_set_defn: {
    measure_set_id: string
    asset_measure_ids_for_hazard: { [key: string]: string[] } 
    score_definitions: { [key: string]: ScoreBasedRiskMeasureDefinition }
  }
  measures_definitions: {
    measure_id: string
    label: string
    description: string
  }[]
  scenarios: { 
    id: string
    years: [number] 
  }[]
  asset_ids: string[]
}

type AssetLevelImpact = {
  assetId: string
  impacts: AssetSingleImpact[]
}

type AssetSingleImpact = {
  key: {
    hazard_type: string
    scenario_id: string
    year: string
  }
  impact_type: string
  impact_exceedance: {
    values: number[]
    exceed_probabilities: number[]
  }
  impact_mean: number
  impact_std_deviation: number
  impact_units: string 
  calc_details: {
    hazard_exceedance: {
      values: number[]
      exceed_probabilities: number[]
      units: string
    }
    hazard_distribution: any
    vulnerability_distribution: any
  }
}

const defaultScenarios: string[] = [ "SSP126", "SSP245", "SSP585" ]

const defaultYears: number[] = [ 2030, 2040, 2050 ]

const hazardMap: { [key: string]: string }  = {
  "CoastalInundation": "Coastal Flood",
  "RiverineInundation": "Riverine Flood",
  "ChronicHeat": "Heat",
  "Wind": "Wind",
  "Drought": "Drought",
  "Fire": "Wildfire",
  "Hail": "Hail",
}

function getMeasureKey(riskMeasures: RiskMeasuresForAssets) 
{
  return getKey(riskMeasures.key.hazard_type, riskMeasures.key.scenario_id,
    riskMeasures.key.year, riskMeasures.key.measure_id)
}

function getKey(hazardType: string, scenarioId: string, year: string, measure_id: string)
{
  return [hazardType, scenarioId, year, measure_id].join(",")
}

export class CalculationResult {
  assetImpacts: AssetLevelImpact[]
  riskMeasuresHelper: RiskMeasuresHelper
  rawResult : any

  constructor(calculationResult: any) {
    this.rawResult = calculationResult
    this.riskMeasuresHelper = new RiskMeasuresHelper(calculationResult.risk_measures)
    this.assetImpacts = calculationResult?.asset_impacts
  }
}

export class RiskMeasuresHelper {
  riskMeasures: RiskMeasures;
  measures: { [id: string] : RiskMeasuresForAssets; };
  
  constructor(riskMeasures: RiskMeasures) {
    this.riskMeasures = riskMeasures;

    this.measures = {}
    riskMeasures.measures_for_assets.forEach(m => 
      this.measures[getMeasureKey(m)] = m
    )
  }
  
  measure(hazardType: string, scenarioId: string, year: number)
  {
    const measure_key = getKey(hazardType, scenarioId, year.toString(), this.measure_set_id())
    const measure = this.measures[measure_key]
    const assetScores = measure.scores
    const assetMeasures = [measure.measures_0, measure.measures_1]
    // scores for each asset
    // measure IDs for each asset (for the hazard type in question)
    const measureIds = this.measure_definition().asset_measure_ids_for_hazard[hazardType]
    // measure definitions for each asset
    const measureDefinitions = measureIds.map(mid =>
        mid != "na" ? this.measure_definition().score_definitions[mid] : null)
    return { assetScores: assetScores, assetMeasures: assetMeasures, measureDefinitions: measureDefinitions }
  }

  measure_definition() {
    return this.riskMeasures.score_based_measure_set_defn;
  }

  measure_set_id() {
    return this.riskMeasures.score_based_measure_set_defn.measure_set_id;
  }

  scenarios() {
    return this.riskMeasures.scenarios
  }

  scoreDetails(score: number, definition: ScoreBasedRiskMeasureDefinition)
  {
    let details = definition.values.find(v => v.value == score)
    if (!details) return { value: -1, valueText: "No data", label: "", description: "" } 
    return {...details, valueText: scoreText(details ? details.value : -1)}
  }
}

export function scoreText(score: number)
{
  if (score == 0) return "No data"
  else if (score == 1) return "Low"
  else if (score == 2) return "Medium"
  else if (score == 3) return "High"
  else if (score == 4) return "Red flag"
  else return "No data"
}

export function scoreTextToNumber(valueText: string) 
{
  switch (valueText)
  {
    case "No data":
      return 0
    case "Low":
      return 1
    case "Medium":
      return 2
    case "High":
      return 3
    case "Red flag":
      return 4
    default:
      return -1
  }
}

type ScoreDetails = {
  value: number
  valueText: string
  label: string
  description: string
}

/**
 * Create a data table for a given year and asset index.
 * @param result 
 * @param assetIndex 
 * @param year 
 * @returns 
 */
export function createDataTable(result: CalculationResult, assetIndex: number, year: number)
{
  const helper = result.riskMeasuresHelper
  let table: {[key: string]: string|number|{[key: string]: ScoreDetails}}[] = []
  Object.keys(hazardMap).forEach(hazardType => {
    let row: {[key: string]: string|number|{[key: string]: ScoreDetails}} = { "hazard": hazardMap[hazardType], "id": hazardMap[hazardType] }
    table.push(row)
    let rowDetails: {[key: string]: ScoreDetails} = {}
    row["details"] = rowDetails
    helper.scenarios().forEach(scenario => {
      if (scenario.years.includes(year))
      {
        const measure = helper.measure(hazardType, scenario.id, year)
        let score = measure.assetScores[assetIndex]
        let measures = measure.assetMeasures[assetIndex]
        let measureDefn = measure.measureDefinitions[assetIndex]
        if (measureDefn)
        {
          let details = helper.scoreDetails(score, measureDefn)
          rowDetails[scenario.id] = details
          row[scenario.id] = details.valueText
        }
        else row[scenario.id] = "No data"
      }
    });
  });
  return table
}

export function createBarChartData(result: CalculationResult, assetIndex: number,
  hazardType: string, years: number[] = defaultYears)
{
  const helper = result.riskMeasuresHelper
  const barChartData: {[key: string]: string|number}[] = []
  let hazardTypeKey: any = Object.entries(hazardMap).find(item => item[1] === hazardType)?.[0]
  years.forEach(year => {
    let yearData: {[key: string]: string|number} = { "year": year }
    helper.scenarios().forEach(scenario => {
      if (scenario.years.includes(year))
      {
        const measure = helper.measure(hazardTypeKey, scenario.id, year)
        //let measureDefn = measure.measureDefinitions[assetIndex]
        if (measure)
        {
          let score = measure.assetScores[assetIndex]
          yearData[scenario.id.toUpperCase()] = score
        }
      }
    })
    barChartData.push(yearData)
  })
  return barChartData
}

function graphDataPoint(x: number, y: number) {
  return { x, y }
}

export function createHazardImpact(result: CalculationResult, assetIndex: number,
  hazardType: string, scenarioId: string) {
  if (assetIndex === null) return
  const assetImpacts = result.assetImpacts[assetIndex].impacts
  const allYears = ["historical", ...(defaultYears.map(y => y.toString()))]
  let curveSet: {[key: string]: any} = {}
  let hazardCurveSet: {[key: string]: any} = {}
  
  var units = hazardType == "Heat" ? "kWh"  : "%" // get this from the service instead in future
  allYears.forEach(y => {
    let impacts = assetImpacts.find(i => hazardMap[i.key.hazard_type] === hazardType
      && i.key.scenario_id === (y === "historical" ? "historical" : scenarioId)
      && i.key.year === (y === "historical" ? "None" : y.toString()))
    if (impacts)
    {
      let scale = (units == "%") ? 100 : 1
      // for exceedance curves the curve might go to probability 0 which will not work
      // on a log plot. We want to truncate to probability 0.001 (1-in-1000 year events)
      let probs: number[] = impacts!.impact_exceedance.exceed_probabilities
      let values: number[] = impacts!.impact_exceedance.values
      let [probsCapped, valuesCapped] = capCurve(probs, values)
      let data = probsCapped.map((item, i) =>
        graphDataPoint(
          1.0 / item, // expects return periods
          valuesCapped[i] * scale 
      )).reverse()
      curveSet[y] = data
      
      if (impacts!.calc_details?.hazard_exceedance) {
        let hazardProbs: number[] = impacts!.calc_details.hazard_exceedance.exceed_probabilities
        let hazardValues: number[] = impacts!.calc_details.hazard_exceedance.values
        let [hazardProbsCapped, hazardValuesCapped] = capCurve(hazardProbs, hazardValues, 0.001, false)
        let hazardData = hazardProbsCapped.map((item, i) =>
          graphDataPoint(
            1.0 / item, // expects return periods
            hazardValuesCapped[i]
        )).reverse()
        hazardCurveSet[y] = hazardData
      }
    }
  })
  return { hazardType: hazardType, scenario: scenarioId.toUpperCase(), 
    impactCurveSet: { units: units, curves: curveSet },
    hazardCurveSet: { curves: hazardCurveSet } }
}

export function overallScores(result: CalculationResult, scenarioId: string, year: number) {
  const helper = result.riskMeasuresHelper
  let scores: number[] = []
  Object.keys(hazardMap).forEach(hazardType => {
    const measure = helper.measure(hazardType, scenarioId, year)
    if (scores.length === 0) {
      scores = measure.assetScores }
    else {
      scores = measure.assetScores.map((s, i) => Math.max(s, scores[i]))
    }
  })
  return scores.map(s => scoreText(s))
}

function capCurve(probs: number[], values: number[], probCap = 0.001, extrapolate = true)
{
  // assume that probs is sorted decreasing and probs and values have same length
  let probsCapped = probs.filter(p => p >= probCap)
  let valuesCapped = values.filter((v, i) => i < probsCapped.length)
  if (extrapolate && probs.length > probsCapped.length && probsCapped[probsCapped.length - 1] != probCap)
  {
    // we need to add prob 0.001 by linear interpolation
    let index = probsCapped.length - 1
    let value = values[index] + (probCap - probs[index]) * (values[index + 1] - values[index]) / (probs[index + 1] - probs[index])
    probsCapped.push(probCap)
    valuesCapped.push(value)
  }
  return [probsCapped, valuesCapped]
  //return { probs: probsCapped, values: valuesCapped }
}




