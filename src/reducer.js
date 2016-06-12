import { combineReducers } from 'redux'

import storage from './storage'
import canvas from './canvas'

let rootReducer = combineReducers({
    storage: storage.reducer,
    canvas: canvas.reducer,
})

export default rootReducer
