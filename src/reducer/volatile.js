import { createReducer } from 'redux-act';

import * as actions from '../actions'

let defaultState = {
    emptyItems: {
        // [itemId]: {inputValue, inputValueForSuggestions}
    },
    autoSuggestions: {
        // [inputValue]: {suggestions: [...]},
    },
}

// Notes on our auto-suggest implementation:
// Browsing through suggestions updates inputValue, so we remember the last
// 'manually entered' input value in inputValueForSuggestions. We then look up
// this value in state.autoSuggestions, which acts as a cache for search results.

function setEmptyItemState(state, {itemId, props}) {
    let item = {...state.emptyItems[itemId], ...props}
    let emptyItems = {...state.emptyItems, [itemId]: item}
    return {...state, emptyItems}
}

function updateEmptyItemSuggestions(state, {itemId}) {
    let item = state.emptyItems[itemId]

    item.inputValueForSuggestions = item.inputValue

    let emptyItems = {...state.emptyItems, [itemId]: item}
    return {...state, emptyItems}
}

function setAutoSuggestSuggestions(state, {itemId, inputValue, suggestions}) {
    let autoSuggestions = {...state.autoSuggestions, [inputValue]: {suggestions}}
    return {...state, autoSuggestions}
}

let reducer = createReducer(
    {
        [actions.setAutoSuggestSuggestions]: setAutoSuggestSuggestions,
        [actions.setEmptyItemState]: setEmptyItemState,
        [actions.updateEmptyItemSuggestions]: updateEmptyItemSuggestions,
    },
    defaultState
)

export default reducer
