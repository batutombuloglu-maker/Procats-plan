'use strict';
const { app, BrowserWindow, Menu, ipcMain, shell, dialog, screen, net, session } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { createAssetHandler } = require('./asset-server.cjs');
const { APP_URL, isAppUrl, isExternalUrl, isAppBlob, allowPermission, allowFramePermission, safeDownloadName } = require('./security.cjs');
const CONNECTION_PAGE = pathToFileURL(path.join(__dirname, 'connection.html')).href;
const WINDOW_ICON = path.join(__dirname, 'assets', 'icon.ico');
app.setName('Procats');
app.setAppUserModelId('com.procats.study.windows');
// An isolated profile is only used by automated tests; normal users keep %APPDATA%\Procats.
if (process.env.PROCATS_QA_USER_DATA && process.env.PROCATS_QA_MODE === '1') {
  app.setPath('userData', path.resolve(process.env.PROCATS_QA_USER_DATA));
}
let mainWindow;
let saveBoundsTimer;
const boundsFile = () => path.join(app.getPath('userData'), 'window.json');
function readBounds() {
  try {
    const raw = JSON.parse(fs.readFileSync(boundsFile(), 'utf8'));
    const width = Number.isFinite(raw.width) ? Math.max(760, Math.min(raw.width, 2560)) : 1280;
    const height = Number.isFinite(raw.height) ? Math.max(540, Math.min(raw.height, 1800)) : 860;
    const rect = { x: raw.x, y: raw.y, width, height };
    const visible = Number.isFinite(raw.x) && Number.isFinite(raw.y) && screen.getAllDisplays().some(({workArea}) =>
      rect.x + rect.width > workArea.x + 100 && rect.x < workArea.x + workArea.width - 100 &&
      rect.y + rect.height > workArea.y + 60 && rect.y < workArea.y + workArea.height - 60);
    return { width, height, ...(visible ? {x: raw.x, y: raw.y} : {}), maximized: raw.maximized === true };
  } catch { return { width: 1280, height: 860, maximized: false }; }
}
function saveBounds() {
  if (!mainWindow || mainWindow.isDestroyed() || mainWindow.isMinimized()) return;
  try {
    fs.mkdirSync(app.getPath('userData'), {recursive: true});
    fs.writeFileSync(boundsFile(), JSON.stringify({...mainWindow.getNormalBounds(), maximized: mainWindow.isMaximized()}));
  } catch { /* Window sizing must not block the application. */ }
}
function validSender(event, kind) {
  if (!mainWindow || event.sender !== mainWindow.webContents || event.senderFrame !== mainWindow.webContents.mainFrame) return false;
  return kind === 'connection' ? event.senderFrame.url === CONNECTION_PAGE : isAppUrl(event.senderFrame.url);
}
async function openExternal(value) {
  if (!isExternalUrl(value)) return;
  try { await shell.openExternal(value); } catch {
    if (mainWindow && !mainWindow.isDestroyed()) await dialog.showMessageBox(mainWindow, {type: 'info', title: 'Procats', message: 'Bağlantı açılamadı.', detail: 'Varsayılan tarayıcı ayarını kontrol edip tekrar deneyebilirsin.'});
  }
}
async function loadProcats() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try { await mainWindow.loadURL(APP_URL); } catch {
    if (mainWindow && !mainWindow.isDestroyed()) await mainWindow.loadFile(path.join(__dirname, 'connection.html')).catch(() => {});
  }
}
function createWindow() {
  const saved = readBounds();
  mainWindow = new BrowserWindow({
    ...saved, minWidth: 760, minHeight: 540, show: false,
    title: 'Procats', icon: WINDOW_ICON, backgroundColor: '#121214',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false, nodeIntegrationInWorker: false, nodeIntegrationInSubFrames: false,
      contextIsolation: true, sandbox: true, webSecurity: true,
      allowRunningInsecureContent: false, webviewTag: false, navigateOnDragDrop: false,
      backgroundThrottling: false, spellcheck: false
    }
  });
  const contents = mainWindow.webContents;
  mainWindow.setMenu(null);
  if (saved.maximized) mainWindow.maximize();
  mainWindow.once('ready-to-show', () => mainWindow.show());
  // The first launch always shows a window, including slow-network failures.
  const showTimer = setTimeout(() => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.show(); }, 4000);
  showTimer.unref();
  contents.on('page-title-updated', event => { event.preventDefault(); mainWindow.setTitle('Procats'); });
  contents.on('will-attach-webview', event => event.preventDefault());
  contents.on('will-navigate', (event, url) => {
    if (isAppUrl(url) || url === CONNECTION_PAGE) return;
    event.preventDefault();
    if (isAppUrl(contents.getURL())) void openExternal(url);
  });
  contents.on('will-redirect', (event, url) => {
    if (!isAppUrl(url) && url !== CONNECTION_PAGE) event.preventDefault();
  });
  contents.setWindowOpenHandler(({url}) => {
    if (isAppUrl(contents.getURL())) void openExternal(url);
    return {action: 'deny'};
  });
  const session = contents.session;
  session.setPermissionRequestHandler((wc, permission, callback, details) => {
    callback(wc === contents && details.isMainFrame === true && allowPermission(permission, details.requestingUrl || wc.getURL()));
  });
  session.setPermissionCheckHandler((wc, permission, requestingOrigin, details) =>
    wc === contents && allowFramePermission(permission, requestingOrigin, details));
  session.on('will-download', (event, item, wc) => {
    const name = safeDownloadName(item.getFilename());
    const chain = item.getURLChain();
    const permitted = wc === contents && isAppUrl(contents.getURL()) && name &&
      chain.length > 0 && chain.every(url => isAppUrl(url) || isAppBlob(url));
    if (!permitted) { event.preventDefault(); return; }
    item.setSaveDialogOptions({
      title: 'Procats dosyasını kaydet', defaultPath: path.join(app.getPath('downloads'), name),
      buttonLabel: 'Kaydet'
    });
  });
  // Keep the page's protection against closing before its local save has finished.
  contents.on('will-prevent-unload', event => {
    const result = dialog.showMessageBoxSync(mainWindow, {
      type: 'warning', title: 'Procats', message: 'Değişiklikler henüz bu cihaza kaydedilmedi.',
      detail: 'Kayıt işleminin bitmesini beklemek için pencereyi açık tutabilirsin.',
      buttons: ['Pencereyi açık tut', 'Yine de kapat'], defaultId: 0, cancelId: 0, noLink: true
    });
    if (result === 1) event.preventDefault();
  });
  contents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { event.preventDefault(); mainWindow.setFullScreen(!mainWindow.isFullScreen()); }
    if (input.key === 'F5' || (input.control && input.key.toLowerCase() === 'r')) {
      event.preventDefault();
      if (contents.getURL() === CONNECTION_PAGE) void loadProcats(); else contents.reload();
    }
  });
  contents.on('render-process-gone', () => {
    if (!mainWindow.isDestroyed()) void mainWindow.loadFile(path.join(__dirname, 'connection.html')).catch(() => {});
  });
  for (const event of ['resize', 'move', 'maximize', 'unmaximize']) mainWindow.on(event, () => {
    clearTimeout(saveBoundsTimer); saveBoundsTimer = setTimeout(saveBounds, 300);
  });
  mainWindow.on('close', saveBounds);
  mainWindow.on('closed', () => { clearTimeout(saveBoundsTimer); mainWindow = null; });
  void loadProcats();
}
ipcMain.handle('procats:create-shortcut', event => {
  if (!validSender(event, 'app')) throw new Error('Unauthorized request');
  if (!app.isPackaged) throw new Error('Shortcut requires a packaged application');
  const portablePath = process.env.PORTABLE_EXECUTABLE_FILE;
  const executable = portablePath && path.isAbsolute(portablePath) && portablePath.toLowerCase().endsWith('.exe') && fs.existsSync(portablePath) ? portablePath : process.execPath;
  const created = shell.writeShortcutLink(path.join(app.getPath('desktop'), 'Procats.lnk'), 'create', {
    target: executable, cwd: path.dirname(executable),
    icon: executable, iconIndex: 0, description: 'Procats', appUserModelId: 'com.procats.study.windows'
  });
  if (!created) throw new Error('Shortcut could not be created');
  return true;
});
ipcMain.handle('procats:retry-connection', async event => {
  if (!validSender(event, 'connection')) throw new Error('Unauthorized request');
  await loadProcats(); return true;
});
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.show(); mainWindow.focus(); } });
  app.whenReady().then(async () => {
    const ses=session.defaultSession;
    // Remove only public web caches/workers from the old online shell. Keep accounts and records.
    await ses.clearStorageData({origin: new URL(APP_URL).origin, storages:['serviceworkers','cachestorage']});
    ses.protocol.handle('https',createAssetHandler({root:path.join(__dirname,'www'),origin:new URL(APP_URL).origin,forward:request=>net.fetch(request,{bypassCustomProtocolHandlers:true})}));
    Menu.setApplicationMenu(null);createWindow();
  });
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  app.on('window-all-closed', () => app.quit());
}
