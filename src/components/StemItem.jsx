import _ from 'lodash'
import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import Note from './Note'
import Webpage from './Webpage'
import EmptyItem from './EmptyItem'
import { hasProps } from '../utils'
import canvas from '../canvas'
import storage from '../storage'
import { drawStar } from '../actions'

let StemItem = React.createClass({

    shouldComponentUpdate: hasProps('canvasItem'),

    render() {
        // Return a different component, depending on the document's type
        if (this.props.docId.startsWith('emptyItem')) {
            return <EmptyItem {...this.props} />
        }
        else if (this.props.text !== undefined)
            return <Note {...this.props} />
        else if (this.props.url !== undefined)
            return <Webpage {...this.props} />
        else
            return <i>Empty item? docId={this.props.docId}, canvasItemId={this.props.canvasItemId}</i>
    }

})


function mapStateToProps(state, {docId, canvasItemId}) {
    let doc = {}
    // Get the document from storage unless docId is not a real doc.
    if (!docId.startsWith('emptyItem') && docId !== undefined) {
        doc = storage.getDoc(state.storage, docId)
    }

    let canvasItem
    try {
        canvasItem = canvas.getItem(state.canvas, canvasItemId)
    }
    catch (err) {
        return {} // we must be phasing out, prevent updating.
    }

    let focussed = canvas.isFocussed(state.canvas, canvasItemId)

    return {
        ...doc,
        canvasItem,
        focussed,
    }
}

function mapDispatchToProps(dispatch, {canvasItemId}) {
    return {
        blur: () => dispatch(canvas.unfocus({itemId: canvasItemId})),
        focus: () => dispatch(canvas.focusItem({itemId: canvasItemId})),
        ...bindActionCreators({
            expandItem: canvas.expandItem,
            drawStar,
        }, dispatch)
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(StemItem)
