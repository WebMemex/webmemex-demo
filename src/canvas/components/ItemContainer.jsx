import React from 'react'
import classNames from 'classnames'
import interact from 'interact.js'
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
            {'focussed': this.props.focussed}
        )
        return (
            <div
                ref='item-container'
                className={className}
                style={{...style}}
            >
                <this.props.ItemComponent
                    docId={this.props.docId}
                    canvasItemId={this.props.itemId}
                />
            </div>
        )
    },

    componentDidMount() {
        this.makeDraggable()
        //this.makeResizable() // impractical and buggy (bug in interactjs?)
        this.makeScalable()
        this.makeTappable()

        // disable dragging/scaling/resizing actions when focussed
        let element = this.refs['item-container']
        interact(element).actionChecker((pointer, event, action) => {
            // Also disable when centered; it prevents clicking a note. (FIXME)
            if (this.props.focussed || this.props.centered)
                return false
            return action
        })
    },

    makeDraggable() {
        let element = this.refs['item-container']
        interact(element).draggable({
            inertia: true,
            restrict: {
                restriction: 'parent',
                // Element can be dragged out of the canvas at left and right,
                // and mostly dragged out at top and bottom.
                elementRect: { top: 0.8, left: 1.0, bottom: 0.2, right: 0.0 }
            },
            onmove: (event) => {
                // Ignore spurious events if item is already removed
                if (element.parentElement === null) return

                // Check if item is dragged out of canvas to left or right side
                if (this.props.x >= this.props.canvasSize.width-1
                    || this.props.x + this.props.width <= 1
                ) {
                    // Item was dragged out of canvas, notify app (to remove it)
                    this.props.draggedOut({
                        itemId: this.props.itemId,
                        dir: (this.props.x<=0) ? 'left' : 'right',
                    })
                }
                else {
                    this.props.relocate({
                        itemId: this.props.itemId,
                        dx: event.dx,
                        dy: event.dy,
                        animate: false,
                    })
                }
            }
        })
    },

    makeResizable() {
        let element = this.refs['item-container']
        interact(element).resizable({
            onmove: (event) => this.props.resize({
                itemId: this.props.itemId,
                dwidth: event.dx,
                dheight: event.dy,
                animate: false,
            })
        })
    },

    makeScalable() {
        let element = this.refs['item-container']
        interact(element).gesturable({
            onmove: (event) => {
                // The event 'origin' (= average between finger positions),
                // relative to the item.
                let origin = {
                    x: event.pageX - this.props.x,
                    y: event.pageY - this.props.y,
                }
                // Move the item to keep the origin exactly between the fingers
                this.props.relocate({
                    itemId: this.props.itemId,
                    dx: event.dx,
                    dy: event.dy,
                    animate: false,
                })
                // Scale proportionally when fingers pinch/stretch
                this.props.scale({
                    itemId: this.props.itemId,
                    dscale: event.ds,
                    origin,
                    animate: false,
                })
                // Note that rotation is ignored
            }
        })
    },

    makeTappable() {
        let element = this.refs['item-container']
        interact(element).on('tap', event => {
            this.props.tap({
                itemId: this.props.itemId,
            })
            event.stopPropagation()
        })
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
        focus: actions.focusItem,
        tap: actions.signalItemTapped,
        draggedOut: actions.signalItemDraggedOut,
    }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(ItemContainer)
