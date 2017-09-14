import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import classNames from 'classnames'

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
                if (event.target === this.refs['canvas']
                 || event.target === document.body) {
                    this.props.handleEscape()
                }
            }
        })

        this.refs['canvas'].addEventListener('touchstart', e=>e.preventDefault())

        this.enableDrop()
    },

    render() {
         let {ItemComponent, canvasSize, visibleItems, edges, showDropSpace, unexpand} = this.props
         let handleTap = event => {
             if (this.props.expandedItem)
                 this.props.unexpand()
             else
                 this.props.handleTap({x: event.pageX, y: event.pageY})
             event.stopPropagation()
         }
         const className = classNames({showDropSpace})
         return (
            <div ref='canvas' id='canvas' className={className} style={canvasSize} onClick={handleTap} onTouchStart={handleTap}>
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
        const canvasEl = this.refs['canvas']
        canvasEl.ondragover = event => event.preventDefault()

        canvasEl.ondragenter = event => {
            event.preventDefault()
            let x = event.clientX
            let y = event.clientY
            this.props.handleDragEnter({x, y, event})
        }

        canvasEl.ondrop = event => {
            event.stopPropagation()
            event.preventDefault()
            let x = event.clientX // TODO compute coordinates relative to canvas
            let y = event.clientY
            this.props.handleDrop({x, y, event})
            this.props.handleDragLeave({x, y, event})
        }
    },
})


function mapStateToProps(state) {
    state = state.canvas // TODO make us get only this namespace
    return {
        canvasSize: state.canvasSize,
        visibleItems: state.visibleItems,
        edges: state.edges,
        expandedItem: state.expandedItem,
        showDropSpace: state.showDropSpace,
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
            handleDragEnter: actions.handleDragEnter,
            handleDragLeave: actions.handleDragLeave,
            handleTap: actions.signalCanvasTapped,
            handleEscape: actions.signalEscape,
        }, dispatch)
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Canvas)
