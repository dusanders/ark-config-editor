
export interface IDownloadService {
  downloadIniFile(content: string, fileName?: string): void
}

export class DownloadService implements IDownloadService {

  downloadIniFile(content: string, fileName = 'config.ini'): void {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }
}
