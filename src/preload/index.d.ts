import { ElectronAPI } from '@electron-toolkit/preload'

interface FileItem {
  name: string
  path: string
}

interface CreateFileResult {
  success: boolean
  path?: string
  error?: string
}

interface ExportDirectoryResult {
  success: boolean
  path?: string
  canceled?: boolean
  error?: string
}

interface FlashcardData {
  front: string;
  back: string;
  id?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface API {
  selectFolder: () => Promise<string | null>
  readMdFiles: (folderPath: string) => Promise<FileItem[]>
  readFile: (filePath: string) => Promise<string>
  writeFile: (filePath: string, content: string) => Promise<boolean>
  createFile: (folderPath: string, fileName: string) => Promise<CreateFileResult>
  deleteFile: (filePath: string) => Promise<boolean>
  readFlashcardFile: (mdFilePath: string) => Promise<FlashcardData>
  writeFlashcardFile: (mdFilePath: string, data: FlashcardData) => Promise<boolean>
  saveSession: (folderPath: string, filename: string, content: string) => Promise<CreateFileResult>
  selectExportDirectory: () => Promise<ExportDirectoryResult>
  saveCsvFile: (dirPath: string, content: string, filename: string) => Promise<CreateFileResult>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}