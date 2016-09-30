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
        if (this.props.beingDragged) {
            // Give visual feedback when dragging out of canvas
            if (x < 0 || x > (canvasWidth - width)) {
                let proportionOutside = 1-linearRolloffFunction({
                    lowerBound: 0-width,
                    upperBound: canvasWidth,
                    fadeRegion: width
                })(x)
                let scale = 1-0.5*proportionOutside
                let angle = 30 * proportionOutside * ((x<0) ? -1 : 1)
                style = {
                    ...style,
                    opacity: 1-0.5*proportionOutside,
                    transform: `scale(${scale}) rotate(${angle}deg)`,
                }
            }
        }
        if (this.props.activeDropTarget) {
            style = {
                ...style,
                border: '5px #ccc solid',
            }
        }

        let className = classNames(
            'item-container',
            this.props.classes,
            {'expanded': this.props.expanded}
        )
        return (
            <div
                ref='item-container'
                className={className}
                style={{...style}}
                data-itemid={this.props.itemId} // for drag&drop
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

    componentDidMount() {
        this.makeDraggable()
        //this.makeResizable() // impractical and buggy (bug in interactjs?)
        this.makeScalable()
        this.makeTappable()
        this.makeDropTarget()

        // disable dragging/scaling/resizing actions when expanded
        let element = this.refs['item-container']
        interact(element).actionChecker((pointer, event, action) => {
            if (this.props.expanded)
                return false
            return action
        })
    },

    makeDraggable() {
        let element = this.refs['item-container']
        interact(element).draggable({
            inertia: true,
            restrict: {
                restriction: 'parent', // restrict to parent = canvas
                elementRect: { top: 0, left: 0, bottom: 1, right: 1 }, // complete item should be within canvas
                endOnly: true, // return to within canvas only after releasing
            },
            onstart: () => {
                // Ignore spurious events if item is already removed
                if (element.parentElement === null) return

                this.props.setItemDragged({itemId: this.props.itemId, value: true})
            },
            onend: () => {
                // Ignore spurious events if item is already removed
                if (element.parentElement === null) return

                this.props.setItemDragged({itemId: this.props.itemId, value: false})
            },
            onmove: (event) => {
                // Ignore spurious events if item is already removed
                if (element.parentElement === null) return

                // Check if item is dragged out of canvas to left or right side
                const minVisible = this.props.width/5
                if (this.props.canvasSize.width - this.props.x <= minVisible
                    || this.props.x + this.props.width <= minVisible
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

    makeDropTarget() {
        let element = this.refs['item-container']
        let itemId = this.props.itemId
        interact(element).dropzone({
            accept: '.item-container',
            ondrop: event => {
                // Ignore spurious events if item is already removed
                if (element.parentElement === null) return

                let droppedItemId = event.relatedTarget.getAttribute('data-itemid')
                this.props.receivedDrop({
                    itemId,
                    droppedItemId,
                })
            },
            ondragenter: event => {
                this.props.setProps({itemId, props: {activeDropTarget: true}})
            },
            ondragleave: event => {
                this.props.setProps({itemId, props: {activeDropTarget: false}})
            },
            ondropdeactivate: event => {
                // Ignore spurious events if item is already removed
                if (element.parentElement === null) return

                this.props.setProps({itemId, props: {activeDropTarget: false}})
            },
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
        expand: actions.expandItem,
        setItemDragged: actions.setItemDragged,
        tap: actions.signalItemTapped,
        draggedOut: actions.signalItemDraggedOut,
        receivedDrop: actions.signalReceivedDrop,
        setProps: actions.setProps,
    }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(ItemContainer)

function linearRolloffFunction({lowerBound, upperBound, fadeRegion}) {
    return function calculateOutput(input) {
        if (lowerBound+fadeRegion <= input && input <= upperBound-fadeRegion)
            return 1
        if (input < lowerBound+fadeRegion)
            return Math.max(0, (input - lowerBound) / fadeRegion)
        else // (input > upperBound-fadeRegion)
            return Math.max(0, (upperBound - input) / fadeRegion)
    }
}
