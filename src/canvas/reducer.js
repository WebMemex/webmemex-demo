import _ from 'lodash'
import { createReducer } from 'redux-act'

import * as actions from './actions'
import { getItem, getItemIdForDocId } from './selectors'

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
    focussedItem: undefined, // itemId
    centeredItem: undefined, // itemId
}

const ITEM_MIN_WIDTH = 100
const ITEM_MIN_HEIGHT = 20

function createItem(state, {docId, reuse=true, props}) {
    let itemId = undefined
    if (reuse) {
        // If the doc is already shown in some item, take that one
        try {
            itemId = getItemIdForDocId(state, docId)
        }
        catch (err) {}
    }
    if (itemId === undefined) {
        // Generate an unused identifier for the new item
        // (a collision may have occurred if an item with docId later changed to show another doc)
        const desiredItemId = 'view_'+docId
        itemId = desiredItemId
        let i = 1
        while (itemId in state.visibleItems) {
            itemId = desiredItemId + (i++)
        }
    }
    let newItem = {
        ...props,
        docId,
    }
    let visibleItems = {...state.visibleItems, [itemId]: newItem}
    return {...state, visibleItems}
    // TODO we should return itemId.. rethink the reducer pattern?
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

function centerDocWithFriends(state, {docId, targetDocIds, sourceDocIds, animate}, {currentView}) {
    // Clean the canvas
    state = removeAllItems(state) // TODO flag as garbage, to fix reuse (and animate disappearance)

    // Create the item for the doc
    state = createItem(state, {docId, reuse: true})
    let itemId = getItemIdForDocId(state, docId)

    // Let it fill 40% of window width, fix width/height ratio to 4:3
    let width = state.windowSize.width/2.5
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

    return {...state}
}

function removeAllItems(state) {
    state = {...state, visibleItems: {}, edges: {}}
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

function showItemFriends(state, {itemId, friendDocIds, friendItemIds, side='right', animate}, {currentView}) {
    // If we were passed the docIds, show the docs and get the resulting itemIds
    if (friendItemIds === undefined) {
        friendItemIds = []
        friendDocIds.forEach((friendDocId) => {
            if (friendDocId === getItem(state, itemId).docId) return // hacky fix for self-links
            state = createItem(state, {docId: friendDocId, reuse: true})
            friendItemIds.push(getItemIdForDocId(state, friendDocId))
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
    // Hide the item
    let visibleItems = _.omit(state.visibleItems, itemId)
    // Hide edges to/from the item
    let edges = _.omitBy(
        state.edges,
        edge => (edge.sourceItemId==itemId || edge.targetItemId==itemId)
    )
    return {...state, visibleItems, edges}
}

function updateWindowSize(state, {height, width}, {currentView}) {
    // Reflect new window size in our state.
    let newWindowSize = {height, width}
    let newCanvasSize = {
        height: newWindowSize.height,
        width: newWindowSize.width,
    }
    state = {...state, windowSize: newWindowSize, canvasSize: newCanvasSize}
    // Update focussed (full-window) item, if any.
    if (state.focussedItem) { // TODO this should not be here.. how to make it implicitly reactive?
        state = focusItem(state, {itemId: state.focussedItem, animate: false}, {currentView})
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

function focusItem(state, {itemId, animate}, {currentView}) {
    if (state.focussedItem) {
        state = unfocus(state, {animate})
    }

    // Remember previous position, to restore when unfocussing
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

    let newItem = {...item, x, y, width, height, oldPosition, focussed: true, inTransition: animate}
    return {...state, visibleItems: {...state.visibleItems, [itemId]: newItem}, focussedItem: itemId}
}

function unfocus(state, {animate}) {
    let itemId = state.focussedItem
    if (itemId === undefined) {
        return state
    }
    let item = getItem(state, itemId)

    // Return to previously stored position
    let newItem = {...item, ...item.oldPosition, oldPosition:undefined,
        focussed: false, inTransition: animate}
    let visibleItems = {...state.visibleItems, [itemId]: newItem}
    return {...state, visibleItems, focussedItem: undefined}
}

export default createReducer(
    {
        [actions.createItem]: createItem,
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
        [actions.scaleItem]: scaleItem,
        [actions.focusItem]: focusItem,
        [actions.unfocus]: unfocus,
    },
    defaultState
)
