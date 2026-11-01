'use strict';
const { contextBridge, ipcRenderer } = require('electron');
// Only narrow operations are available to the page. No filesystem, shell or Node access.
contextBridge.exposeInMainWorld('procatsDesktop', Object.freeze({
  bundledAssets: true,
  version: '1.7.3',
  createShortcut: () => ipcRenderer.invoke('procats:create-shortcut'),
  retryConnection: () => ipcRenderer.invoke('procats:retry-connection')
}));
