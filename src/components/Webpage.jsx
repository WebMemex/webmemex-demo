import React from 'react'

let Webpage = React.createClass({

    render() {
        let canvasItemHeight = this.props.canvasItem.height
        let canvasItemWidth = this.props.canvasItem.width
        let minFramePageHeight = Math.max(canvasItemHeight, 600)
        let minFramePageWidth = Math.max(canvasItemWidth, 800)
        let scale = Math.min(canvasItemHeight / minFramePageHeight,
                             canvasItemWidth / minFramePageWidth)

        let expanded = this.props.canvasItem.expanded

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
            <div className='webpage-iframe-wrapper-container' style={wrapperStyle}>
                <div className='webpage-iframe-scaling-container' style={scalingStyle}>
                    <iframe
                        className='webpage-iframe'
                        src={this.props.url}
                        // scrolling={expanded ? 'auto' : 'no'} // BUG in chromium? Scrollbar does not appear
                        scrolling = 'auto'
                        seamless
                    ></iframe>
                    { !expanded ? <div className='webpage-iframe-overlay'></div> : null}
                </div>
            </div>
        )
    }
})

export default Webpage
