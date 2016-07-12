import _ from 'lodash'

export function getItem(state, itemId) {
    let item = state.visibleItems[itemId]
    if (!item)
        throw new Error('No item with id ' + itemId + ' found in state.')
    return item
}

export function getItemIdForDocId(state, docId) {
    let itemId = _.findKey(state.visibleItems, item => (item.docId === docId))
    if (!itemId)
        throw new Error('No item with docId ' + docId + ' found in state.')
    return itemId
}

export function getCenteredItem(state) {
    let currentItem = state.centeredItem
    if (!currentItem) {
        return undefined
    }
    else {
        return getItem(state, currentItem)
    }
}

export function getConnectedItemIds(state, itemId) {
    return _(state.edges)
        .pickBy(edge => (edge.sourceItemId === itemId || edge.targetItemId === itemId))
        .map(edge => edge.sourceItemId === itemId ? edge.targetItemId : edge.sourceItemId)
        .value()
}

export function getVisibleLinksOfItem(state, itemId) {
    return (_(state.edges)
        .pickBy(edge => (edge.sourceItemId === itemId || edge.targetItemId === itemId))
        .map('linkId')
        .value()
    )
}

export function isFocussed(state, itemId) {
    return (state.focussedItem === itemId)
}
