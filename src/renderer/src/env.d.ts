/// <reference types="vite/client" />

interface FileItem {
  name: string
  path: string
}

interface CreateFileResult {
  success: boolean
  path?: string
  error?: string
}

interface API {
  selectFolder: () => Promise<string | null>
  readMdFiles: (folderPath: string) => Promise<FileItem[]>
  readFile: (filePath: string) => Promise<string>
  writeFile: (filePath: string, content: string) => Promise<boolean>
  createFile: (folderPath: string, fileName: string) => Promise<CreateFileResult>
  deleteFile: (filePath: string) => Promise<boolean>
  readFlashcardFile: (mdFilePath: string) => Promise<any>
  writeFlashcardFile: (mdFilePath: string, data: any) => Promise<boolean>
  saveSession: (folderPath: string, filename: string, content: string) => Promise<CreateFileResult>
}

declare global {
  interface Window {
    api: API
  }
}

export {}