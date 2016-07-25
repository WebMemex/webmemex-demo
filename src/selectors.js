export function getEmptyItemState(state, itemId) {
    let itemState = state.volatile.emptyItems[itemId]
    return itemState
}

export function getAutoSuggestSuggestions(state, inputValue) {
    let autoSuggestion = state.volatile.autoSuggestions[inputValue]
    if (autoSuggestion) {
        return autoSuggestion.suggestions
    }
    return []
}
