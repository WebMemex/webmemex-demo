// Functions for manual storage backup and restoration
function dumpStorage({asFile=true}={}) {
    let dump = JSON.stringify(store.getState().storage, null, 2)
    if (asFile) {
        const dataUrl = "data:text/json;charset=utf-8," + window.escape(dump)
        var link = document.createElement("a")
        link.download = 'webmemex-backup.json'
        link.href = dataUrl
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }
    else {
        return dump
    }
}
function importFromDump({storageDump, deleteCurrent=false}={}) {
    if (storageDump === undefined)
        storageDump = prompt('Paste your JSON storage dump here (obtained from dumpStorage())')
    if (typeof storageDump === 'string') {
        if (storageDump === '') {
            storageDump = '{"docs": {}, "links": {}}'
        }
        storageDump = JSON.parse(storageDump)
    }

    let docCount = Object.keys(storageDump.docs).length
    let message = deleteCurrent
        ? 'Delete all, then import ' + docCount + ' docs?'
        : 'Load ' + docCount + ' docs?'
    if (confirm(message)) {
        store.dispatch(storage.importFromDump({storageDump, deleteCurrent}))
    }
}
function deleteAllDocs() {
    const cleanState = {docs: {}, links: {}}
    importFromDump({storageDump: cleanState, deleteCurrent: true})
}
window.dumpStorage = dumpStorage
window.importFromDump = importFromDump
window.deleteAllDocs = deleteAllDocs
