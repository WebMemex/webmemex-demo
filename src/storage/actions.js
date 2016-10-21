import _ from 'lodash'
import { createAction } from 'redux-act'
import { createActionWithMetaArgs } from '../utils'
import { getDocWithUrl, getDocWithText, readGeneratedId } from './selectors'

export function findOrAddUrl({url}) {
    return function (dispatch, getState) {
        // Search if we have it already
        let docId = getDocWithUrl(getState().storage, url) // XXX non-modular: We'd want to get state.storage from getState().
        // If not, create a new document
        if (!docId) {
            let action = addUrl({url})
            dispatch(action)
            docId = readGeneratedId(action)
        }
        return docId
    }
}

export function findOrAddNote({text}) {
    return function (dispatch, getState) {
        // Search if we have it already
        let docId = getDocWithText(getState().storage, text) // XXX non-modular: We'd want to get state.storage from getState().
        // If not, create a new document
        if (!docId) {
            let action = addNote({text})
            dispatch(action)
            docId = readGeneratedId(action)
        }
        return docId
    }
}

export function findOrAddLink({source, target}) {
    return function (dispatch, getState) {
        // Search if we have it already
        let linkId = _.findKey(getState().storage.links, // non-modular..
            link => (link.source===source && link.target===target)
        )
        // If not, create a new link
        if (!linkId) {
            let action = addLink({source, target})
            dispatch(action)
            linkId = readGeneratedId(action)

            // Remove any link in the other direction, to keep things simple.
            let revLinkId = _.findKey(getState().storage.links, // non-modular..
                link => (link.source===target && link.target===source)
            )
            if (revLinkId) {
                dispatch(deleteLink({linkId: revLinkId}))
            }
        }
        return linkId
    }
}

export let addUrl = createActionWithMetaArgs({
    generatedId: generateIdentifier,
})
export let addNote = createActionWithMetaArgs({
    generatedId: generateIdentifier,
})
export let updateNoteText = createAction()
export let deleteDoc = createAction()
export let addLink = createActionWithMetaArgs({
    generatedId: generateIdentifier,
})
export let deleteLink = createAction()
export let importFromDump = createAction()


function generateIdentifier() {
    return 'id_' + new Date().getTime().toString()
}
