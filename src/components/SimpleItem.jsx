import React from 'react'

let SimpleItem = React.createClass({

    render() {
        return (
            <div className='simple-item'>
                <p className='simple-item-text'>{this.props.text}</p>
            </div>
        )
    }

})

export default SimpleItem
