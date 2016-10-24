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
            this.props.tap({
                itemId: this.props.itemId,
                event,
            })
            event.stopPropagation()
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

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        relocate: actions.relocateItem,
        resize: actions.resizeItem,
        scale: actions.scaleItem,
        expand: actions.expandItem,
        setItemDragged: actions.setItemDragged,
        tap: actions.signalItemTapped,
        draggedOut: actions.signalItemDraggedOut,
        receivedDrop: actions.signalReceivedDrop,
        setProps: actions.setProps,
    }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(ItemContainer)
