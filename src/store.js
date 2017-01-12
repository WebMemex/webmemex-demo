import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'
import PouchDB from 'pouchdb'
import { persistentStore } from 'redux-pouchdb'
import createSagaMiddleware from 'redux-saga'

import rootReducer from './reducer'
import sagas from './sagas'

// Creates the redux store for application state
// (both the persistent storage and the canvas state)
export default function makeStore() {
    const db = new PouchDB('reduxstore')

    const sagaMiddleware = createSagaMiddleware()

    const applyMiddlewares = compose(
        persistentStore(db),
        applyMiddleware(sagaMiddleware, thunk),
    )

    const store = createStore(rootReducer, undefined, applyMiddlewares)

    for (let saga in sagas) {
        sagaMiddleware.run(sagas[saga])
    }

    return store
}
