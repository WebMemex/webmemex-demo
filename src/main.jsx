import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'

import makeStore from './store'
import { Canvas } from './canvas'
import StemItem from './components/StemItem'
import * as actions from './actions'

const store = makeStore()

ReactDOM.render(
    <Provider store={store}>
        <Canvas ItemComponent={StemItem} />
    </Provider>,
    document.getElementById('app-container')
)

// Place our initial content
// (delay to wait for redux-pouchdb to read storage state) // TODO neaten
window.setTimeout(()=>store.dispatch(actions.initCanvas()), 200)

// Listen for link clicks
window.addEventListener('message', function (m) {
    let url = m.data.url
    console.log('Received URL: ' + url)
    if (url !== undefined) {
        store.dispatch(actions.navigateFromLink({url}))
    }
})

// TESTING
window.store=store
import storage from './storage'
window.storage=storage
import canvas from './canvas'
window.canvas=canvas

import './backuptools'
