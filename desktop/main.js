const { app, BrowserWindow, session } = require('electron');
const path = require('path');
function create() {
  const win = new BrowserWindow({ width: 960, height: 540, resizable: true, autoHideMenuBar: true,
    title: 'Coin Hopper', icon: path.join(__dirname, 'icon.png'), webPreferences: { contextIsolation: true, nodeIntegration: false } });
  win.setMenu(null);
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', e => e.preventDefault());
  win.loadFile(path.join(__dirname, 'index.html'));
}
app.whenReady().then(() => {
  session.defaultSession.webRequest.onBeforeRequest((d, cb) => cb({ cancel: !/^(file|devtools|data|blob):/.test(d.url) }));
  create();
});
app.on('window-all-closed', () => app.quit());
