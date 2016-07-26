import 'babel-polyfill' // required for using generators
import { takeEvery } from 'redux-saga'
import { put } from 'redux-saga/effects'

import canvas from './canvas'
import * as actions from './actions'

// Hook our local action handlers to actions defined in modules
// (because just like reducers can handle actions, other actions should too)
const hookedActions = {
    [canvas.signalItemTapped.getType()]: actions.handleTapItem,
    [canvas.signalItemDraggedOut.getType()]: actions.handleDraggedOut,
    [canvas.signalDropOnCanvas.getType()]: actions.handleDropOnCanvas,
    [canvas.signalCanvasTapped.getType()]: actions.handleTapCanvas,
}

let sagas = []

// Create a saga for each pair of action+handler
for (let sourceAction in hookedActions) {
    let actionHandler = hookedActions[sourceAction]
    sagas.push(bindHandler(sourceAction, actionHandler))
}

// A saga that simply listens to one type of action and triggers its assigned handler.
function bindHandler(sourceAction, actionHandler) {
    return function* actionListener() {
        yield* takeEvery(sourceAction, function* (actionObject) {
            yield put(actionHandler(actionObject.payload))
        })
    }
}

export default sagas
