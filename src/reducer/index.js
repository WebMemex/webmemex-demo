import { combineReducers } from 'redux'

import storage from '../storage'
import canvas from '../canvas'
import volatileReducer from './volatile'

let rootReducer = combineReducers({
    storage: storage.reducer,
    canvas: canvas.reducer,
    volatile: volatileReducer,
})

export default rootReducer
