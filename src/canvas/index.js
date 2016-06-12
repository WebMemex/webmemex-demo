import Canvas from './components/Canvas'
export { Canvas }
import reducer from './reducer'
export { reducer }
import * as actions from './actions'
export { actions }
import * as selectors from './selectors'
export { selectors }

export default { Canvas, reducer, ...actions, ...selectors }
