import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import ContentEditable from 'react-contenteditable'

import storage from '../storage'

let Note = React.createClass({

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
                className='note'
                userIsKing
            />
        )
    },

    // Apply focus upon mount or update if props tell us to
    componentDidMount() {
        if (this.props.canvasItem.focussed) {
            this.refs['content'].htmlEl.focus()
        }
    },
    componentDidUpdate(oldProps) {
        if (!oldProps.canvasItem.focussed
           && this.props.canvasItem.focussed) {
            this.refs['content'].htmlEl.focus()
        }
        else if (oldProps.canvasItem.focussed
           && !this.props.canvasItem.focussed) {
            this.refs['content'].htmlEl.blur()
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

export default connect(mapStateToProps, mapDispatchToProps)(Note)
