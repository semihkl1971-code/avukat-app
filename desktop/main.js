const { app, BrowserWindow, shell, Menu, dialog } = require('electron')
const path = require('path')

// Canlı uygulama adresi — masaüstü programı bunu sarar.
// (İleride kendi domainin bağlanınca burayı güncelle: https://getavukatim.com)
const APP_URL = process.env.AVUKATIM_URL || 'https://avukat-web-avukat1.vercel.app'

// Aynı anda tek pencere
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 640,
    title: 'Avukatım',
    backgroundColor: '#05060b',
    icon: path.join(__dirname, 'build', 'icon.png'),
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  })

  // Pencere içeriği hazır olunca göster (beyaz parlama olmasın)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.loadURL(APP_URL)

  // Yükleme hatası (internet yok vb.) → bilgilendir
  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    if (code === -3) return // kullanıcı iptali, yok say
    dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'Bağlantı sorunu',
      message: 'Avukatım sunucusuna ulaşılamadı.',
      detail: `İnternet bağlantınızı kontrol edip tekrar deneyin.\n\n(${desc} — ${url})`,
      buttons: ['Tekrar Dene', 'Kapat'],
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) mainWindow.loadURL(APP_URL)
    })
  })

  // Dış bağlantıları (farklı site, mailto, whatsapp, app store) varsayılan tarayıcıda aç
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Uygulama dışı adrese gitmeye çalışırsa tarayıcıda aç, pencerede tutma
  mainWindow.webContents.on('will-navigate', (event, url) => {
    try {
      const target = new URL(url)
      const base = new URL(APP_URL)
      if (target.host !== base.host) {
        event.preventDefault()
        shell.openExternal(url)
      }
    } catch {
      /* yoksay */
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Sade Türkçe menü
function buildMenu() {
  const template = [
    {
      label: 'Avukatım',
      submenu: [
        { label: 'Ana Sayfaya Dön', accelerator: 'CmdOrCtrl+Home', click: () => mainWindow && mainWindow.loadURL(APP_URL) },
        { label: 'Yenile', accelerator: 'CmdOrCtrl+R', click: () => mainWindow && mainWindow.reload() },
        { type: 'separator' },
        { role: 'quit', label: 'Çıkış' },
      ],
    },
    {
      label: 'Düzen',
      submenu: [
        { role: 'undo', label: 'Geri Al' },
        { role: 'redo', label: 'Yinele' },
        { type: 'separator' },
        { role: 'cut', label: 'Kes' },
        { role: 'copy', label: 'Kopyala' },
        { role: 'paste', label: 'Yapıştır' },
        { role: 'selectAll', label: 'Tümünü Seç' },
      ],
    },
    {
      label: 'Görünüm',
      submenu: [
        { role: 'zoomIn', label: 'Yakınlaştır' },
        { role: 'zoomOut', label: 'Uzaklaştır' },
        { role: 'resetZoom', label: 'Normal Boyut' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tam Ekran' },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.whenReady().then(() => {
  buildMenu()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
