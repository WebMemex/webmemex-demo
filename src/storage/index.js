import reducer from './reducer'
export { reducer }
import * as actions from './actions'
export { actions }
import * as selectors from './selectors'
export { selectors }

// A helper to read a value from an action.. should we just use thunks instead?
function readGeneratedId(action) {
    return (action.meta.docId || action.meta.linkId)
}

export default { reducer, ...actions, ...selectors, readGeneratedId }
