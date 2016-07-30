import _ from 'lodash'

export function getDoc(state, docId) {
    let doc = state.docs[docId]
    if (doc === undefined)
        throw new Error('no doc with id ' + docId + ' in docs.')
    return doc
}

export function hasFriends(state, docId) {
    // Return true if doc has any links to/from other docs
    if (_.find(state.links, link =>
        (link.source===docId || link.target===docId)
        && !(link.source==link.target) // self-links are not really friends..
    ))
        return true
    else
        return false
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
    let docId = _.findKey(state.docs, doc => (doc.text && doc.text.toLowerCase()===text.toLowerCase()))
    return docId
}

// A helper to read a value from an action.. should we just use thunks instead?
// FIXME this fails if the reducer changed the generated id. Need other solution.
export function readGeneratedId(action) {
    return action.meta.generatedId
}

export function autoSuggestSearch(state, {inputValue, maxSuggestions=5}) {
    let lowText = inputValue.toLowerCase()
    let words = lowText.split(' ')
    let stripUrl = url => url.replace('http://', '').replace('https://','')
    let strippedUrl = stripUrl(lowText)

    let urlStartsWith = url => (
        stripUrl(url).startsWith(strippedUrl)
    )
    let urlContains = url => (
        url.indexOf(lowText) > -1
    )
    let urlContainsAllWords = url => (
        words.every(word => url.toLowerCase().indexOf(word) > -1)
    )
    let caseSensitiveStartsWith = docText => (
        docText.startsWith(inputValue)
    )
    let caseInsensitiveStartsWith = docText => (
        docText.toLowerCase().startsWith(lowText)
    )
    let containsWholeText = docText => (
        docText.toLowerCase().indexOf(lowText) > -1
    )
    let constainsAllWords = docText => (
        words.every(word => docText.toLowerCase().indexOf(word) > -1)
    )

    let urlMatchers = [
        urlStartsWith,
        urlContains,
        urlContainsAllWords,
    ]
    let textMatchers = [
        caseSensitiveStartsWith,
        caseInsensitiveStartsWith,
        containsWholeText,
        constainsAllWords,
    ]
    let suggestions = []

    for (let i=0; i<textMatchers.length && suggestions.length < maxSuggestions; i++) {
        let matches = _(state.docs)
            .pickBy(doc=>doc.text)
            .pickBy(doc=>textMatchers[i](doc.text))
            .map((doc, docId) => ({docId, type: 'note', inputValueCompletion: doc.text}))
            .value()
        suggestions = _.uniqBy(suggestions.concat(matches), s=>s.docId)
    }
    for (let i=0; i<urlMatchers.length && suggestions.length < maxSuggestions; i++) {
        let matches = _(state.docs)
            .pickBy(doc=>doc.url)
            .pickBy(doc=>urlMatchers[i](doc.url))
            .map((doc, docId) => ({docId, type: 'url', inputValueCompletion: doc.url}))
            .value()
        suggestions = _.uniqBy(suggestions.concat(matches), s=>s.docId)
    }
    suggestions.splice(maxSuggestions)
    return suggestions
}
