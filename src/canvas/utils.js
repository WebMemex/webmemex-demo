import _ from 'lodash'

import { ensureUnusedId } from '../utils'

// Helper function to find or generate the itemId for a new item.
// Used by both the createItem action (thunk) and createItem (kind-of-)reducer.
export function reuseOrGenerateItemId(state, {docId}) {
    // Try reuse an item that is flagged for removal (mainly to animate moving)
    let itemId = _.findKey(state.visibleItems, item => (
        item.docId == docId && item.flaggedForRemoval
    ))
    // Else, pick an identifier to create a new item
    if (itemId === undefined) {
        let desiredItemId = 'view_'+docId
        itemId = ensureUnusedId(state.visibleItems, desiredItemId)
    }
    return itemId
}
