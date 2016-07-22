import { createReducer } from 'redux-act';

import * as actions from '../actions'

let defaultState = {
    autoCompletions: {
        // [itemId]: {suggestions: [...]},
    },
}

function setAutoCompleteSuggestions(state, {itemId, suggestions}) {
    let autoCompletions = {...state.autoCompletions, [itemId]: {suggestions}}
    return {...state, autoCompletions}
}

let reducer = createReducer(
    {
        [actions.setAutoCompleteSuggestions]: setAutoCompleteSuggestions,
    },
    defaultState
)

export default reducer
