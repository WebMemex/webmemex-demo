import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import * as actions from '../actions'
import { getItem } from '../selectors'
import { hasProps } from '../../utils'

let Edge = React.createClass({

    shouldComponentUpdate: hasProps('sourceItem', 'targetItem'),

    render() {
        let { sourceItem, targetItem, signalEdgeTapped } = this.props

        let getItemCenterCoords = item => ({
            x: item.x + item.width/2,
            y: item.y + item.height/2,
        })
        let sourceCenter = getItemCenterCoords(sourceItem)
        let targetCenter = getItemCenterCoords(targetItem)
        let edgeCoords =  'M ' + sourceCenter.x + ' ' + sourceCenter.y
                       + ' L ' + targetCenter.x + ' ' + targetCenter.y
        return (
            <path
                className='edge'
                d={edgeCoords}
                onClick={event => signalEdgeTapped(event)}
                onTouchStart={event => signalEdgeTapped(event)}
            />
        )
    }
})


function mapStateToProps(state, {sourceItemId, targetItemId}) {
    state = state.canvas
    return {
        sourceItem: getItem(state, sourceItemId),
        targetItem: getItem(state, targetItemId),
    }
}

function mapDispatchToProps(dispatch, {sourceItemId, targetItemId}) {
    let signalEdgeTapped = event => actions.signalEdgeTapped({
        event,
        sourceItemId, targetItemId,
    })

    return bindActionCreators({
        signalEdgeTapped,
    }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Edge)
