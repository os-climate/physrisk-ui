/** State of the hazard index (non-spatial dimension, e.g. return period or
 *  threshold) shown on the map, as given by the API's get_image_info for the
 *  selected model, scenario and year. */
export const indexValuesInitialState = {
    status: "idle",
    // the selection the values are for (see indexValuesKey)
    key: null,
    error: null,
    allIndexValues: [],
    availableIndexValues: [],
    indexDisplayName: null,
    indexUnits: null,
    indexSelectedValue: null,
    maxZoom: null,
    tileSize: null,
}

export const indexValuesReducer = (state, action) => {
    switch (action.type) {
        case "FETCHING":
            // keep the previous values while fetching, so the index menu does
            // not disappear and reappear on every change of selection
            return { ...state, status: "fetching", error: null }
        case "FETCHED": {
            const available = action.payload.availableIndexValues
            return {
                ...indexValuesInitialState,
                status: "fetched",
                key: action.payload.key,
                allIndexValues: action.payload.allIndexValues,
                availableIndexValues: available,
                indexDisplayName: action.payload.indexDisplayName,
                indexUnits: action.payload.indexUnits,
                // keep the selected value (e.g. a 100 year return period)
                // where the new model offers it
                indexSelectedValue: available.includes(state.indexSelectedValue)
                    ? state.indexSelectedValue
                    : available.at(-1),
                maxZoom: action.payload.maxZoom,
                tileSize: action.payload.tileSize,
            }
        }
        case "SELECTED":
            return {
                ...state,
                status: "fetched",
                indexSelectedValue: action.payload.indexSelectedValue,
            }
        case "FETCH_ERROR":
            return {
                ...indexValuesInitialState,
                status: "error",
                error: action.payload,
            }
        default:
            return state
    }
}

/** Key of the selected model, scenario and year that index values are for. */
export function indexValuesKey(hazardMenu) {
    if (!hazardMenu?.selectedModel) return null
    return [
        hazardMenu.selectedModel.path,
        hazardMenu.selectedScenario?.id,
        hazardMenu.selectedYear,
    ].join("|")
}

/** Index state to use when requesting tiles for the selection with the given
 *  key. Values of a previous selection do not apply to the current one (e.g.
 *  its threshold may not exist, giving missing tiles), so until the current
 *  ones are fetched, use defaults. Note that on the first render after a
 *  change of selection, the fetch has not even started. */
export function tileIndexValues(state, key) {
    return state.status == "fetched" && state.key == key
        ? state
        : indexValuesInitialState
}

/** e.g. "Return period: 100 years" */
export function indexValueCaption(state) {
    if (state.indexSelectedValue == null) return ""
    return (
        capitalise(state.indexDisplayName) +
        ": " +
        state.indexSelectedValue +
        (state.indexUnits ? " " + state.indexUnits : "")
    )
}

export function capitalise(text) {
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : ""
}
