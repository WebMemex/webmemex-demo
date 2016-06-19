import _ from 'lodash'

export function getDoc(state, docId) {
    let doc = state.docs[docId]
    if (doc === undefined)
        throw new Error('no doc with id ' + docId + ' in docs.')
    return doc
}

export function getFriends(state, docId) {
    // Return all docs linking to, and all items linked from the given doc
    let allLinks = state.links
    let targetDocIds = _(allLinks)
        .pickBy(link => (link.source == docId))
        .map(link => link.target)
        .value()
    let sourceDocIds = _(allLinks)
        .pickBy(link => (link.target == docId))
        .map(link => link.source)
        .value()
    return {targetDocIds, sourceDocIds}
}

export function getDocWithUrl(state, url) {
    let docId = _.findKey(state.docs, doc => (doc.url===url))
    return docId
}

export function getDocWithText(state, text) {
    let docId = _.findKey(state.docs, doc => (doc.text===text))
    return docId
}

// A helper to read a value from an action.. should we just use thunks instead?
export function readGeneratedId(action) {
    return action.meta.generatedId
}
