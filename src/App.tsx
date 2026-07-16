import { useState } from 'react'
import gameExampleIni from './assets/Game.ini?raw'
import userSettingsExampleIni from './assets/GameUserSettings.ini?raw'
import { UploadService } from './services/UploadService'
import { DownloadService } from './services/DownloadService'
import { GameConfig } from './components/GameConfig'
import { SpawnReplacer } from './components/SpawnReplacer'
import { DifficultyOverrideHelper } from './components/DifficultyOverrideHelper'
import { UserSettingsConfig } from './components/UserSettingsConfig'
import { Footer } from './components/Footer'
import type { INISection } from './services/UploadService'

interface INiFile {
  url: string
  sections: INISection[]
  valuesBySection: Record<string, Record<string, string>>
  rawContent: string
}

function App() {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [gameIni, setGameIni] = useState<INiFile | null>(null);
  const [userSettingsIni, setUserSettingsIni] = useState<INiFile | null>(null);
  const [gameFileName, setGameFileName] = useState<string>('');
  const [userSettingsFileName, setUserSettingsFileName] = useState<string>('');
  const [editableGameConfig, setEditableGameConfig] = useState<Record<string, string | number>>({})
  const [editableUserSettingsConfig, setEditableUserSettingsConfig] = useState<Record<string, string | number>>({})
  const uploadService = new UploadService();
  const downloadService = new DownloadService()

  const flattenIniSections = (sections: INISection[]) =>
    Object.fromEntries(
      sections.flatMap((section) =>
        Object.entries(section.values).map(([key, value]) => [`${section.name}.${key}`, value])
      )
    )

  const handleUploadIni = async (type: 'game' | 'userSettings', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError(null)

    try {
      const result = await uploadService.uploadIniFile(file);
      console.log('INI file uploaded:', result)
      if(type === 'game') {
        const nextIni = {
          url: result.url || '',
          sections: result.sections,
          valuesBySection: result.valuesBySection,
          rawContent: result.rawContent || result.content || ''
        }

        setGameIni(nextIni)
        setGameFileName(file.name)
        setEditableGameConfig(flattenIniSections(nextIni.sections))
      } else if(type === 'userSettings') {
        const nextIni = {
          url: result.url || '',
          sections: result.sections,
          valuesBySection: result.valuesBySection,
          rawContent: result.rawContent || result.content || ''
        }

        setUserSettingsIni(nextIni)
        setUserSettingsFileName(file.name)
        setEditableUserSettingsConfig(flattenIniSections(nextIni.sections))
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleConfigChange = (nextConfig: Record<string, string | number>) => {
    setEditableGameConfig(nextConfig)

    setGameIni((current) => {
      if (!current) return current

      const updatedSections = current.sections.map((section) => {
        const nextEntries = section.entries.map((entry) => {
          const fullKey = `${section.name}.${entry.key}`
          const updatedValue = entry.key ? nextConfig[fullKey] : undefined

          return updatedValue === undefined
            ? entry
            : { ...entry, value: String(updatedValue) }
        })

        return {
          ...section,
          entries: nextEntries,
          values: Object.fromEntries(nextEntries.filter((entry) => entry.key).map((entry) => [entry.key, entry.value]))
        }
      })

      const valuesBySection = Object.fromEntries(
        updatedSections.map((section) => [section.name, section.values])
      )

      const serialized = uploadService.serializeIni({
        sections: updatedSections,
        valuesBySection,
        rawContent: current.rawContent,
      })

      return {
        ...current,
        sections: updatedSections,
        valuesBySection,
        rawContent: serialized,
      }
    })
  }

  const buildDefaultIni = (type: 'game' | 'userSettings'): INiFile => {
    const parsed = uploadService.parse(type === 'game' ? gameExampleIni : userSettingsExampleIni)

    return {
      url: '',
      sections: parsed.sections,
      valuesBySection: parsed.valuesBySection,
      rawContent: parsed.rawContent || parsed.content || '',
    }
  }

  const handleCreateDefaultIni = (type: 'game' | 'userSettings') => {
    const nextIni = buildDefaultIni(type)

    if (type === 'game') {
      setGameIni(nextIni)
      setGameFileName('Game.ini')
      setEditableGameConfig(flattenIniSections(nextIni.sections))
    } else {
      setUserSettingsIni(nextIni)
      setUserSettingsFileName('GameUserSettings.ini')
      setEditableUserSettingsConfig(flattenIniSections(nextIni.sections))
    }
  }

  const handleDownload = async () => {
    if (!gameIni) return

    downloadService.downloadIniFile(gameIni.rawContent, 'Game.ini')
  }

  const handleAddSpawnReplacerToConfig = (snippet: string) => {
    const parsedValue = snippet.replace(/^NPCReplacements=/, '').trim()
    const existingReplacementCount = Object.keys(editableGameConfig).filter((key) =>
      key.startsWith('ServerSettings.NPCReplacements')
    ).length
    const configKey = existingReplacementCount === 0
      ? 'ServerSettings.NPCReplacements'
      : `ServerSettings.NPCReplacements[${existingReplacementCount}]`

    setEditableGameConfig((current) => ({
      ...current,
      [configKey]: parsedValue,
    }))

    setGameIni((current) => {
      if (!current) return current

      const nextSections = current.sections.map((section) => ({
        ...section,
        entries: [...section.entries],
        values: { ...section.values },
      }))
      let targetSection = nextSections.find((section) => section.name === 'ServerSettings')

      if (!targetSection) {
        targetSection = {
          name: 'ServerSettings',
          entries: [],
          values: {},
        }
        nextSections.push(targetSection)
      }

      targetSection.entries = [
        ...targetSection.entries,
        {
          key: 'NPCReplacements',
          value: parsedValue,
          rawLine: snippet,
          lineNumber: targetSection.entries.length + 1,
        },
      ]
      targetSection.values = {
        ...targetSection.values,
        [`NPCReplacements${existingReplacementCount > 0 ? `[${existingReplacementCount}]` : ''}`]: parsedValue,
      }

      const valuesBySection = Object.fromEntries(nextSections.map((section) => [section.name, section.values]))
      const serialized = uploadService.serializeIni({
        sections: nextSections,
        valuesBySection,
        rawContent: current.rawContent,
      })

      return {
        ...current,
        sections: nextSections,
        valuesBySection,
        rawContent: serialized,
      }
    })
  }

  const handleApplyDifficultyOverride = (nextConfig: Record<string, string | number>) => {
    setEditableUserSettingsConfig((current) => ({
      ...current,
      ...nextConfig,
    }))

    setUserSettingsIni((current) => {
      if (!current) return current

      const nextSections = current.sections.map((section) => {
        const entryUpdates = Object.entries(nextConfig)
          .map(([fullKey, value]) => {
            const [sectionName, key] = fullKey.split('.')
            if (section.name !== sectionName || !key) {
              return null
            }

            return {
              key,
              value: String(value),
            }
          })
          .filter(Boolean) as Array<{ key: string; value: string }>

        if (entryUpdates.length === 0) {
          return section
        }

        const nextEntries = section.entries.map((entry) => {
          const matchingUpdate = entryUpdates.find((update) => update.key === entry.key)
          return matchingUpdate ? { ...entry, value: matchingUpdate.value } : entry
        })

        return {
          ...section,
          entries: nextEntries,
          values: Object.fromEntries(nextEntries.filter((entry) => entry.key).map((entry) => [entry.key, entry.value])),
        }
      })

      const valuesBySection = Object.fromEntries(nextSections.map((section) => [section.name, section.values]))
      const serialized = uploadService.serializeIni({
        sections: nextSections,
        valuesBySection,
        rawContent: current.rawContent,
      })

      return {
        ...current,
        sections: nextSections,
        valuesBySection,
        rawContent: serialized,
      }
    })
  }

  const handleUserSettingsChange = (nextConfig: Record<string, string | number>) => {
    setEditableUserSettingsConfig(nextConfig)

    setUserSettingsIni((current) => {
      if (!current) return current

      const updatedSections = current.sections.map((section) => {
        const nextEntries = section.entries.map((entry) => {
          const fullKey = `${section.name}.${entry.key}`
          const updatedValue = entry.key ? nextConfig[fullKey] : undefined

          return updatedValue === undefined
            ? entry
            : { ...entry, value: String(updatedValue) }
        })

        return {
          ...section,
          entries: nextEntries,
          values: Object.fromEntries(nextEntries.filter((entry) => entry.key).map((entry) => [entry.key, entry.value]))
        }
      })

      const valuesBySection = Object.fromEntries(
        updatedSections.map((section) => [section.name, section.values])
      )

      const serialized = uploadService.serializeIni({
        sections: updatedSections,
        valuesBySection,
        rawContent: current.rawContent,
      })

      return {
        ...current,
        sections: updatedSections,
        valuesBySection,
        rawContent: serialized,
      }
    })
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.18),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#0f172a_100%)] text-slate-100">
      <main className="mx-auto flex w-full max-w-[1800px] flex-col gap-6 px-3 py-3 sm:px-6 lg:px-8 lg:py-6 xl:px-10 xl:py-8">
        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/95 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8 xl:grid-cols-2 xl:gap-10 xl:p-10">
            <div className="flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-200">
                  ARK Server Config Editor
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
                    Upload, review, and edit your ARK: Survival Ascended INI files in one place.
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-slate-400">
                    Keep your Game.ini and GameUserSettings.ini data organized in a polished editor built for ARK: Survival Ascended, and keep everything fully client-side.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                  <div className="text-sm font-semibold text-slate-200">Client-side</div>
                  <div className="mt-1 text-sm text-slate-400">No backend uploads required for ASA configs.</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                  <div className="text-sm font-semibold text-slate-200">Live edits</div>
                  <div className="mt-1 text-sm text-slate-400">Update ASA values and download instantly.</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                  <div className="text-sm font-semibold text-slate-200">Metadata-aware</div>
                  <div className="mt-1 text-sm text-slate-400">Helpful ASA-specific context for each setting.</div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-inner shadow-black/20 sm:p-5 xl:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">Upload INI files</h2>
                  <p className="text-sm text-slate-400">Use the browser to load each config and start editing.</p>
                </div>
                {uploading && (
                  <div className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-200">
                    Loading...
                  </div>
                )}
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Game.ini</h3>
                      <p className="mt-1 text-sm text-slate-400">Upload the server gameplay config.</p>
                    </div>
                    {gameIni && (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                        Ready
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".ini"
                    onChange={(event) => handleUploadIni('game', event)}
                    disabled={uploading}
                    className="mt-4 block w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 file:mr-3 file:rounded-full file:border-0 file:bg-violet-500/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-violet-200 hover:border-violet-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => handleCreateDefaultIni('game')}
                    className="mt-3 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:border-violet-400 hover:text-violet-100"
                  >
                    Start with default Game.ini
                  </button>
                  {gameIni && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-3 text-sm text-slate-400">
                      <div>
                        <div className="font-medium text-slate-200">{gameFileName || 'Game.ini'}</div>
                        <div className="mt-1">{gameIni.sections.length} sections</div>
                      </div>
                      <button
                        type="button"
                        className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 font-medium text-violet-200 transition hover:border-violet-400 hover:bg-violet-500/20"
                        onClick={handleDownload}
                      >
                        Download
                      </button>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">GameUserSettings.ini</h3>
                      <p className="mt-1 text-sm text-slate-400">Upload the user-specific settings config.</p>
                    </div>
                    {userSettingsIni && (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                        Ready
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".ini"
                    onChange={(event) => handleUploadIni('userSettings', event)}
                    disabled={uploading}
                    className="mt-4 block w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 file:mr-3 file:rounded-full file:border-0 file:bg-violet-500/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-violet-200 hover:border-violet-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => handleCreateDefaultIni('userSettings')}
                    className="mt-3 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:border-violet-400 hover:text-violet-100"
                  >
                    Start with default GameUserSettings.ini
                  </button>
                  {userSettingsIni && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-3 text-sm text-slate-400">
                      <div>
                        <div className="font-medium text-slate-200">{userSettingsFileName || 'GameUserSettings.ini'}</div>
                        <div className="mt-1">{userSettingsIni.sections.length} sections</div>
                      </div>
                      <button
                        type="button"
                        className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 font-medium text-violet-200 transition hover:border-violet-400 hover:bg-violet-500/20"
                        onClick={() => downloadService.downloadIniFile(userSettingsIni.rawContent, 'GameUserSettings.ini')}
                      >
                        Download
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {uploadError && (
                <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-3 text-sm text-rose-200">
                  {uploadError}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="col-span-full">
            <div className="h-1 w-full rounded-full bg-gradient-to-r from-violet-500/0 via-violet-500/60 to-violet-500/0" />
          </div>
          <div className="min-w-0 w-full">
            {gameIni ? (
              <GameConfig gameConfig={editableGameConfig} onChange={handleConfigChange} />
            ) : (
              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl shadow-black/20">
                <h2 className="text-xl font-semibold text-slate-100">Game.ini editor</h2>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  Upload your Game.ini file to edit the gameplay, progression, and server rules values here.
                </p>
              </div>
            )}
          </div>

          <div className="min-w-0 w-full">
            {userSettingsIni ? (
              <UserSettingsConfig userSettingsConfig={editableUserSettingsConfig} onChange={handleUserSettingsChange} />
            ) : (
              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl shadow-black/20">
                <h2 className="text-xl font-semibold text-slate-100">GameUserSettings.ini editor</h2>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  Upload your GameUserSettings.ini file to edit the user-facing server settings here.
                </p>
              </div>
            )}
          </div>

          <div className="col-span-full space-y-4">
            <SpawnReplacer gameConfig={editableGameConfig} onAddToConfig={handleAddSpawnReplacerToConfig} />
            <DifficultyOverrideHelper onApply={handleApplyDifficultyOverride} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default App
