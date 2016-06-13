import canvas from './canvas'
import storage from './storage'
import { asUrl } from './utils'

// Clean the canvas and show an empty item
export function initCanvas() {
    return function(dispatch, getState) {
        dispatch(canvas.removeAllItems())
        let props = {x:100, y:100, width: 400, height: 50}
        dispatch(canvas.createItem({docId: 'addUrlForm', props}))
        let itemId = canvas.getItemIdForDocId(getState().canvas, 'addUrlForm')
        dispatch(canvas.centerItem({itemId}))
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
        targetDocIds.push('addUrlForm')
        dispatch(canvas.centerDocWithFriends({docId, targetDocIds, sourceDocIds, animate: true}))
    }
}

export function navigateTo({itemId, userInput}) {
    return function (dispatch, getState) {
        dispatch(populateEmptyItem({itemId, userInput}))
        dispatch(drawStar({itemId}))
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
            // Search if we have it already
            docId = storage.getDocWithUrl(getState().storage, url)
            // If not, create a new document
            if (!docId) {
                let action = storage.addUrl({url})
                dispatch(action)
                docId = storage.readGeneratedId(action)
            }
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
        let item = canvas.getItem(getState().canvas, itemId)
        if (item.docId === 'addUrlForm')
            return
        if (item.centered) {
            dispatch(canvas.focusItem({itemId, animate: true}))
        }
        else {
            dispatch(drawStar({docId: item.docId}))
        }
    }
}
