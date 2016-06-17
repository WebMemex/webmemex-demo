import reducer from './reducer'
export { reducer }
import * as actions from './actions'
export { actions }
import * as selectors from './selectors'
export { selectors }

export default { reducer, ...actions, ...selectors}
