import React from 'react'
import classNames from 'classnames'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import * as actions from '../actions'
import { getItem } from '../selectors'
import { hasProps } from '../../utils'

let ItemContainer = React.createClass({

    shouldComponentUpdate: hasProps('itemId'),

    render() {
        const { x, y, width, height, canvasSize: {width: canvasWidth} } = this.props
        let style = {
            left: x,
            top: y,
            width: width,
            height: height,
        }

        let className = classNames(
            'item-container',
            this.props.classes,
            {'expanded': this.props.expanded}
        )

        let handleTap = event => {
            this.props.tap(event)
            event.stopPropagation()
        }

        const toggleExpand = event => {
            event.stopPropagation()
            if (!this.props.expanded) {
                this.props.expandItem()
            }
            else {
                this.props.unexpand()
            }
        }

        return (
            <div
                ref='item-container'
                className={className}
                style={{...style}}
                onClick={handleTap}
                onTouchStart={handleTap}
            >
                <this.props.ItemComponent
                    docId={this.props.docId}
                    canvasItemId={this.props.itemId}
                    width={this.props.width}
                    height={this.props.height}
                />
                {this.props.centered && (
                    <button
                        className="button"
                        onClick={toggleExpand}
                        title="Expand"
                    >
                        ↘
                    </button>
                )}
            </div>
        )
    },

})


function mapStateToProps(state, ownProps) {
    state = state.canvas
    let itemId = ownProps.itemId

    let item
    try {
        item = getItem(state, itemId)
    }
    catch (err) {
        return {} // we must be phasing out, prevent updating.
    }

    return {
        ...item,
        // For animation, let (interpolated) props override state values
        ...ownProps,
        canvasSize: state.canvasSize,
    }
}

function mapDispatchToProps(dispatch, {itemId}) {
    return bindActionCreators({
        expandItem: () => actions.expandItem({itemId, animate: true}),
        unexpand: () => actions.unexpand({animate: true}),
        tap: (event) => actions.signalItemTapped({itemId, event}),
    }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(ItemContainer)
