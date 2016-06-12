import _ from 'lodash'
import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import SimpleItem from './SimpleItem'
import IFrameItem from './IFrameItem'
import AddUrlForm from './AddUrlForm'
import { hasProps } from '../utils'
import canvas from '../canvas'
import storage from '../storage'
import { drawStar } from '../actions'

let StemItem = React.createClass({

    shouldComponentUpdate: hasProps('canvasItem'),

    render() {
        // Return a different component, depending on the document's type
        if (this.props.docId == 'addUrlForm') {
            return <AddUrlForm {...this.props} />
        }
        else if (this.props.text)
            return <SimpleItem {...this.props} />
        else if (this.props.url)
            return <IFrameItem {...this.props} />
        else
            return <i>Empty item? docId={this.props.docId}, canvasItemId={this.props.canvasItemId}</i>
    }

})


function mapStateToProps(state, {docId, canvasItemId}) {
    let doc = {}
    // Get the document from storage unless docId is not a real doc.
    const specialDocIds = ['addUrlForm']
    if (!_.includes(specialDocIds, docId)) {
        doc = storage.getDoc(state.storage, docId)
    }

    let canvasItem
    try {
        canvasItem = canvas.getItem(state.canvas, canvasItemId)
    }
    catch (err) {
        return {} // we must be phasing out, prevent updating.
    }

    return {
        ...doc,
        canvasItem,
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        focusItem: canvas.focusItem,
        drawStar,
    }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(StemItem)
