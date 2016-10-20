import { createAction } from 'redux-act'

import canvas from './canvas'
import storage from './storage'
import { getEmptyItemState } from './selectors'
import { asUrl, textToHtml } from './utils'

// Clean the canvas and show an empty item
export function initCanvas() {
    return function(dispatch, getState) {
        // Clean canvas
        dispatch(canvas.removeAllItems())

        // Show empty item in center
        {
            let props = {x: 100, y: 100, width: 400, height: 50}
            let itemId = dispatch(canvas.createItem({docId: 'emptyItem_alone', props}))
            dispatch(setEmptyItemState({itemId, props: {}}))
            dispatch(canvas.centerItem({itemId}))
            dispatch(canvas.focusItem({itemId}))
        }

    }
}

// Put a doc in the center of view, with its linked docs around it.
// Accepts either a docId or ItemId.
export function drawStar({docId, itemId}) {
    return function (dispatch, getState) {
        let state = getState()
        if (docId === undefined) {
            docId = canvas.getItem(state.canvas, itemId).docId
        }
        let {targetDocIds, sourceDocIds} = storage.getFriends(state.storage, docId)
        sourceDocIds.push('emptyItem_linkfrom')
        targetDocIds.push('emptyItem_linkto')
        dispatch(canvas.centerDocWithFriends({docId, itemId, targetDocIds, sourceDocIds, animate: true}))

        // Show second level friends
        targetDocIds.forEach(docId => {
            let itemId = canvas.getItemIdForDocId(getState().canvas, docId)
            let {targetDocIds, sourceDocIds} = storage.getFriends(getState().storage, docId)
            dispatch(canvas.showItemFriends({itemId, friendDocIds: targetDocIds, side: 'right', animate:true}))
        })
        sourceDocIds.forEach(docId => {
            let itemId = canvas.getItemIdForDocId(getState().canvas, docId)
            let {targetDocIds, sourceDocIds} = storage.getFriends(getState().storage, docId)
            dispatch(canvas.showItemFriends({itemId, friendDocIds: sourceDocIds, side: 'left', animate:true}))
        })
    }
}

export function navigateFromLink({url}) {
    return function (dispatch, getState) {
        let docId = dispatch(storage.findOrAddUrl({url}))
        let width = 200
        let height = 150
        let props = {x: 10, y: 10, width, height}
        let itemId = dispatch(canvas.createItem({docId, props}))
        let expandedItem = getState().canvas.expandedItem
        if (expandedItem) {
            let expandedDocId = canvas.getItem(getState().canvas, expandedItem).docId
            dispatch(canvas.unexpand({animate: true}))
            dispatch(storage.findOrAddLink({
                source: expandedDocId,
                target: docId,
            }))
        }
        dispatch(drawStar({itemId}))
        if (expandedItem) {
            // Appear to move in from the right side
            dispatch(canvas.centerItem({itemId, xPosition: 0.8}))
            // Set end location at center (only relevant when unexpanding later)
            dispatch(canvas.centerItem({itemId, animate: true}))
            // Expand to fill whole canvas
            dispatch(canvas.expandItem({itemId, animate: true}))
        }
        dispatch(canvas.focusItem({itemId}))

    }
}

// Pass either docId or userInput
export function navigateTo({itemId, docId, userInput}) {
    return function (dispatch, getState) {
        dispatch(populateEmptyItem({itemId, docId, userInput}))
        if (canvas.getItem(getState().canvas, itemId).centered)
            dispatch(drawStar({itemId}))
        else {
            dispatch(canvas.setItemRatio({itemId, ratio: 4/3, keepFixed: 'width', animate: true}))
        }
        dispatch(canvas.focusItem({itemId}))
    }
}

function populateEmptyItem({itemId, docId, userInput}) {
    return function (dispatch, getState) {
        if (docId===undefined) {
            // Find or create the entered webpage/note
            docId = dispatch(findOrCreateDoc({userInput}))
        }
        // Show the document in the given item
        dispatch(canvas.changeDoc({itemId, docId}))
        // Link the new doc to any items it has edges to
        dispatch(linkToConnectedItems({itemId, docId}))
        // Center the new doc
        dispatch(drawStar({itemId}))
    }
}

function findOrCreateDoc({userInput}) {
    return function (dispatch, getState) {
        let docId
        // If it looks like a URL, we treat it like one.
        let url = asUrl(userInput)
        if (url) {
            docId = dispatch(storage.findOrAddUrl({url}))
        }
        else {
            // Search if we have the text as a note/tag
            docId = storage.getDocWithText(getState().storage, userInput)
            // If not, create a new note
            if (!docId) {
                let action = storage.addNote({text: userInput})
                dispatch(action)
                docId = storage.readGeneratedId(action)
            }
        }
        return docId
    }
}

function linkToConnectedItems({itemId, docId}) {
    return function(dispatch, getState) {
        let connectedItemIds = canvas.getConnectedItemIds(getState().canvas, itemId)
        connectedItemIds.forEach(connectedItemId => {
            let item = canvas.getItem(getState().canvas, itemId)
            let connectedItem = canvas.getItem(getState().canvas, connectedItemId)

            // Determine which is item is left and which right
            let docIsLeft = (item.x+item.width/2) < (connectedItem.x+connectedItem.width/2)

            // Create the link
            dispatch(storage.findOrAddLink({
                source: docIsLeft ? docId : connectedItem.docId,
                target: docIsLeft ? connectedItem.docId : docId,
            }))
        })
    }
}

export function openInNewTab({itemId, docId}) {
    return function (dispatch, getState) {
        let state = getState()
        if (docId===undefined) {
            docId = canvas.getItem(state.canvas, itemId).docId
        }
        let doc = storage.getDoc(state.storage, docId)
        if (doc.url) {
            window.open(doc.url, '_blank')
        }
    }
}

export function handleDropOnCanvas({x, y, event}) {
    return function (dispatch, getState) {
        let html = event.dataTransfer.getData('text/html')
        let text = event.dataTransfer.getData('text')
        let url = event.dataTransfer.getData('URL') || asUrl(text)
        let docId
        if (url) {
            docId = dispatch(storage.findOrAddUrl({url}))
        }
        else if (html) {
            html = html.replace(String.fromCharCode(0), '') // work around some bug/feature(?) of Chromium
            docId = dispatch(storage.findOrAddNote({text: html}))
        }
        else if (text) {
            let html = textToHtml(text)
            docId = dispatch(storage.findOrAddNote({text: html}))
        }
        if (docId) {
            let width = 200
            let height = 150
            let props = {x: x-width/2, y: y-height/2, width, height}
            let itemId = dispatch(canvas.createItem({docId, props}))
        }
    }
}

export function handleTapCanvas({x, y}) {
    return function (dispatch, getState) {
    }
}

export function handleTapItem({itemId, event}) {
    return function (dispatch, getState) {
        if (event.shiftKey) {
            dispatch(disconnectAndRemoveItem({itemId}))
            return
        }
        if (event.ctrlKey) {
            dispatch(openInNewTab({itemId}))
            return
        }
        // Focus on the item
        dispatch(canvas.focusItem({itemId}))

        let item = canvas.getItem(getState().canvas, itemId)
        if (item.docId.startsWith('emptyItem'))
            return
        if (item.centered) {
            // Only expand iframe items (TODO make simple type test)
            if (storage.getDoc(getState().storage, item.docId).url)
                dispatch(canvas.expandItem({itemId, animate: true}))
        }
        else {
            dispatch(drawStar({itemId}))
        }
    }
}

export function handleDraggedOut({itemId, dir}) {
    return function (dispatch, getState) {
        if (dir==='left' || dir==='right') { // No difference for now
            dispatch(disconnectAndRemoveItem({itemId}))
        }

    }
}

export function disconnectAndRemoveItem({itemId}) {
    return function (dispatch, getState) {
        let item = canvas.getItem(getState().canvas, itemId)
        let docId = item.docId

        // Remove the item's _visible_ links from storage
        let connectedItemIds = canvas.getConnectedItemIds(getState().canvas, itemId)
        connectedItemIds.forEach(connectedItemId => {
            let connectedDocId = canvas.getItem(getState().canvas, connectedItemId).docId
            dispatch(storage.deleteLink({
                doc1: connectedDocId,
                doc2: docId,
            }))
        })

        // Hide the item from the canvas
        dispatch(canvas.hideItem({itemId}))

        // Delete jettisoned doc completely if it is left unconnected
        if (!storage.hasFriends(getState().storage, docId)) {
            dispatch(storage.deleteDoc({docId}))
        }
    }
}

export function updateAutoSuggest({itemId}) {
    return function(dispatch, getState) {
        // Tell UI to show suggestions for the current input
        dispatch(updateEmptyItemSuggestions({itemId}))
        // Let store search for suggestions
        let inputValue = getEmptyItemState(getState(), itemId).inputValue
        let suggestions = storage.autoSuggestSearch(getState().storage, {inputValue})
        // Update list of suggestions for this user input
        dispatch(setAutoSuggestSuggestions({inputValue, suggestions}))
    }
}

export let setAutoSuggestSuggestions = createAction()
export let setEmptyItemState = createAction()
export let updateEmptyItemSuggestions = createAction()

export function handleReceivedDrop({itemId, droppedItemId}) {
    return function (dispatch, getState) {
        let item = canvas.getItem(getState().canvas, itemId)
        let droppedItem = canvas.getItem(getState().canvas, droppedItemId)

        // Create link in storage
        let linkId = dispatch(storage.findOrAddLink({
            source: item.docId,
            target: droppedItem.docId,
        }))

        // Display edge
        dispatch(canvas.showEdge({
            linkId,
            sourceItemId: itemId,
            targetItemId: droppedItemId
        }))
    }
}
