const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Pencereyi global tanımlıyoruz ki en alttaki kod ona dışarıdan erişebilsin
let win; 

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        // frame: true olması, Windows'un o klasik kapatma, büyütme ve küçültme tuşlarını getirir
        frame: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // index.html dosyanın adının tam olarak bu olduğundan emin ol
    win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    // Windows'ta tüm pencereler kapanınca uygulamayı tam kapat
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// --- SÜRE BİTİNCE EKRANI ZORLA ÖNE GETİRME KODU ---
ipcMain.on('focus-app', () => {
    if (win) {
        if (win.isMinimized()) win.restore();
        win.show();
        win.focus();
        win.setAlwaysOnTop(true);
        win.setAlwaysOnTop(false); // Zorla öne çektikten sonra normal haline bırakır
    }
});