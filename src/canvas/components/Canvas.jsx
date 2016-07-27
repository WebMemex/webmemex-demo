import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import interact from 'interact.js'

import AnimatedItemContainer from './AnimatedItemContainer'
import Edge from './Edge'
import * as actions from '../actions'

let Canvas = React.createClass({

    componentDidMount() {
        window.addEventListener('resize', this.props.updateWindowSize)
        this.props.updateWindowSize()

        window.addEventListener('keydown', (event)=>{
            if (event.keyCode==27) {
                this.props.unexpand()
            }
        })

        interact(this.refs['canvas']).on('tap', event => {
            if (this.props.expandedItem)
                this.props.unexpand()
            else
                this.props.handleTap({x: event.pageX, y: event.pageY})
            event.stopPropagation()
        })

        this.enableDrop()
    },

    render() {
         let {ItemComponent, canvasSize, visibleItems, edges, unexpand} = this.props
         return (
            <div ref='canvas' id='canvas' style={canvasSize}>
                <svg id='edges'>
                    {Object.keys(edges).map(edgeId => (
                        <Edge edgeId={edgeId} {...edges[edgeId]} key={edgeId} />
                    ))}
                </svg>
                {
                    Object.keys(visibleItems).map(itemId => (
                        <AnimatedItemContainer
                            itemId={itemId}
                            ItemComponent={ItemComponent}
                            key={itemId}
                        />
                    ))
                }
            </div>
        )
    },

    enableDrop() {
        this.refs['canvas'].ondragover = event => event.preventDefault()
        this.refs['canvas'].ondrop = event => {
            event.stopPropagation()
            event.preventDefault()
            let x = event.clientX // TODO compute coordinates relative to canvas
            let y = event.clientY
            this.props.handleDrop({x, y, event})
        }
    },
})


function mapStateToProps(state) {
    state = state.canvas // TODO make us get only this namespace
    return {
        canvasSize: state.canvasSize,
        visibleItems: state.visibleItems,
        edges: state.edges,
        expandedItem: state.expandedItem
    }
}

function mapDispatchToProps(dispatch) {
    let dispatchUpdateWindowSize = () => dispatch(actions.updateWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
    }))

    let dispatchUnexpand = () => dispatch(actions.unexpand({animate: true}))

    return {
        updateWindowSize: dispatchUpdateWindowSize,
        unexpand: dispatchUnexpand,
        ...bindActionCreators({
            unfocus: actions.unfocus,
            handleDrop: actions.signalDropOnCanvas,
            handleTap: actions.signalCanvasTapped,
        }, dispatch)
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Canvas)
