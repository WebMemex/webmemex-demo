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
                <input
                    ref='urlInput'
                    type='text'
                    placeholder='.....'
                    onFocus={() => this.props.focus()}
                    onBlur={() => this.props.blur()}
                ></input>
            </form>
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
        let el = this.refs['urlInput']
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

function mapDispatchToProps(dispatch, {canvasItemId}) {
    return bindActionCreators({
        submitForm: userInput => navigateTo({userInput, itemId: canvasItemId})
    }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(EmptyItem)
