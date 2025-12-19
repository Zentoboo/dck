import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import * as fs from 'fs'
import * as path from 'path'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('dialog:selectFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (result.canceled) {
      return null
    }
    return result.filePaths[0]
  })

  ipcMain.handle('fs:readMdFiles', async (_event, folderPath: string) => {
    try {
      const files = fs.readdirSync(folderPath)
      const mdFiles = files
        .filter(file => file.endsWith('.md'))
        .map(file => ({
          name: file,
          path: path.join(folderPath, file)
        }))
      return mdFiles
    } catch (error) {
      console.error('Error reading folder:', error)
      return []
    }
  })

  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      return content
    } catch (error) {
      console.error('Error reading file:', error)
      return ''
    }
  })

  ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
    try {
      fs.writeFileSync(filePath, content, 'utf-8')
      return true
    } catch (error) {
      console.error('Error writing file:', error)
      return false
    }
  })

  ipcMain.handle('fs:createFile', async (_event, folderPath: string, fileName: string) => {
    try {
      if (!fileName.endsWith('.md')) {
        fileName += '.md'
      }
      const filePath = path.join(folderPath, fileName)
      if (fs.existsSync(filePath)) {
        return { success: false, error: 'File already exists' }
      }
      fs.writeFileSync(filePath, '', 'utf-8')
      return { success: true, path: filePath }
    } catch (error) {
      console.error('Error creating file:', error)
      return { success: false, error: 'Failed to create file' }
    }
  })

  ipcMain.handle('fs:deleteFile', async (_event, filePath: string) => {
    try {
      fs.unlinkSync(filePath)
      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }
  })

  ipcMain.handle('flashcard:readFlashcardFile', async (_event, mdFilePath: string) => {
    try {
      const flashcardPath = mdFilePath.replace('.md', '.flashcard')
      console.log('Reading flashcard file:', flashcardPath)
      if (fs.existsSync(flashcardPath)) {
        const content = fs.readFileSync(flashcardPath, 'utf-8')
        const data = JSON.parse(content)
        console.log('  Found', data.cards?.length || 0, 'cards')
        return data
      }
      console.log('  File does not exist')
      return null
    } catch (error) {
      console.error('Error reading flashcard file:', error)
      return null
    }
  })

  ipcMain.handle('flashcard:writeFlashcardFile', async (_event, mdFilePath: string, data: any) => {
    try {
      const flashcardPath = mdFilePath.replace('.md', '.flashcard')
      console.log('Writing flashcard file:', flashcardPath, 'with', data.cards.length, 'cards')
      fs.writeFileSync(flashcardPath, JSON.stringify(data, null, 2), 'utf-8')
      console.log('Flashcard file written successfully')
      return true
    } catch (error) {
      console.error('Error writing flashcard file:', error)
      return false
    }
  })

  ipcMain.handle('flashcard:saveSession', async (_event, folderPath: string, filename: string, content: string) => {
    try {
      const sessionsDir = path.join(folderPath, '.sessions')
      if (!fs.existsSync(sessionsDir)) {
        fs.mkdirSync(sessionsDir, { recursive: true })
      }
      const sessionPath = path.join(sessionsDir, filename)
      fs.writeFileSync(sessionPath, content, 'utf-8')
      return { success: true, path: sessionPath }
    } catch (error) {
      console.error('Error saving session:', error)
      return { success: false, error: 'Failed to save session' }
    }
  })

  // NEW: Metrics Export - Select directory
  ipcMain.handle('metrics:selectExportDirectory', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Select Export Location',
        properties: ['openDirectory', 'createDirectory'],
        buttonLabel: 'Select Folder'
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true }
      }

      return { success: true, path: result.filePaths[0] }
    } catch (error) {
      console.error('Error selecting directory:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // NEW: Metrics Export - Save CSV file
  ipcMain.handle('metrics:saveCsvFile', async (_event, dirPath: string, content: string, filename: string) => {
    try {
      const csvPath = path.join(dirPath, filename)
      fs.writeFileSync(csvPath, content, 'utf-8')
      console.log('CSV file saved:', csvPath)
      return { success: true, path: csvPath }
    } catch (error) {
      console.error('Error saving CSV file:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})