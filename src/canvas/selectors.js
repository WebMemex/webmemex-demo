import _ from 'lodash'

export function getItem(state, itemId) {
    let item = state.visibleItems[itemId]
    if (!item)
        throw new Error('No item with id ' + itemId + ' found in state.')
    return item
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
