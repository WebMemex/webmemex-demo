import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { navigateTo, updateAutoComplete } from '../actions'
import { getAutoCompleteSuggestions } from '../selectors'

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
            <div className='emptyItem'>
                <form className='emptyItemForm' onSubmit={submitForm}>
                    <input
                        ref='urlInput'
                        type='text'
                        placeholder='.....'
                        onFocus={() => this.props.focus()}
                        onBlur={() => this.props.blur()}
                        onChange={(e) => this.props.changed(e.target.value)}
                    ></input>
                </form>
                <ul className='autoCompleteSuggestionList'>
                    {this.props.suggestions.map(suggestion =>
                        <li
                            className='autoCompleteSuggestion'
                            key={suggestion}
                            dangerouslySetInnerHTML={{__html: suggestion}}
                        >
                        </li>
                    )}
                </ul>
            </div>
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


function mapStateToProps(state, {canvasItemId}) {
    let suggestions = getAutoCompleteSuggestions(state, canvasItemId)
    return {
        suggestions,
    }
}

function mapDispatchToProps(dispatch, {canvasItemId}) {
    return bindActionCreators({
        changed: value => updateAutoComplete({itemId: canvasItemId, value}),
        submitForm: userInput => navigateTo({userInput, itemId: canvasItemId})
    }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(EmptyItem)
