import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import ContentEditable from 'react-contenteditable'

import storage from '../storage'

let SimpleItem = React.createClass({

    render() {
        // Only enable editing of the centered item (for now)
        this.editingEnabled = this.props.canvasItem.centered
        let html = this.props.text
        return (
            <ContentEditable
                ref='content'
                html={html}
                disabled={!this.editingEnabled}
                onChange={event => this.props.handleChange(event.target.value)}
                className='simple-item'
                userIsKing
            />
        )
    },

    // When the item is centered, let the editable div grab keyboard input
    componentDidMount() {
        if (this.props.canvasItem.centered) {
            this.refs['content'].htmlEl.focus()
        }
    },
    componentDidUpdate(oldProps) {
        if (!oldProps.canvasItem.centered
           && this.props.canvasItem.centered) {
            this.refs['content'].htmlEl.focus()
        }
    },

})


function mapStateToProps(state) {
    return {
    }
}

function mapDispatchToProps(dispatch, {docId}) {
    return bindActionCreators({
        handleChange: text => storage.updateNoteText({docId, text})
    }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(SimpleItem)
