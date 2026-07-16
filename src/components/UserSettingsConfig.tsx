import { useEffect, useMemo, useState } from 'react'
import { getSettingInfo, userSettingsIniSettingsInfo } from '../services/IniSettingsInfo'

export interface UserSettingsConfigProps {
  userSettingsConfig: Record<string, string | number>
  onChange?: (config: Record<string, string | number>) => void
}

export function UserSettingsConfig({ userSettingsConfig, onChange }: UserSettingsConfigProps) {
  const [editableConfig, setEditableConfig] = useState<Record<string, string | number>>(userSettingsConfig)
  const [search, setSearch] = useState('')
  const [expandedInfoKeys, setExpandedInfoKeys] = useState<Record<string, boolean>>({})
  const [isSectionExpanded, setIsSectionExpanded] = useState(true)

  useEffect(() => {
    setEditableConfig(userSettingsConfig)
  }, [userSettingsConfig])

  const formatLabel = (key: string) => (key.includes('.') ? key.split('.').pop() ?? key : key)

  const entries = useMemo(() => {
    return Object.entries(editableConfig).filter(([key]) => {
      const displayLabel = formatLabel(key)
      return Boolean(getSettingInfo(displayLabel, userSettingsIniSettingsInfo))
    })
  }, [editableConfig])

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return entries
    }

    return entries.filter(([key, value]) => {
      const label = formatLabel(key).toLowerCase()
      const rawValue = String(value).toLowerCase()
      return label.includes(query) || rawValue.includes(query)
    })
  }, [entries, search])

  const handleChange = (key: string, value: string) => {
    const nextConfig = {
      ...editableConfig,
      [key]: value,
    }

    setEditableConfig(nextConfig)
    onChange?.(nextConfig)
  }

  const toggleInfo = (key: string) => {
    setExpandedInfoKeys((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  const renderValueControl = (key: string, value: string | number, settingInfo: ReturnType<typeof getSettingInfo> | undefined) => {
    if (settingInfo?.type === 'boolean') {
      return (
        <select
          value={String(value).toLowerCase() === 'true' ? 'True' : 'False'}
          onChange={(event) => handleChange(key, event.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30"
        >
          <option value="True">True</option>
          <option value="False">False</option>
        </select>
      )
    }

    return (
      <input
        type="text"
        value={String(value)}
        onChange={(event) => handleChange(key, event.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30"
      />
    )
  }

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-950/95 p-4 shadow-2xl shadow-black/30 backdrop-blur sm:p-6">
      <button
        type="button"
        onClick={() => setIsSectionExpanded((current) => !current)}
        className="mb-4 flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-left transition hover:border-violet-400/60"
      >
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Game User Settings</h2>
          <p className="text-sm text-slate-400">Edit user settings directly in the browser.</p>
        </div>
        <span className="text-sm font-medium text-violet-300">{isSectionExpanded ? 'Collapse' : 'Expand'}</span>
      </button>

      {isSectionExpanded && (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Settings</h3>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search values..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 sm:w-64"
              />
              <div className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-300">
                {filteredEntries.length} of {entries.length} values
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {filteredEntries.map(([key, value]) => {
              const displayLabel = formatLabel(key)
              const settingInfo = getSettingInfo(displayLabel, userSettingsIniSettingsInfo)
              const isInfoExpanded = Boolean(expandedInfoKeys[key])

              return (
                <div
                  key={key}
                  className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="break-all text-sm font-medium text-slate-300">{displayLabel}</span>
                    {settingInfo && (
                      <button
                        type="button"
                        onClick={() => toggleInfo(key)}
                        className="rounded-full border border-slate-700 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-400 transition hover:border-violet-400 hover:text-violet-300"
                      >
                        {isInfoExpanded ? 'Hide info' : 'Info'}
                      </button>
                    )}
                  </div>

                  {renderValueControl(key, value, settingInfo)}

                  {settingInfo && isInfoExpanded && (
                    <div className="rounded-lg border border-violet-500/20 bg-violet-500/10 p-3 text-sm text-slate-300">
                      <div className="font-medium text-violet-200">{settingInfo.description}</div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                        <span className="rounded-full bg-slate-900/80 px-2 py-1">Type: {settingInfo.type}</span>
                        <span className="rounded-full bg-slate-900/80 px-2 py-1">Default: {String(settingInfo.defaultValue)}</span>
                        <span className="rounded-full bg-slate-900/80 px-2 py-1">File: {settingInfo.sourceFile}</span>
                        {settingInfo.sourceSection && (
                          <span className="rounded-full bg-slate-900/80 px-2 py-1">Section: {settingInfo.sourceSection}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
