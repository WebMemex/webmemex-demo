import React from 'react'

let Webpage = React.createClass({

    render() {
        let canvasItemHeight = this.props.height
        let canvasItemWidth = this.props.width
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

        let iframeSrcPrefix = process.env.MEMEX_PROXY_URL_PREFIX || ''

        // Hard-code exception for included youtube video to reduce proxy load.
        if (this.props.url.startsWith('https://www.youtube.com/embed')) {
            iframeSrcPrefix = ''
        }

        return (
            <div className='webpage-iframe-wrapper-container' style={wrapperStyle}>
                <div className='webpage-iframe-scaling-container' style={scalingStyle}>
                    <iframe
                        className='webpage-iframe'
                        src={iframeSrcPrefix + this.props.url}
                        // scrolling={expanded ? 'auto' : 'no'} // BUG in chromium? Scrollbar does not appear
                        scrolling = 'auto'
                        seamless
                        referrerpolicy='no-referrer'
                        sandbox='allow-scripts allow-same-origin'
                    ></iframe>
                    { !expanded ? <div className='webpage-iframe-overlay'></div> : null}
                </div>
            </div>
        )
    }
})

export default Webpage
