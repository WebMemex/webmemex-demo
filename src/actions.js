import canvas from './canvas'
import storage from './storage'
import { asUrl } from './utils'

// Clean the canvas and show an empty item
export function initCanvas() {
    return function(dispatch, getState) {
        // Clean canvas
        dispatch(canvas.removeAllItems())

        // Show empty item in center
        {
            let props = {x: 100, y: 100, width: 400, height: 50}
            let itemId = dispatch(canvas.createItem({docId: 'emptyItem', props}))
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
        targetDocIds.push('emptyItem')
        dispatch(canvas.centerDocWithFriends({docId, itemId, targetDocIds, sourceDocIds, animate: true}))
    }
}

export function navigateTo({itemId, userInput}) {
    return function (dispatch, getState) {
        dispatch(populateEmptyItem({itemId, userInput}))
        dispatch(drawStar({itemId}))
        dispatch(canvas.focusItem({itemId}))
    }
}

function populateEmptyItem({itemId, userInput}) {
    return function (dispatch, getState) {
        // Find or create the entered webpage/note
        let docId = dispatch(findOrCreateDoc({userInput}))
        // Show the document in the given item
        dispatch(canvas.changeDoc({itemId, docId}))
        // Link the new item to the currently centered one, if any.
        dispatch(linkToCenteredItem({docId, itemId})) // TODO rewrite: link doc to any items connected to the empty item
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

function linkToCenteredItem({docId}) {
    return function(dispatch, getState) {
        // Get currently centered item
        let centeredItem = canvas.getCenteredItem(getState().canvas)
        if (centeredItem) {
            let centeredDoc = centeredItem.docId
            let action = storage.addLink({source: centeredDoc, target: docId})
            dispatch(action)

            // TODO Edge should appear automatically when a link is added..
            // (not needed now, while linkToCenteredItem is followed by drawStar, and edge to empty item is already drawn)
            //let linkId = storage.readGeneratedId(action)
            //dispatch(canvas.showEdge({linkId, sourceItemId: centeredItemId, targetItemId: itemId}))
        }
    }
}

export function handleTap({itemId}) {
    return function (dispatch, getState) {
        // Focus on the item
        dispatch(canvas.focusItem({itemId}))

        let item = canvas.getItem(getState().canvas, itemId)
        if (item.docId === 'emptyItem')
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
        let item = canvas.getItem(getState().canvas, itemId)
        let docId = item.docId

        // Hide the item from the canvas
        dispatch(canvas.hideItem({itemId}))

        if (dir==='left' || dir==='right') { // No difference for now
            // Delete link between jettisoned doc and centered doc // TODO generalise: delete visible links
            let centeredItem = canvas.getCenteredItem(getState().canvas)
            if (centeredItem!==undefined) {
                dispatch(storage.deleteLink({
                    doc1: centeredItem.docId,
                    doc2: docId,
                }))
            }
            // Delete jettisoned doc completely if it is left unconnected
            if (!storage.hasFriends(getState().storage, docId)) {
                dispatch(storage.deleteDoc({docId}))
            }
        }
    }
}
