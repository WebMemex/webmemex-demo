import _ from 'lodash'
import { createAction } from 'redux-act'
import ReduxQuerySync from 'redux-query-sync'

import canvas from './canvas'
import storage from './storage'
import { getEmptyItemState } from './selectors'
import { asUrl, textToHtml } from './utils'

// Clean the canvas and show an empty item
export function initCanvas() {
    return function(dispatch, getState) {
        // Only run when canvas is still empty (to ignore second, fallback invocation - see main.jsx)
        if (!_.isEmpty(getState().canvas.visibleItems))
            return

        // Add and show welcome message + friends for demo purposes.
        {
            // Add some notes, pages and links
            {
                const welcomeMessage = (
                    'Hi! This is a read/write web browser. '
                    + 'It lets you <i>create</i> notes and links, to organise the web your way. '
                    + 'Watch the video linked to this note, or just try it out!'
                    + '<br/><br/>'
                    + 'Try enter a URL in the bar above to load a webpage, '
                    + 'or enter text to create a note. '
                    + 'Or use it to find back any of your pages&amp;notes.'
                    + '<br/><br/>'
                    + 'To add links to an item, use the input boxes besides it. '
                    + 'Also, try following a normal link inside a web page: it is added automatically!'
                )

                const usageNotes = (
                    '<u>Usage notes</u><br/>'
                    + '- Try browsing blogs, Wikipedia, etcetera; interactive sites/webapps may sputter.<br/>'
                    + '- Your notes and links are stored in your browser\'s local storage. Do not trust it to persist forever.<br/>'
                    + '- Ctrl/Cmd+tap/click opens a webpage in a new tab.<br/>'
                    + '- Ctrl+Shift+tap/click deletes an item or link.<br/>'
                    + '- Try drag some text, image or url onto the canvas to add it. Also works nicely for quotes selected from webpages!<br/>'
                )

                const aboutNote = (
                    '<u>More about this project</u><br/>'
                    + 'Have a look at the items linked to this note to read/watch the ideas behind it, and to find the source code of this demo.'
                    + '<br/><br/>'
                    + 'This particular experiment (a "browser in a browser") is no longer developed, '
                    + 'but the next incarnation of the idea is in full progress!'
                )

                // Store as notes, specifying docId to overwrite any older ones.
                dispatch(storage.addNote({docId: 'welcomeMessage', text: welcomeMessage}))
                dispatch(storage.addNote({docId: 'usageNotes', 'text': usageNotes}))
                dispatch(storage.addNote({docId: 'aboutNote', 'text': aboutNote}))

                const demoDocs = {
                    'demoDoc_rwweb': 'https://web.archive.org/web/20160303135717id_/http://read-write-web.org/',
                    'demoDoc_www': 'https://www.w3.org/People/Berners-Lee/WorldWideWeb.html',
                    'demoDoc_proposal': 'https://www.w3.org/History/1989/proposal.html',
                    'demoDoc_aswemaythink': 'http://www.theatlantic.com/magazine/archive/1945/07/as-we-may-think/303881/',
                    'demoDoc_iannotatetalk': 'https://www.youtube.com/embed/vKzYmDUydTw',
                    'demoDoc_webmemexsource': 'https://github.com/WebMemex/webmemex-demo',
                    'demoDoc_screencast': 'http://demo.webmemex.org/assets/demovideo.html',
                    'demoDoc_webmemex': 'https://webmemex.org',
                }

                const demoLinks = [
                    {source: 'welcomeMessage', target: 'demoDoc_screencast'},
                    {source: 'welcomeMessage', target: 'usageNotes'},
                    {source: 'welcomeMessage', target: 'aboutNote'},
                    {source: 'aboutNote', target: 'demoDoc_rwweb'},
                    {source: 'demoDoc_rwweb', target: 'demoDoc_www'},
                    {source: 'demoDoc_rwweb', target: 'demoDoc_proposal'},
                    {source: 'demoDoc_rwweb', target: 'demoDoc_aswemaythink'},
                    {source: 'aboutNote', target: 'demoDoc_iannotatetalk'},
                    {source: 'aboutNote', target: 'demoDoc_webmemexsource'},
                    {source: 'aboutNote', target: 'demoDoc_webmemex'},
                ]

                _.forEach(demoDocs, (url, docId) => {
                    dispatch(storage.addUrl({url, docId}))
                })
                _.forEach(demoLinks, link => {
                    dispatch(storage.addLink({
                        linkId: `demoLink_${link.source}_${link.target}`,
                        ...link,
                    }))
                })
            }

            // Keep centered item in sync with URL query parameter.
            const getCurrentDocId = state => {
                const currentItem = canvas.getCenteredItem(state.canvas)
                return currentItem ? currentItem.docId : undefined
            }
            ReduxQuerySync({
                store: window.store, // XXX Using a global variable to access redux store. How to do this instead?
                initialTruth: 'location',
                params: {
                    page: {
                        selector: getCurrentDocId,
                        action: docId => showDocIfExists({docId}),
                    },
                }
            })

            // If no page was requested, show the welcome message.
            if (!canvas.getCenteredItem(getState().canvas)) {
                dispatch(drawStar({docId: 'welcomeMessage'}))
            }
        }

    }
}

function showDocIfExists({docId}) {
    return function (dispatch, getState) {
        try {
            storage.getDoc(getState().storage, docId)
        } catch (err) {
            return
        }
        dispatch(drawStar({docId}))
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

        // Add input entries for linking items
        targetDocIds.push('emptyItem_linkto')
        sourceDocIds.push('emptyItem_linkfrom')


        // Show second level friends
        const targetsTargets = {}
        targetDocIds.forEach(docId => {
            targetsTargets[docId] = storage.getFriends(getState().storage, docId).targetDocIds
        })
        const sourcesSources = {}
        sourceDocIds.forEach(docId => {
            sourcesSources[docId] = storage.getFriends(getState().storage, docId).sourceDocIds
        })

        dispatch(canvas.centerDocWithFriends({
            docId, itemId, targetDocIds, sourceDocIds,
            targetsTargets, sourcesSources, animate: true
        }))


        {
            let props = {x: 10, y: 10, width: 400, height: 55}
            let itemId3 = dispatch(canvas.createItem({docId: 'emptyItem_alone', props}))
            dispatch(canvas.relocateItem({itemId: itemId3, xRelative: 0.5, yRelative: 0.05}))
        }
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
                type: 'followed',
            }))
        }
        dispatch(drawStar({itemId}))
        if (expandedItem) {
            // Appear to move in from the right side
            dispatch(canvas.relocateItem({itemId, xRelative: 0.8, yRelative: 0.5}))
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
        let centeredItem = getState().canvas.centeredItem
        let emptyItem = canvas.getItem(getState().canvas, itemId)
        dispatch(populateEmptyItem({itemId, docId, userInput}))
        if (centeredItem===itemId) {
            // This empty was the centered item, draw its star around it
            dispatch(drawStar({itemId}))
        }
        else {
            dispatch(canvas.setItemRatio({itemId, ratio: 4/3, keepFixed: 'width', animate: true}))
            if (centeredItem &&
                (emptyItem.docId==='emptyItem_linkto' || emptyItem.docId==='emptyItem_linkfrom')
            ) {
                // Redraw the star to move the new item to the correct place,
                // and pop up a new empty item.
                dispatch(drawStar({itemId: centeredItem}))
            }
            else {
                // This item becomes the new centered item
                dispatch(drawStar({itemId}))
            }
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
            docId = dispatch(storage.findOrAddNote({text: userInput}))
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
                type: 'manual',
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
            // Quick fix for removing proxy prefix from links and images dragged from our own iframes
            url = url.replace(new RegExp(`^(https?:)?\/\/${window.location.host}\/[a-z-]+\/(im_\/)?`), '')
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
            let centeredItemId = getState().canvas.centeredItem
            if (centeredItemId) {
                let onLeftHalf = x < getState().canvas.windowSize.width/2
                let sourceItemId = onLeftHalf ? itemId : centeredItemId
                let targetItemId = onLeftHalf ? centeredItemId : itemId
                dispatch(connectItems({sourceItemId, targetItemId}))
                setTimeout(()=>{
                    // Give user a moment to click the dropped item; if they do not,
                    // move it to its place in the star (but keep any expanded item expanded).
                    if (getState().canvas.centeredItem === centeredItemId) {
                        let expandedItem = getState().canvas.expandedItem
                        dispatch(drawStar({itemId: centeredItemId}))
                        if (expandedItem) {
                            dispatch(canvas.expandItem({itemId: expandedItem, animate: false}))
                        }
                    }
                }, 1000)
            }
        }
    }
}

export function handleTapCanvas({x, y}) {
    return function (dispatch, getState) {
    }
}

export function handleTapEdge({event, sourceItemId, targetItemId}) {
    return function (dispatch, getState) {
        if (event.shiftKey) {
            let sourceDocId = canvas.getItem(getState().canvas, sourceItemId).docId
            let targetDocId = canvas.getItem(getState().canvas, targetItemId).docId
            dispatch(canvas.hideEdge({itemId1: sourceItemId, itemId2: targetItemId}))
            dispatch(storage.deleteLink({
                doc1: sourceDocId,
                doc2: targetDocId,
            }))
        }
    }
}

export function handleTapItem({itemId, event}) {
    return function (dispatch, getState) {
        if (event.shiftKey && (event.ctrlKey || event.metaKey)) {
            let item = canvas.getItem(getState().canvas, itemId)
            let friends = canvas.getConnectedItemIds(getState().canvas, itemId)
            let centeredItem = getState().canvas.centeredItem
            if (window.confirm("Delete this item?")) {
                dispatch(disconnectAndRemoveItem({itemId}))
            }
            return
        }
        if (event.ctrlKey || event.metaKey) {
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

        // Hide 'Create link to/from...' inputs if this was the centered item
        let centeredItemId = getState().canvas.centeredItem
        if (centeredItemId === itemId) {
            let emptyItem1, emptyItem2
            try {
                emptyItem1 = canvas.getItemIdForDocId(getState().canvas, 'emptyItem_linkto')
            } catch (e) {}
            if (emptyItem1) {
                dispatch(canvas.hideItem({itemId: emptyItem1}))
            }
            try {
                emptyItem2 = canvas.getItemIdForDocId(getState().canvas, 'emptyItem_linkfrom')
            } catch (e) {}
            if (emptyItem2) {
                dispatch(canvas.hideItem({itemId: emptyItem2}))
            }
        }

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

        let remainingItems = Object.keys(getState().canvas.visibleItems)
        if (remainingItems.length === 1) {
            dispatch(canvas.centerItem({itemId: remainingItems[0], animate: true}))
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

export function connectItems({sourceItemId, targetItemId}) {
    return function(dispatch, getState) {
        let sourceItem = canvas.getItem(getState().canvas, sourceItemId)
        let targetItem = canvas.getItem(getState().canvas, targetItemId)

        // Create link in storage
        let linkId = dispatch(storage.findOrAddLink({
            source: sourceItem.docId,
            target: targetItem.docId,
            type: 'manual',
        }))

        // Display edge
        dispatch(canvas.showEdge({
            linkId,
            sourceItemId,
            targetItemId,
        }))
    }
}

export function handleReceivedDrop({itemId, droppedItemId}) {
    return function (dispatch, getState) {
        dispatch(connectItems({sourceItemId: itemId, targetItemId: droppedItemId}))
    }
}

export function handleResetCanvas() {
    return initCanvas({animate: true})
}

export function handleEscape() {
    return function (dispatch, getState) {
        let itemId = canvas.getItemIdForDocId(getState().canvas, 'emptyItem_alone')
        dispatch(canvas.focusItem({itemId}))
    }
}
