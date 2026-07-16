
import { useEffect, useMemo, useState } from 'react'
import { gameIniSettingsInfo, getSettingInfo } from '../services/IniSettingsInfo'

export interface GameConfigProps {
  gameConfig: Record<string, string | number>
  onChange?: (config: Record<string, string | number>) => void
}

export function GameConfig({ gameConfig, onChange }: GameConfigProps) {
  const [editableConfig, setEditableConfig] = useState<Record<string, string | number>>(gameConfig)
  const [search, setSearch] = useState('')
  const [expandedInfoKeys, setExpandedInfoKeys] = useState<Record<string, boolean>>({})
  const [expandedPerLevelGroups, setExpandedPerLevelGroups] = useState<Record<string, boolean>>({
    tamed: false,
    wild: false,
    player: false,
  })
  const [isSectionExpanded, setIsSectionExpanded] = useState(true)

  useEffect(() => {
    setEditableConfig(gameConfig)
  }, [gameConfig])

  const formatLabel = (key: string) => key.includes('.') ? key.split('.').pop() ?? key : key

  const getNormalizedSettingKey = (key: string) => formatLabel(key).replace(/\[\d+\]$/, '')

  const getPerLevelIndex = (key: string) => {
    const match = key.match(/\[(\d+)\]$/)
    return match ? Number(match[1]) : null
  }

  const getPerLevelStatName = (key: string) => {
    const normalizedKey = getNormalizedSettingKey(key)
    const index = getPerLevelIndex(key)

    if (index === null) {
      return null
    }

    const statNames = normalizedKey.startsWith('PerLevelStatsMultiplier_Player')
      ? ['Health', 'Stamina', 'Torpidity', 'Oxygen', 'Food', 'Water', 'Temperature', 'Weight', 'Melee Damage', 'Speed', 'Fortitude']
      : normalizedKey.startsWith('PerLevelStatsMultiplier_DinoTamed') || normalizedKey.startsWith('PerLevelStatsMultiplier_DinoWild')
        ? ['Health', 'Stamina', 'Torpidity', 'Oxygen', 'Food', 'Water', 'Temperature', 'Weight', 'Melee Damage', 'Speed', 'Fortitude']
        : null

    return statNames?.[index] ?? null
  }

  const getPerLevelDisplayLabel = (key: string) => {
    const statName = getPerLevelStatName(key)
    const normalizedKey = getNormalizedSettingKey(key)

    if (normalizedKey.endsWith('_Add')) {
      return `${statName ?? formatLabel(key)} · Additive`
    }

    if (normalizedKey.endsWith('_Affinity')) {
      return `${statName ?? formatLabel(key)} · Affinity`
    }

    if (statName) {
      return statName
    }

    return formatLabel(key)
  }

  const isPerLevelStatsKey = (key: string) => getNormalizedSettingKey(key).startsWith('PerLevelStatsMultiplier_')

  const getPerLevelGroupId = (key: string) => {
    const normalizedKey = getNormalizedSettingKey(key)

    if (normalizedKey.startsWith('PerLevelStatsMultiplier_DinoTamed')) {
      return 'tamed'
    }

    if (normalizedKey.startsWith('PerLevelStatsMultiplier_DinoWild')) {
      return 'wild'
    }

    if (normalizedKey.startsWith('PerLevelStatsMultiplier_Player')) {
      return 'player'
    }

    return null
  }

  const regularEntries = useMemo(() => {
    return Object.entries(editableConfig).filter(([key]) => {
      const displayLabel = formatLabel(key)
      return !isPerLevelStatsKey(key) && Boolean(getSettingInfo(displayLabel, gameIniSettingsInfo))
    })
  }, [editableConfig])

  const perLevelGroups = useMemo(() => {
    const groups = new Map<string, { id: string; title: string; entries: Array<{ key: string; value: string | number; displayLabel: string }> }>()

    Object.entries(editableConfig).forEach(([key, value]) => {
      const groupId = getPerLevelGroupId(key)

      if (!groupId) {
        return
      }

      const group = groups.get(groupId) ?? {
        id: groupId,
        title:
          groupId === 'tamed'
            ? 'Levels for Tamed Dinos'
            : groupId === 'wild'
              ? 'Levels for Wild Dinos'
              : 'Levels for Player',
        entries: [],
      }

      group.entries.push({
        key,
        value,
        displayLabel: getPerLevelDisplayLabel(key),
      })

      groups.set(groupId, group)
    })

    return Array.from(groups.values())
  }, [editableConfig])

  const filteredRegularEntries = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return regularEntries
    }

    return regularEntries.filter(([key, value]) => {
      const label = formatLabel(key).toLowerCase()
      const rawValue = String(value).toLowerCase()
      return label.includes(query) || rawValue.includes(query)
    })
  }, [regularEntries, search])

  const filteredPerLevelGroups = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return perLevelGroups
    }

    return perLevelGroups.filter((group) => {
      return group.entries.some(({ displayLabel, value }) => {
        const label = displayLabel.toLowerCase()
        const rawValue = String(value).toLowerCase()
        return label.includes(query) || rawValue.includes(query) || group.title.toLowerCase().includes(query)
      })
    })
  }, [perLevelGroups, search])

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
          <h2 className="text-xl font-semibold text-slate-100">Game Configuration</h2>
          <p className="text-sm text-slate-400">Edit values directly in the browser.</p>
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
                {filteredRegularEntries.length + filteredPerLevelGroups.length} of {regularEntries.length + perLevelGroups.length} values
              </div>
            </div>
          </div>

          {filteredPerLevelGroups.length > 0 && (
            <div className="mb-5 space-y-3">
              {filteredPerLevelGroups.map((group) => {
                const isExpanded = expandedPerLevelGroups[group.id] ?? false

                return (
                  <div key={group.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 shadow-sm">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedPerLevelGroups((current) => ({
                          ...current,
                          [group.id]: !current[group.id],
                        }))
                      }
                      className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-left transition hover:border-violet-400/60"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-100">{group.title}</div>
                        <div className="text-xs text-slate-400">{group.entries.length} values</div>
                      </div>
                      <span className="text-sm font-medium text-violet-300">{isExpanded ? 'Hide' : 'Show'}</span>
                    </button>

                    {isExpanded && (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {group.entries.map(({ key, value, displayLabel }) => {
                          const metadataKey = getNormalizedSettingKey(key)
                          const settingInfo = getSettingInfo(metadataKey, gameIniSettingsInfo)
                          const isInfoExpanded = Boolean(expandedInfoKeys[key])

                          return (
                            <div key={key} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                              <div className="mb-2 flex items-start justify-start gap-2">
                                <div className="min-w-0 flex-1 text-left">
                                  <div className="break-words text-sm font-semibold text-slate-100">{displayLabel}</div>
                                  <div className="break-all text-[11px] uppercase tracking-wide text-slate-500">{metadataKey}</div>
                                </div>
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
                                <div className="mt-2 rounded-lg border border-violet-500/20 bg-violet-500/10 p-3 text-sm text-slate-300">
                                  <div className="break-words font-medium text-violet-200">{settingInfo.description}</div>
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
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {filteredRegularEntries.map(([key, value]) => {
              const displayLabel = formatLabel(key)
              const settingInfo = getSettingInfo(displayLabel, gameIniSettingsInfo)
              const isInfoExpanded = Boolean(expandedInfoKeys[key])

              return (
                <div
                  key={key}
                  className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 flex-1 break-words text-sm font-medium text-slate-300">{displayLabel}</span>
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
                      <div className="break-words font-medium text-violet-200">{settingInfo.description}</div>
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