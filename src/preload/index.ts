import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  readMdFiles: (folderPath: string) => ipcRenderer.invoke('fs:readMdFiles', folderPath),
  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:writeFile', filePath, content),
  createFile: (folderPath: string, fileName: string) => ipcRenderer.invoke('fs:createFile', folderPath, fileName),
  deleteFile: (filePath: string) => ipcRenderer.invoke('fs:deleteFile', filePath),
  readFlashcardFile: (mdFilePath: string) => ipcRenderer.invoke('flashcard:readFlashcardFile', mdFilePath),
  writeFlashcardFile: (mdFilePath: string, data: any) => ipcRenderer.invoke('flashcard:writeFlashcardFile', mdFilePath, data),
  saveSession: (folderPath: string, filename: string, content: string) => ipcRenderer.invoke('flashcard:saveSession', folderPath, filename, content),
  selectExportDirectory: () => ipcRenderer.invoke('metrics:selectExportDirectory'),
  saveCsvFile: (dirPath: string, content: string, filename: string) => ipcRenderer.invoke('metrics:saveCsvFile', dirPath, content, filename)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}