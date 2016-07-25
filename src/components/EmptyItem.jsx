import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Autosuggest from 'react-autosuggest'

import { navigateTo, updateAutoSuggest, setEmptyItemValue } from '../actions'
import { getEmptyItemState, getAutoSuggestSuggestions } from '../selectors'

let EmptyItem = React.createClass({

    render() {
        const submitForm = event => {
            event.preventDefault()
            let inputValue = this.props.inputValue.trim()
            if (inputValue) {
                this.props.submitForm(inputValue)
            }
        }

        const inputProps = {
            value: this.props.inputValue,
            type: 'text',
            placeholder: '.....',
            className: 'emptyItemInput',
            onFocus: () => this.props.focus(),
            onBlur: () => this.props.blur(),
            onChange: (e, {newValue}) => this.props.changed(newValue),
        }
        const suggestions = this.props.suggestions
        const renderSuggestion = suggestion => {
            let html = suggestion.inputValueCompletion
            let classes = `autosuggestion autosuggestion_${suggestion.type}`
            return <div className={classes} dangerouslySetInnerHTML={{__html: html}} />
        }
        const getSuggestionValue = s => s.inputValueCompletion
        const onSuggestionSelected = (event, {suggestion}) => {
            event.preventDefault()
            this.props.pickSuggestion(suggestion.docId)
        }
        return (
            <div className='emptyItem'>
                <form ref='form' className='emptyItemForm' onSubmit={submitForm}>
                    <Autosuggest
                        suggestions={suggestions}
                        onSuggestionsUpdateRequested={this.props.updateAutoSuggest}
                        onSuggestionSelected={onSuggestionSelected}
                        getSuggestionValue={getSuggestionValue}
                        renderSuggestion={renderSuggestion}
                        inputProps={inputProps}
                    />
                </form>
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
        let el = this.refs['form'].getElementsByClassName('emptyItemInput')[0]
        if (this.props.focussed && document.activeElement !== el) {
            el.focus()
        }
        if (!this.props.focussed && document.activeElement === el) {
            el.blur()
        }
    }

})


function mapStateToProps(state, {canvasItemId}) {
    let itemState = getEmptyItemState(state, canvasItemId)
    let inputValue = itemState !== undefined ? itemState.inputValue : ''
    let suggestions = itemState !== undefined
        ? getAutoSuggestSuggestions(state, itemState.inputValueForSuggestions)
        : []
    return {
        suggestions,
        inputValue
    }
}

function mapDispatchToProps(dispatch, {canvasItemId}) {
    return {
        submitForm: userInput => {
            dispatch(setEmptyItemValue({inputValue: '', itemId: canvasItemId}))
            dispatch(navigateTo({userInput, itemId: canvasItemId}))
        },
        pickSuggestion: docId => {
            dispatch(setEmptyItemValue({inputValue: '', itemId: canvasItemId}))
            dispatch(navigateTo({docId, itemId: canvasItemId}))
        },
        ...bindActionCreators({
            changed: inputValue => setEmptyItemValue({inputValue, itemId: canvasItemId}),
            updateAutoSuggest: () => updateAutoSuggest({itemId: canvasItemId})
        }, dispatch)
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(EmptyItem)
