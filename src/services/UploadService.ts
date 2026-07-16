
export interface INIEntry {
  key: string
  value: string
  rawLine: string
  lineNumber: number
}

export interface INISection {
  name: string
  entries: INIEntry[]
  values: Record<string, string>
}

export interface INIParseResult {
  url?: string
  content?: string
  sections: INISection[]
  valuesBySection: Record<string, Record<string, string>>
  rawContent?: string
}

export interface INIParser {
  parse(content: string): INIParseResult
  serializeIni(parsed: INIParseResult): string
}

export class UploadService {
  async fileUpload(file: File): Promise<string> {
    return URL.createObjectURL(file)
  }

  async uploadIniFile(file: File): Promise<INIParseResult> {
    if (!file.name.toLowerCase().endsWith('.ini')) {
      throw new Error('Only .ini files are allowed')
    }

    const fileContent = await file.text()
    return {
      url: URL.createObjectURL(file),
      ...this.parseIni(fileContent)
    }
  }

  parse(content: string): INIParseResult {
    return this.parseIni(content)
  }

  serializeIni(parsed: INIParseResult): string {
    return parsed.sections
      .map((section) => {
        const lines = [`[${section.name}]`]

        section.entries.forEach((entry) => {
          if (entry.key) {
            lines.push(`${entry.key}=${entry.value}`)
          } else {
            lines.push(entry.rawLine)
          }
        })

        return lines.join('\n')
      })
      .join('\n\n')
  }

  private parseIni(content: string): INIParseResult {
    const sections: INISection[] = []
    const valuesBySection: Record<string, Record<string, string>> = {}
    let currentSection: INISection | null = null

    const lines = content.split(/\r?\n/)

    lines.forEach((line, index) => {
      const trimmed = line.trim()

      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) {
        return
      }

      const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/)
      if (sectionMatch) {
        currentSection = {
          name: sectionMatch[1],
          entries: [],
          values: {}
        }
        sections.push(currentSection)
        valuesBySection[currentSection.name] = currentSection.values
        return
      }

      if (!currentSection) {
        currentSection = {
          name: 'GLOBAL',
          entries: [],
          values: {}
        }
        sections.push(currentSection)
        valuesBySection[currentSection.name] = currentSection.values
      }

      const separatorIndex = line.indexOf('=')
      if (separatorIndex > -1) {
        const key = line.slice(0, separatorIndex).trim()
        const value = line.slice(separatorIndex + 1).trim()

        currentSection.entries.push({
          key,
          value,
          rawLine: line,
          lineNumber: index + 1
        })
        currentSection.values[key] = value
      } else {
        currentSection.entries.push({
          key: '',
          value: '',
          rawLine: line,
          lineNumber: index + 1
        })
      }
    })

    return {
      sections,
      valuesBySection,
      rawContent: content
    }
  }
}