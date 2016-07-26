import { createAction } from 'redux-act'
import { createActionWithMetaArgs } from '../utils'

import { reuseOrGenerateItemId } from './utils'

// Actions processed by the canvas reducer

export let createItem = function ({docId, props}) {
    // We use a thunk here rather than putting this logic in the reducer, solely
    // to be able to return the chosen itemId to the caller. TODO fix Redux..?
    return function(dispatch, getState) {
        let state = getState().canvas  // XXX non-modular: We'd want to get state.canvas from getState().
        let itemId = reuseOrGenerateItemId(state, {docId})
        dispatch(createItemWithId({itemId, docId, props}))
        return itemId
    }
}

export let createItemWithId = createAction()
export let changeDoc = createAction()
export let centerItem = createActionWithMetaArgs({
    currentView: getCurrentView,
})
export let centerDocWithFriends = createActionWithMetaArgs({
    currentView: getCurrentView,
})
export let removeAllItems = createAction()
export let showItemFriends = createAction()
export let hideEdge = createAction()
export let showEdge = createAction()
export let hideItem = createAction()
export let updateWindowSize = createActionWithMetaArgs({
    currentView: getCurrentView,
})
export let relocateItem = createAction()
export let resizeItem = createAction()
export let setItemRatio = createAction()
export let scaleItem = createAction()
export let expandItem = createActionWithMetaArgs({
    currentView: getCurrentView,
})
export let unexpand = createAction()
export let setItemDragged = createAction()
export let focusItem = createAction()
export let unfocusItem = createAction()
export let unfocus = createAction()

// Actions not listened to by the canvas module itself

export let signalItemTapped = createAction()
export let signalItemDraggedOut = createAction()
export let signalDropOnCanvas = createAction()
export let signalCanvasTapped = createAction()

// Utils

function getCurrentView() {
    return {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
    }
}
