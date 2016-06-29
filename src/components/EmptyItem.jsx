import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { navigateTo } from '../actions'

let EmptyItem = React.createClass({

    render() {
        const submitForm = event => {
            event.preventDefault()
            let value = this.refs['urlInput'].value.trim()
            this.refs['urlInput'].value = ''
            if (value) {
                this.props.submitForm(value)
            }
        }
        return (
            <form className='emptyItem' onSubmit={submitForm}>
                <input ref='urlInput' type='text' placeholder='.....'></input>
            </form>
        )
    },

    // Apply focus upon mount or update if props tell us to
    componentDidMount() {
        if (this.props.canvasItem.focussed) {
            this.refs.urlInput.focus()
        }
    },
    componentDidUpdate(oldProps) {
        if (!oldProps.canvasItem.focussed
           && this.props.canvasItem.focussed) {
               this.refs.urlInput.focus()
        }
        else if (oldProps.canvasItem.focussed
           && !this.props.canvasItem.focussed) {
            this.refs.urlInput.blur()
       }
    },

})


function mapStateToProps(state) {
    return {
    }
}

function mapDispatchToProps(dispatch, {canvasItemId}) {
    return bindActionCreators({
        submitForm: userInput => navigateTo({userInput, itemId: canvasItemId})
    }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(EmptyItem)
