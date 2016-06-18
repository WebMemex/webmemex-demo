import { createAction } from 'redux-act'
import { createActionWithMetaArgs } from '../utils'
import { getDocWithUrl, readGeneratedId } from './selectors'

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

export let addUrl = createActionWithMetaArgs({
    docId: generateIdentifier,
})
export let addNote = createActionWithMetaArgs({
    docId: generateIdentifier,
})
export let deleteDoc = createAction()
export let addLink = createActionWithMetaArgs({
    linkId: generateIdentifier,
})

function generateIdentifier() {
    return 'id_' + new Date().getTime().toString()
}
