import React from 'react'

let Webpage = React.createClass({
    getInitialState() {
        return {hasIFrame: false}
    },

    calculateStyle(props) {
        let canvasItemHeight = props.height
        let canvasItemWidth = props.width
        let minFramePageHeight = Math.max(canvasItemHeight, 600)
        let minFramePageWidth = Math.max(canvasItemWidth, 800)
        let scale = Math.min(canvasItemHeight / minFramePageHeight,
                             canvasItemWidth / minFramePageWidth)

        let wrapperStyle = {
            height: canvasItemHeight,
            width: canvasItemWidth,
        }
        let scalingStyle = {
            height: canvasItemHeight / scale,
            width: canvasItemWidth / scale,
            transform: 'scale('+scale+')',
        }

        const showIFrame = props.canvasItem.centered || scale > 0.1

        return {scalingStyle, wrapperStyle, showIFrame}
    },

    componentWillReceiveProps(nextProps) {
        let {showIFrame} = this.calculateStyle(nextProps)
        // If the iframe has been shown once, remember to keep it there.
        if (showIFrame) {
            this.setState({hasIFrame: true})
        }
    },

    componentWillMount() {
        this.componentWillReceiveProps(this.props)
    },

    render() {
        let {scalingStyle, wrapperStyle, showIFrame} = this.calculateStyle(this.props)
        let expanded = this.props.canvasItem.expanded

        // If the page is tiny and did not have its iframe loaded already, don't bother loading one. Just show the URL.
        if (!showIFrame && !this.state.hasIFrame) {
            return (
                <div className='webpage-placeholder' title={this.props.url}>
                    {this.props.url.replace(/^https?:\/\//, '').replace(/^www./, '')}
                </div>
            )
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
                    { !expanded ? <div className='webpage-iframe-overlay' title={this.props.url}></div> : null}
                </div>
            </div>
        )
    }
})

export default Webpage
