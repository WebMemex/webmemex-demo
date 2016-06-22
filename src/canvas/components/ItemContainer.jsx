import React from 'react'
import classNames from 'classnames'
import interact from 'interact.js'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { relocateItem, resizeItem, scaleItem, focusItem, signalItemTapped } from '../actions'
import { getItem } from '../selectors'
import { hasProps } from '../../utils'

let ItemContainer = React.createClass({

    shouldComponentUpdate: hasProps('itemId'),

    render() {
        let ItemComponent = this.props.ItemComponent
        let style = {
            left: this.props.x,
            top: this.props.y,
            width: this.props.width,
            height: this.props.height,
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
                <ItemComponent
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
            if (this.props.focussed)
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
                // 90% of the element can be dragged out of the canvas.
                elementRect: { top: 0.9, left: 0.9, bottom: 0.1, right: 0.1 }
            },
            onmove: (event) => this.props.relocate({
                itemId: this.props.itemId,
                dx: event.dx,
                dy: event.dy,
                animate: false,
            })
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
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        relocate: relocateItem,
        resize: resizeItem,
        scale: scaleItem,
        focus: focusItem,
        tap: signalItemTapped,
    }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(ItemContainer)
