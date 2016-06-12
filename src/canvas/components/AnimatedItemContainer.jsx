import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'
import { Motion, spring } from 'react-motion';

import ItemContainer from './ItemContainer'
import { getItem } from '../selectors'
import { hasProps } from '../../utils'

let AnimatedItemContainer = React.createClass({

    shouldComponentUpdate: hasProps('position'),

    render() {
        let position = this.props.position
        let ownProps = this.props.ownProps
        let interpolationParams = (this.props.inTransition) ?
            _.mapValues(position, value => spring(value, {stiffness:170}))
            : position // pass the position directly, disables animation
        return (
            <Motion
                style={interpolationParams}
            >
                {
                    interpolated => <ItemContainer {...ownProps} {...interpolated} />
                }
            </Motion>
        )
    }

})


function mapStateToProps(state, ownProps) {
    state = state.canvas
    let item
    try {
        item = getItem(state, ownProps.itemId)
    }
    catch (err) {
        return {} // we must be phasing out, prevent updating.
    }
    let {x, y, width, height, inTransition} = item
    let position = {x, y, width, height}
    return {
        ownProps,
        position,
        inTransition,
    }
}

export default connect(mapStateToProps)(AnimatedItemContainer)
