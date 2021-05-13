const electron = require('electron')

const { app, BrowserWindow } = require('electron')

function createWindow () {
  let win = new BrowserWindow({
    width: 1200,
    height: 800,
    title:'Snowflake Concurrency',
    webPreferences: {
      nodeIntegration: true
    }
  })
  win.maximize();
  // and load the index.html of the app.
  win.loadFile('./html/index.html')
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})








