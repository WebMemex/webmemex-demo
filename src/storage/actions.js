import { createAction } from 'redux-act'
import { createActionWithMetaArgs } from '../utils'

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
    return new Date().getTime()
}
