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

// Fallback to initialise the canvas content; redux-pouchdb should trigger this
// after loading persisted data, but if that fails we do it manually here.
window.setTimeout(()=>store.dispatch(actions.initCanvas()), 3000)

// Listen for link clicks
window.addEventListener('message', function (m) {
    let url = m.data.url
    console.log('Received URL: ' + url)
    if (url !== undefined) {
        store.dispatch(actions.navigateFromLink({url}))
    }
})

// XXX Global variable passing to enable us to subscribe to the store in the initCanvas action.
window.store=store

// TESTING
import storage from './storage'
window.storage=storage
import canvas from './canvas'
window.canvas=canvas

import './backuptools'
