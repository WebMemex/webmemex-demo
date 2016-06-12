import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'

import makeStore from './store'
import { Canvas } from './canvas'
import StemItem from './components/StemItem'
import { initCanvas } from './actions'

const store = makeStore()

// Place our initial content
store.dispatch(initCanvas())

ReactDOM.render(
    <Provider store={store}>
        <Canvas ItemComponent={StemItem} />
    </Provider>,
    document.getElementById('app-container')
)
window.store=store // TESTING
