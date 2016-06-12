import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { getItem } from '../selectors'
import { hasProps } from '../../utils'

let Edge = React.createClass({

    shouldComponentUpdate: hasProps('sourceItem', 'targetItem'),

    render() {
        let sourceItem = this.props.sourceItem
        let targetItem = this.props.targetItem

        let getItemCenterCoords = item => ({
            x: item.x + item.width/2,
            y: item.y + item.height/2,
        })
        let sourceCenter = getItemCenterCoords(sourceItem)
        let targetCenter = getItemCenterCoords(targetItem)
        let edgeCoords =  'M ' + sourceCenter.x + ' ' + sourceCenter.y
                       + ' L ' + targetCenter.x + ' ' + targetCenter.y
        return <path className='edge' d={edgeCoords} />
    }
})


function mapStateToProps(state, {sourceItemId, targetItemId}) {
    state = state.canvas
    return {
        sourceItem: getItem(state, sourceItemId),
        targetItem: getItem(state, targetItemId),
    }
}

export default connect(mapStateToProps)(Edge)
