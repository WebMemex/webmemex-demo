export function getAutoCompleteSuggestions(state, itemId) {
    let autoCompletion = state.volatile.autoCompletions[itemId]
    if (autoCompletion) {
        return autoCompletion.suggestions
    }
    return []
}
