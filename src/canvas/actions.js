import { createAction } from 'redux-act'
import { createActionWithMetaArgs } from '../utils'

// Actions processed by the canvas reducer

export let createItem = createAction()
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
export let scaleItem = createAction()
export let focusItem = createActionWithMetaArgs({
    currentView: getCurrentView,
})
export let unfocus = createAction()

// Actions not listened to by the canvas module itself

export let signalItemTapped = createAction()

// Utils

function getCurrentView() {
    return {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
    }
}
