import _ from 'lodash'
import { createReducer } from 'redux-act'

import * as actions from './actions'
import { getItem } from './selectors'
import { reuseOrGenerateItemId } from './utils'

const defaultState = {
    // Some unimportant initial sizes, which are updated when loaded.
    // TODO can we remove canvas and/or window size from state?
    canvasSize: {
        width: 800,
        height: 600,
    },
    windowSize: {
        width: 800,
        height: 600,
    },
    // No items or edges yet.
    visibleItems: {
        // [itemId]: {docId, x, y, width, height}
    },
    edges: {
        // [edgeId]: {linkId, sourceItemId, targetItemId}
    },
    expandedItem: undefined, // itemId
    centeredItem: undefined, // itemId
    focussedItem: undefined, // itemId
}

const ITEM_MIN_WIDTH = 100
const ITEM_MIN_HEIGHT = 20

// Note: this function is almost like a reducer, but it also returns a value.
// It is equivalent to actions.createItem, but for usage within other reducers.
function createItem(state, {docId, props}) {
    let itemId = reuseOrGenerateItemId(state, {docId})
    state = createItemWithId(state, {itemId, docId, props})
    return {state, itemId}
}

function createItemWithId(state, {itemId, docId, props}) {
    let newItem = {
        ...props,
        docId,
        flaggedForRemoval: undefined,
    }
    let visibleItems = {...state.visibleItems, [itemId]: newItem}
    return {...state, visibleItems}
}

function changeDoc(state, {itemId, docId}) {
    let item = getItem(state, itemId)
    item = {...item, docId}
    state = {...state, visibleItems: {...state.visibleItems, [itemId]: item}}
    return state
}

function centerItem(state, {itemId, animate}, {currentView}) {
    let winWidth = state.windowSize.width
    let winHeight = state.windowSize.height

    let item = getItem(state, itemId)
    let x = currentView.scrollX + winWidth/2 - item.width/2
    let y = currentView.scrollY + winHeight/2 - item.height/2
    let newItem = {...item, x, y, inTransition: animate, centered: true}

    let visibleItems = {...state.visibleItems, [itemId]: newItem}
    return {...state, visibleItems, centeredItem: itemId}
}

function centerDocWithFriends(state, {docId, itemId, targetDocIds, sourceDocIds, animate}, {currentView}) {
    // Flag all items, so items not reused will be removed further below.
    state = flagAllItemsForRemoval(state)
    // Do not keep old edges, remove them.
    state = {...state, edges: {}}
    if (itemId !== undefined) {
        // Caller specified which item should be in the center. Prevent removal.
        let item = getItem(state, itemId)
        item = {...item, flaggedForRemoval: undefined}
        let visibleItems = {...state.visibleItems, [itemId]: item}
        state = {...state, visibleItems}
    }
    else {
        // No item was passed, create a new item for the doc
        let {state: newState, itemId: newItemId} = createItem(state, {docId})
        state = newState
        itemId = newItemId
    }

    // Let it fill 1/3 of window width, fix width/height ratio to 4:3
    let width = state.windowSize.width/3
    let height = width*3/4
    state = resizeItem(state, {itemId, width, height, animate})

    // Center it
    state = centerItem(state, {itemId, animate}, {currentView})

    // Show its friends (linked items) left and right of it
    state = showItemFriends(state, {
        itemId,
        friendDocIds: targetDocIds,
        side: 'right',
        animate,
    }, {currentView})
    state = showItemFriends(state, {
        itemId,
        friendDocIds: sourceDocIds,
        side: 'left',
        animate,
    }, {currentView})

    // Remove the items that have not been reused.
    state = removeFlaggedItems(state)

    return {...state}
}

function flagAllItemsForRemoval(state) {
    let visibleItems = _.mapValues(state.visibleItems,
                                   item => ({...item, flaggedForRemoval: true}))
    state = {...state, visibleItems}
    return state
}

function removeFlaggedItems(state) {
    let flaggedItems = _.pickBy(state.visibleItems,
                                item => item.flaggedForRemoval)
    _.forOwn(flaggedItems, (item, itemId) => {
        state = hideItem(state, {itemId})
    })
    return state
}

function removeAllItems(state) {
    state = {...state,
        visibleItems: {},
        edges: {},
        expandedItem: undefined,
        centeredItem: undefined,
        focussedItem: undefined,
    }
    return state
}

function pruneEdges(state) {
    // Remove edges to or from non-existing items
    let visibleItems = state.visibleItems
    let edges = _.pickBy(
        state.edges,
        edge => (  edge.sourceItemId in visibleItems
                && edge.targetItemId in visibleItems)
    )
    return {...state, edges}
}

function showItemFriends(state, {itemId, friendDocIds, friendItemIds, side='right', animate}) {
    // If we were passed the docIds, show the docs and get the resulting itemIds
    if (friendItemIds === undefined) {
        friendItemIds = []
        friendDocIds.forEach((friendDocId) => {
            let {state: newState, itemId: friendItemId} = createItem(state, {docId: friendDocId})
            state = newState
            friendItemIds.push(friendItemId)
        })
    }

    // Position the friends besides the given item
    let newItems = {}
    let item = getItem(state, itemId)
    let nFriends = friendItemIds.length
    friendItemIds.forEach((friendItemId, index) => {
        let friendItem = getItem(state, friendItemId)
        // Spacing between friends and item (and between other friends)
        let width = item.width/2
        // Default to 3/4 ratio for now. Squeeze the items if there are too many.
        let height = Math.min(width*3/4, item.height/nFriends) // Note: ignores marginY
        let marginX = width/4
        let marginY = height/4
        // Put the friends in a column either right or left of the item
        let x = item.x + ((side == 'left') ? -(width+marginX) : item.width+marginX)
        // Create a column, symmetrically up and down from the item's midline
        let y = item.y + item.height/2 - height/2 + (index - (nFriends-1)/2) * (height + marginY)
        let newItem = {
            ...friendItem,
            x,
            y,
            width,
            height,
            inTransition: animate,
        }
        newItems[friendItemId] = newItem
    })

    let newEdges = {} // TODO edges should know their linkId, and be drawn automatically?
    for (let newItemId in newItems) {
        newEdges[itemId+newItemId] = {sourceItemId: itemId, targetItemId: newItemId}
    }

    let visibleItems = {...state.visibleItems, ...newItems}
    let edges = {...state.edges, ...newEdges}
    return {...state, visibleItems, edges}
}


function hideEdge(state, {edgeId}) {
    let edges = _.omit(state.edges, edgeId)
    return {...state, edges}
}

function showEdge(state, {linkId, sourceItemId, targetItemId}) {
    let edgeId = 'edge_'+linkId
    return {...state, edges: {...state.edges, [edgeId]: {linkId, sourceItemId, targetItemId}}}
}

function hideItem(state, {itemId}) {
    // Make shallow copy of state
    state = {...state}

    // Hide the item
    state.visibleItems = _.omit(state.visibleItems, itemId)

    // Clean up state
    if (state.centeredItem === itemId)
        state.centeredItem = undefined
    if (state.expandedItem === itemId)
        state.expandedItem = undefined
    if (state.focussedItem === itemId)
        state.focussedItem = undefined

    // Hide edges to/from the item
    state.edges = _.omitBy(
        state.edges,
        edge => (edge.sourceItemId===itemId || edge.targetItemId===itemId)
    )

    return state
}

function updateWindowSize(state, {height, width}, {currentView}) {
    // Reflect new window size in our state.
    let newWindowSize = {height, width}
    let newCanvasSize = {
        height: newWindowSize.height,
        width: newWindowSize.width,
    }
    state = {...state, windowSize: newWindowSize, canvasSize: newCanvasSize}
    // Update expanded item, if any.
    if (state.expandedItem) { // TODO this should not be here.. how to make it implicitly reactive?
        state = expandItem(state, {itemId: state.expandedItem, animate: false}, {currentView})
    }
    return state
}

function relocateItem(state, {itemId, x, y, dx, dy, animate}) {
    let item = getItem(state, itemId)
    if (x===undefined)
        x = item.x + dx
    if (y===undefined)
        y = item.y + dy
    let newItem = {...item, x, y, inTransition: animate}
    return {...state, visibleItems: {...state.visibleItems, [itemId]: newItem}}
}

function resizeItem(state, {itemId, width, height, dwidth, dheight, animate}) {
    // Resize to given width&height, or adjust size with dwidth&dheight
    let item = getItem(state, itemId)

    if (width===undefined)
        width = Math.max(item.width + dwidth, ITEM_MIN_WIDTH)
    if (height===undefined)
        height = Math.max(item.height + dheight, ITEM_MIN_HEIGHT)
    let newItem = {...item, width, height, inTransition: animate}
    return {...state, visibleItems: {...state.visibleItems, [itemId]: newItem}}
}

function setItemRatio(state, {itemId, ratio, keepFixed, animate}) {
    let item = getItem(state, itemId)
    let width = item.width
    let height = item.height
    if (keepFixed===undefined) {
        // Keep surface area constant
        let area = item.width * item.height
        width = Math.sqrt(area * ratio)
        height = width / ratio
    }
    else if (keepFixed==='height') {
        width = item.height * ratio
    }
    else if (keepFixed==='width') {
        height = item.width / ratio
    }

    return resizeItem(state, {itemId, width, height, animate})
}

function scaleItem(state, {itemId, dscale, origin, animate}) {
    let item = getItem(state, itemId)
    let oldWidth = item.width
    let oldHeight = item.height
    let newWidth = oldWidth * (1+dscale)
    let newHeight = oldHeight * (1+dscale)

    // Limit size to something arbitrary but reasonable
    let maxWidth = state.canvasSize.width
    let maxHeight = state.canvasSize.height
    if (   newWidth  < ITEM_MIN_WIDTH && oldWidth > ITEM_MIN_WIDTH
        || newHeight < ITEM_MIN_HEIGHT && oldHeight > ITEM_MIN_HEIGHT
        || newWidth > maxWidth && oldWidth < maxWidth
        || newHeight > maxHeight && oldHeight < maxHeight)
        return state

    // Move the item to keep the specified origin point at the same spot.
    // (item-relative, so giving origin={x:0, y:0} pins the top-left corner)
    let {x, y} = origin
    let maxX = state.canvasSize.width - newWidth
    let maxY = state.canvasSize.height - newHeight
    let newX = Math.min(Math.max(item.x - x*dscale, 0), maxX)
    let newY = Math.min(Math.max(item.y - y*dscale, 0), maxY)

    let newItem = {...item, width: newWidth, height: newHeight, x: newX, y: newY, inTransition: animate}
    return {...state, visibleItems: {...state.visibleItems, [itemId]: newItem}}
}

function expandItem(state, {itemId, animate}, {currentView}) {
    if (state.expandedItem) {
        state = unexpand(state, {animate})
    }

    // Remember previous position, to restore when unexpanding
    let item = getItem(state, itemId)
    let oldPosition = {
        width: item.width,
        height: item.height,
        x: item.x,
        y: item.y,
    }

    // Fill most of the window
    let maxWidth = state.windowSize.width
    let maxHeight = state.windowSize.height
    let width = 0.95 * maxWidth
    let height = 0.95 * maxHeight

    // Put it in currently viewed area (in case canvas is bigger than window)
    let {scrollX, scrollY} = currentView
    let x = scrollX + state.windowSize.width/2 - width/2
    let y = scrollY + state.windowSize.height/2 - height/2

    let newItem = {...item, x, y, width, height, oldPosition, expanded: true, inTransition: animate}
    return {...state, visibleItems: {...state.visibleItems, [itemId]: newItem}, expandedItem: itemId}
}

function unexpand(state, {animate}) {
    let itemId = state.expandedItem
    if (itemId === undefined) {
        return state
    }
    let item = getItem(state, itemId)

    // Return to previously stored position
    let newItem = {...item, ...item.oldPosition, oldPosition:undefined,
        expanded: false, inTransition: animate}
    let visibleItems = {...state.visibleItems, [itemId]: newItem}
    return {...state, visibleItems, expandedItem: undefined}
}

function setItemDragged(state, {itemId, value}) {
    let item = getItem(state, itemId)
    let newItem = {...item, beingDragged: value}
    let visibleItems = {...state.visibleItems, [itemId]: newItem}
    return {...state, visibleItems}
}

function focusItem(state, {itemId}) {
    return {...state, focussedItem: itemId}
}

function unfocus(state, {itemId}) {
    if (itemId === undefined || state.focussedItem === itemId) {
        state = {...state, focussedItem: undefined}
    }
    return state
}

function setProps(state, {itemId, props}) {
    let item = getItem(state, itemId)
    let newItem = {...item, ...props}
    let visibleItems = {...state.visibleItems, [itemId]: newItem}
    return {...state, visibleItems}
}


export default createReducer(
    {
        [actions.createItemWithId]: createItemWithId,
        [actions.changeDoc]: changeDoc,
        [actions.centerItem]: centerItem,
        [actions.centerDocWithFriends]: centerDocWithFriends,
        [actions.removeAllItems]: removeAllItems,
        [actions.showItemFriends]: showItemFriends,
        [actions.hideEdge]: hideEdge,
        [actions.showEdge]: showEdge,
        [actions.hideItem]: hideItem,
        [actions.updateWindowSize]: updateWindowSize,
        [actions.relocateItem]: relocateItem,
        [actions.resizeItem]: resizeItem,
        [actions.setItemRatio]: setItemRatio,
        [actions.scaleItem]: scaleItem,
        [actions.expandItem]: expandItem,
        [actions.unexpand]: unexpand,
        [actions.focusItem]: focusItem,
        [actions.unfocus]: unfocus,
        [actions.setProps]: setProps,
        [actions.setItemDragged]: setItemDragged,
    },
    defaultState
)
