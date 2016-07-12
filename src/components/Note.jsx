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
                onBlur={event => this.props.blur()}
                onFocus={event => this.props.focus()}
            />
        )
    },

    componentDidMount() {
        this.updateBrowserFocus()
    },
    componentDidUpdate(oldProps) {
        this.updateBrowserFocus()
    },

    updateBrowserFocus() {
        // Make browser state reflect application state.
        let el = this.refs['content'].htmlEl
        if (this.props.focussed && document.activeElement !== el) {
            el.focus()
        }
        if (!this.props.focussed && document.activeElement === el) {
            el.blur()
        }
    }

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
