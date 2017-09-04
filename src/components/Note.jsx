import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import ContentEditable from 'react-contenteditable'

import storage from '../storage'
import { asUrl, textToHtml } from '../utils'

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
        this.enableDrop()
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
    },

    enableDrop() {
        this.refs['content'].htmlEl.ondragover = event => event.preventDefault()
        this.refs['content'].htmlEl.ondrop = event => {
            event.stopPropagation()
            event.preventDefault()
            let html = event.dataTransfer.getData('text/html')
            let text = event.dataTransfer.getData('text')
            let url = event.dataTransfer.getData('URL') || asUrl(text)

            let addition = ''
            if (url) {
                // Quick fix for removing proxy prefix from links and images dragged from our own iframes
                url = url.replace(new RegExp(`^(https?:)?\/\/${window.location.host}\/[a-z-]\/(im_\/)?`), '')
                addition = `<a href="${url}">${url}</a>`
            }
            else if (html) {
                // FIXME problems with character encoding? At least when dropping html from Firefox into Chromium.
                addition = html
            }
            else if (text) {
                let html = textToHtml(text)
                addition = html
            }
            // We always append.
            const newText = this.props.text + addition
            this.props.handleChange(newText)
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
