import _ from 'lodash'
import { persistentReducer } from 'redux-pouchdb';
import { createReducer } from 'redux-act';

import * as actions from './actions'
import { getDoc } from './selectors'
import { ensureUnusedId } from '../utils'

let defaultState = {
    docs: {
        // [docId]: {url: '....'},
        // [docId]: {text: '....'},
    },
    links: {
        // [linkId]: {source: [sourceDocId], target: [targetDocId]}
    },
}

function addUrl(state, {docId, url}, {generatedId}) {
    let newDoc = {url: url}
    if (docId === undefined)
        docId = ensureUnusedId(state.docs, generatedId)
    return {...state, docs: {...state.docs, [docId]: newDoc}}
}

function addNote(state, {docId, text}, {generatedId}) {
    let newDoc = {text}
    if (docId === undefined)
        docId = ensureUnusedId(state.docs, generatedId)
    return {...state, docs: {...state.docs, [docId]: newDoc}}
}

function updateNoteText(state, {docId, text}) {
    let doc = getDoc(state, docId)
    let newDoc = {...doc, text}
    return {...state, docs: {...state.docs, [docId]: newDoc}}
}

function deleteDoc(state, {docId}) {
    // Remove doc
    let docs = _.omit(state.docs, docId)
    // Also remove links to and from doc
    let links = _.omitBy(state.links, ({source, target}) => (source===docId || target===docId))
    return {...state, docs, links}
}

function addLink(state, {linkId, source, target}, {generatedId}) {
    // Refuse creating self-links
    if (source === target)
        return state
    let newLink = {source, target}
    if (linkId === undefined)
        linkId = ensureUnusedId(state.links, generatedId)
    return {...state, links: {...state.links, [linkId]: newLink}}
}

// Delete a link. Pass either a linkId, or two docIds.
function deleteLink(state, {linkId, doc1, doc2}) {
    let links
    if (linkId===undefined) {
        links = _.omitBy(state.links, ({source, target}) => (
            (source===doc1 && target===doc2) || (source===doc2 && target===doc1)
        ))
    }
    else {
        links = _.omit(state.links, linkId)
    }
    return {...state, links}
}

function importFromDump(state, {storageDump, deleteCurrent=false}) {
    if (deleteCurrent===true) {
        return storageDump
    }
    else {
        let stateCopy = _.cloneDeep(state) // Because _.merge mutates it.
        return _.merge(stateCopy, storageDump)
    }
}

let reducer = createReducer(
    {
        [actions.addUrl]: addUrl,
        [actions.addNote]: addNote,
        [actions.updateNoteText]: updateNoteText,
        [actions.deleteDoc]: deleteDoc,
        [actions.addLink]: addLink,
        [actions.deleteLink]: deleteLink,
        [actions.importFromDump]: importFromDump,
    },
    defaultState
)

// wrap it to set a function name for redux-pouchdb
function storageReducer(...args) {
    return reducer(...args)
}

export default persistentReducer(storageReducer)
