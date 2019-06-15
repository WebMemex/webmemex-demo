import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Autosuggest from 'react-autosuggest'
import classNames from 'classnames'

import * as actions from '../actions'
import { getEmptyItemState, getAutoSuggestSuggestions } from '../selectors'
import { asUrl } from '../utils'

const placeholders = {
    'emptyItem_alone': 'Find or add new note/webpage...',
    'emptyItem_linkto': 'Create link to...',
    'emptyItem_linkfrom': 'Create link from...',
}

let EmptyItem = React.createClass({

    render() {
        const submitForm = event => {
            event.preventDefault()
            let inputValue = this.props.inputValue.trim()
            if (inputValue) {
                this.props.submitForm(inputValue)
            }
        }
        const placeholder = placeholders[this.props.docId]
        const inputProps = {
            value: this.props.inputValue,
            type: 'text',
            placeholder,
            className: 'emptyItemInput',
            onFocus: () => this.props.focus(),
            onBlur: () => {
                this.props.blur()
                if (this.props.hideOnBlur && this.props.inputValue==='')
                    this.props.hide()
            },
            onChange: (e, {newValue}) => this.props.changed(newValue),
        }
        const renderSuggestion = suggestion => {
            let html = suggestion.inputValueCompletion
            let classes = `autosuggestion autosuggestion_${suggestion.type}`
            return <div className={classes} dangerouslySetInnerHTML={{__html: html}} />
        }
        const getSuggestionValue = s => s.inputValueCompletion
        const onSuggestionSelected = (event, {suggestion}) => {
            event.preventDefault()
            this.props.pickSuggestion(suggestion)
        }

        let hasInput = (this.props.inputValue && this.props.inputValue.length > 0)
        let inputIsUrl = hasInput && (asUrl(this.props.inputValue) !== undefined)

        let itemClass = classNames(
            'emptyItem',
            {
                'urllike': inputIsUrl,
                'notelike': hasInput && !inputIsUrl,
            }
        )

        return (
            <div className={itemClass}>
                <form ref='form' className='emptyItemForm' onSubmit={submitForm}>
                    <Autosuggest
                        suggestions={this.props.suggestions}
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
        let el = this.refs['form'].getElementsByClassName('emptyItemInput')[0]
        el.addEventListener('keydown', (event)=>{
            if (event.keyCode==27) {
                el.blur();
            }
        })
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
    let inputValue = itemState !== undefined ? itemState.inputValue || '' : ''
    let inputValueForSuggestions = itemState !== undefined ? itemState.inputValueForSuggestions : ''
    let suggestions = itemState !== undefined
        ? getAutoSuggestSuggestions(state, itemState.inputValueForSuggestions)
        : []
    return {
        suggestions,
        inputValue,
        hideOnBlur: itemState && itemState.hideOnBlur,
        inputValueForSuggestions,
    }
}

function mapDispatchToProps(dispatch, {canvasItemId}) {
    return {
        submitForm: userInput => {
            dispatch(actions.setEmptyItemState({
                itemId: canvasItemId,
                props: {inputValue: ''},
            }))
            dispatch(actions.navigateTo({userInput, itemId: canvasItemId}))
        },
        pickSuggestion: suggestion => {
            dispatch(actions.setEmptyItemState({
                itemId: canvasItemId,
                props: {inputValue: ''},
            }))
            if (suggestion.docId) {
                dispatch(actions.navigateTo({docId: suggestion.docId, itemId: canvasItemId}))
            }
        },
        hide: () => {
            dispatch(canvas.hideItem({itemId: canvasItemId}))
            dispatch(actions.setEmptyItemState({itemId: canvasItemId, props: {inputValue: undefined, inputValueForSuggestions: undefined, hideOnBlur: undefined}}))
        },
        ...bindActionCreators({
            changed: inputValue => actions.setEmptyItemState({
                itemId: canvasItemId,
                props: {inputValue}
            }),
            updateAutoSuggest: () => actions.updateAutoSuggest({itemId: canvasItemId}),
        }, dispatch)
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(EmptyItem)
