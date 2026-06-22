// Güvenli köprü (contextIsolation açık). Şimdilik sadece masaüstü olduğunu işaretler.
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('avukatimDesktop', {
  isDesktop: true,
  platform: process.platform,
  version: process.versions.electron,
})
