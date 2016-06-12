import 'babel-polyfill' // required for using generators
import { takeEvery } from 'redux-saga'
import { put } from 'redux-saga/effects'

import canvas from './canvas'
import { handleTap } from './actions'

// Hook our local action handlers to actions defined in modules
// (because just like reducers can handle actions, other actions should too)
const hookedActions = {
    [canvas.signalItemTapped.getType()]: handleTap,
}

// A saga that simply listens and triggers the action pairs defined above.
export function* actionListener() {
    for (let sourceAction in hookedActions) {
        let actionHandler = hookedActions[sourceAction]
        yield* takeEvery(sourceAction, function* (actionObject) {
            yield put(actionHandler(actionObject.payload))
        })
    }
}
