import _ from 'lodash'

/* hasProps(requiredProps)(givenProps)
 * Checks if required properties are defined in the given props object.
 * Used by some components' shouldComponentUpdate methods, to prevent trying to
 * update a component that has been removed from the state (and will be removed
 * from the DOM as soon as the parent component also updates)
 */
export function hasProps(...requiredProps) {
    return function _hasProps(givenProps) {
        return requiredProps.every(propName=>givenProps[propName])
    }
}

export function asUrl(input) {
    // A URI, with or without the scheme ('xxx://')
    const matcher = /^(?:(?:\w+:)?\/\/)?([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/
    if (matcher.test(input)) {
        if (!(input.startsWith('http://')
           || input.startsWith('https://')
           || input.startsWith('file://'))) { // TODO let regex test scheme.
            input = 'http://'+input
        }
        return input
    }
    else {
        return undefined
    }
}

export function textToHtml(text) {
    return text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/\n/g, '<br>')
}

// Wrap redux-act's createAction to reduce code repetition
// (perhaps redux-act is still not opinionated enough)
import { createAction } from 'redux-act'
export function createActionWithMetaArgs(metaArgs) {
    // Resolve all (factory/getter) functions among the argument values
    function getMetaArgs() {
        return _.mapValues(metaArgs,
                           value => (_.isFunction(value) ? value() : value)
        )
    }
    return createAction(
        undefined, // we could have given the action a name here
        payload => payload, // we never modify action payloads
        payload => getMetaArgs(), // we pass 'meta' arguments to the reducer
    )
}

// Append a number to the desiredId when it is already in use
export function ensureUnusedId(collection, desiredId) {
    let id = desiredId
    let i = 1
    while (id in collection) {
        id = desiredId + (i++).toString()
    }
    return id
}
