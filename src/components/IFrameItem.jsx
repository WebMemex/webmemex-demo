import React from 'react'

let IFrameItem = React.createClass({

    render() {
        let canvasItemHeight = this.props.canvasItem.height
        let canvasItemWidth = this.props.canvasItem.width
        let minFramePageHeight = Math.max(canvasItemHeight, 600)
        let minFramePageWidth = Math.max(canvasItemWidth, 800)
        let scale = Math.min(canvasItemHeight / minFramePageHeight,
                             canvasItemWidth / minFramePageWidth)

        let focussed = this.props.canvasItem.focussed

        let wrapperStyle = {
            height: canvasItemHeight,
            width: canvasItemWidth,
        }
        let scalingStyle = {
            height: canvasItemHeight / scale,
            width: canvasItemWidth / scale,
            transform: 'scale('+scale+')',
        }
        return (
            <div className='item-iframe-wrapper-container' style={wrapperStyle}>
                <div className='item-iframe-scaling-container' style={scalingStyle}>
                    <iframe
                        className='item-iframe'
                        src={this.props.url}
                        // scrolling={focussed ? 'auto' : 'no'} // BUG in chromium? Scrollbar does not appear
                        scrolling = 'auto'
                        seamless
                    ></iframe>
                    { !focussed ? <div className='item-iframe-overlay'></div> : null}
                </div>
            </div>
        )
    }
})

export default IFrameItem
