## WebMemex ##

A web browser that lets you save and organise the pages you visit.

Current project state: Embryonic. Play with it, do not rely on it.

### Idea ###

See [here](https://rwweb.org).

### Try out ###

1. Open [webmemex.org](https://webmemex.org) in a modern browser. At least Chromium (and its family) should work.
2. Tell us what you think!

### Build ###

1. Install [Node/NPM][Node].
2. Run `make`.
3. Open `main.html` in a modern browser.

### Code tour ###

The whole thing is just an HTML page/app itself, using `<iframe>`s to show the browsed web pages.
[React] is used for managing the DOM, [Redux] for managing the application state, [PouchDB] for persisting data in one's local storage.
Some familiarity with Redux and its concepts (reducers, actions, store) may be required to understand the code.

The code is designed somewhat modular, and could be seen as three repos in one: _top level_ (the 'app itself'), the _canvas_ module for the UI, and the _storage_ module for handling persisted data.

##### Top level app ([`src`](src))
* Sets up the app (see `main.html`, `main.jsx`): renders the canvas into the page, creates a Redux store (see `store.js`), connects the modules to the store (`reducer.js`).
* Specifies the more high level behaviour (see `actions.js`), practically meaning all the logic that involves both the UI and the storage and can thus not be put in either module.
* Its React components (`src/components/*`) specify how to display the 'documents' from the storage in the items on the canvas: the notes (`SimpleItem.jsx`), webpages (`IFrameItem.jsx`) and also the special empty item for navigating (`addUrlForm.jsx`).

##### Canvas UI ([`src/canvas`](src/canvas))
* Implements the user interface, a 2d 'canvas' (*not* related to the html `<canvas>` element) with any amount of items and possibly with edges between them.
* Handles the placement and positioning of items (`<div>`s), and enables (multitouch) interactions like dragging and resizing items.
* Knows nothing of an item's content, except its `docId` given by the top level app. It simply passes this `docId` to the configured component (`StemItem` in this app), so the top level app decides what to draw inside an item.

##### Storage ([`src/storage`](src/storage))
* Keeps a persistent collection of documents (currently just simple webmarks and text notes, e.g. `{url: 'https://rwweb.org'}`), and a collection links between them (simple `{sourceDocId, targetDocId}` pairs).
* Not to be confused with the Redux store (`src/store.js`), which manages the application state, and thus also contains the (non-persistent) canvas state.
* Storage is currently implemented as part of the redux store, using [`redux-pouchdb`](https://github.com/vicentedealencar/redux-pouchdb) for synchronising its state in Redux with a [PouchDB] database in the browser's offline storage.


[React]: https://facebook.github.io/react
[Redux]: http://redux.js.org
[PouchDB]: https://pouchdb.com/
[Node]: https://nodejs.org
