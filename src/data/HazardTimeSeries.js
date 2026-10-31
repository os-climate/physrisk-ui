/** Indicator values at a location across all scenarios and years of a model,
 *  for the "over time" chart of the hazard viewer. */

const requestItemId = (scenarioId, year) => scenarioId + "|" + year

/** Future scenarios preferred for display, each with its RCP equivalent. */
const preferredScenarios = [
    ["ssp126", "rcp2p6"],
    ["ssp245", "rcp4p5"],
    ["ssp585", "rcp8p5"],
]
const preferredYears = [2030, 2050, 2080]
const maxShown = 3

/** Future scenarios shown by default (others can be shown via the legend):
 *  SSP1-2.6, SSP2-4.5 and SSP5-8.5, or their RCP equivalents, topped up with
 *  any other scenarios to at most 3. */
export function defaultScenarioIds(model) {
    const future = model.scenarios
        .map((s) => s.id)
        .filter((id) => id != "historical")
    const preferred = preferredScenarios
        .map((ids) => ids.find((id) => future.includes(id)))
        .filter((id) => id)
    const others = future.filter((id) => !preferred.includes(id))
    return [...preferred, ...others].slice(0, maxShown)
}

/** Years shown by default: those nearest to 2030, 2050 and 2080. */
export function defaultYears(years) {
    const nearest = (target) =>
        years.reduce((best, y) =>
            Math.abs(y - target) < Math.abs(best - target) ? y : best
        )
    return [...new Set(preferredYears.map(nearest))]
}

/** Whether a scenario/year is shown by default; historical always is. */
export function isShownByDefault(model, scenarioId, year) {
    if (scenarioId == "historical") return true
    const scenario = model.scenarios.find((s) => s.id == scenarioId)
    return (
        defaultScenarioIds(model).includes(scenarioId) &&
        defaultYears(scenario.years).includes(year)
    )
}

/** Items for a get_hazard_data request covering every scenario and year. */
export function timeSeriesRequestItems(hazardTypeId, model, lngLat) {
    return model.scenarios.flatMap((scenario) =>
        scenario.years.map((year) => ({
            request_item_id: requestItemId(scenario.id, year),
            event_type: hazardTypeId,
            longitudes: [lngLat.lng],
            latitudes: [lngLat.lat],
            year: year,
            scenario: scenario.id,
            indicator_id: model.indicator_id,
            path: model.path,
        }))
    )
}

/** Intensity curves of a get_hazard_data response, keyed by request item ID. */
export function curvesByRequestItemId(responseItems) {
    const curves = {}
    responseItems.forEach((item) => {
        curves[item.request_item_id] = item.intensity_curve_set[0]
    })
    return curves
}

/** Whether the curves have several numeric index values (e.g. return periods
 *  or thresholds), rather than single values or labelled values like min/max. */
export function hasNumericCurves(curves) {
    return Object.values(curves).some(
        (c) => c.intensities.length > 1 && typeof c.index_values[0] == "number"
    )
}

/** One curve of { x: index value, y: value } points per scenario and year,
 *  historical first. yearRank is 0 for a scenario's earliest year and 1 for
 *  its latest, e.g. for shading. */
export function scenarioYearCurves(model, curves) {
    const scenarios = [...model.scenarios].sort(
        (a, b) => (b.id == "historical") - (a.id == "historical")
    )
    return scenarios.flatMap((scenario) =>
        scenario.years.flatMap((year, i) => {
            const curve = curves[requestItemId(scenario.id, year)]
            if (!curve || curve.intensities.length == 0) return []
            const points = curve.index_values.map((x, j) => ({
                x,
                y: curve.intensities[j],
            }))
            // ordered as for the single curve of the selected scenario/year
            if (curve.index_name == "return period") points.reverse()
            return [
                {
                    scenarioId: scenario.id,
                    year,
                    yearRank:
                        scenario.years.length > 1
                            ? i / (scenario.years.length - 1)
                            : 1,
                    indexName: curve.index_name,
                    points,
                },
            ]
        })
    )
}

/** Value of a curve at an index value (e.g. a return period or threshold).
 *  Single-valued curves have no index to choose; otherwise the value is
 *  interpolated linearly between numeric index values, or null if out of range. */
export function valueAtIndex(curve, indexValue) {
    if (!curve || curve.intensities.length == 0) return null
    if (curve.intensities.length == 1) return curve.intensities[0]
    const exact = curve.index_values.findIndex((v) => v == indexValue)
    if (exact >= 0) return curve.intensities[exact]
    if (typeof indexValue != "number") return null
    const points = curve.index_values
        .map((x, i) => ({ x, y: curve.intensities[i] }))
        .sort((a, b) => a.x - b.x)
    for (let i = 1; i < points.length; i++) {
        const [p0, p1] = [points[i - 1], points[i]]
        if (indexValue >= p0.x && indexValue <= p1.x) {
            return p0.y + ((indexValue - p0.x) * (p1.y - p0.y)) / (p1.x - p0.x)
        }
    }
    return null
}

/** One series of { x: year, y: value } points per future scenario. The
 *  historical value, if any, starts each series so that the scenarios are
 *  shown diverging from it, and is also returned on its own. */
export function scenarioTimeSeries(model, curves, indexValue) {
    const pointsOf = (scenario) =>
        scenario.years
            .map((year) => ({
                x: year,
                y: valueAtIndex(
                    curves[requestItemId(scenario.id, year)],
                    indexValue
                ),
                scenarioId: scenario.id,
            }))
            .filter((p) => p.y != null)
    const historicalScenario = model.scenarios.find((s) => s.id == "historical")
    const historical = historicalScenario ? pointsOf(historicalScenario) : []
    const series = model.scenarios
        .filter((s) => s.id != "historical")
        .map((s) => ({
            scenarioId: s.id,
            points: [...historical, ...pointsOf(s)],
        }))
    return { historical, series }
}
