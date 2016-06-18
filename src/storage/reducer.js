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

function addUrl(state, {url}, {docId}) {
    let newDoc = {url: url}
    docId = ensureUnusedId(state.docs, docId)
    return {...state, docs: {...state.docs, [docId]: newDoc}}
}

function addNote(state, {text}, {docId}) {
    let newDoc = {text}
    docId = ensureUnusedId(state.docs, docId)
    return {...state, docs: {...state.docs, [docId]: newDoc}}
}

function deleteDoc(state, {docId}) {
    return {...state, docs: _.omit(state.docs, docId)}
}

function addLink(state, {source, target}, {linkId}) {
    let newLink = {source, target}
    linkId = ensureUnusedId(state.links, linkId)
    return {...state, links: {...state.links, [linkId]: newLink}}
}

let reducer = createReducer(
    {
        [actions.addUrl]: addUrl,
        [actions.addNote]: addNote,
        [actions.deleteDoc]: deleteDoc,
        [actions.addLink]: addLink,
    },
    defaultState
)

// wrap it to set a function name for redux-pouchdb
function storageReducer(...args) {
    return reducer(...args)
}

export default persistentReducer(storageReducer)
