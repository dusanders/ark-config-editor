import { useMemo, useState } from 'react'

export interface SpawnReplacerProps {
  gameConfig?: Record<string, string | number>
  onAddToConfig?: (snippet: string) => void
}

export function SpawnReplacer({ gameConfig, onAddToConfig }: SpawnReplacerProps) {
  const [replacerFrom, setReplacerFrom] = useState('')
  const [replacerTo, setReplacerTo] = useState('')
  const [replacerWeight, setReplacerWeight] = useState('1')
  const [actionFeedback, setActionFeedback] = useState('')

  const existingReplacementCount = useMemo(() => {
    if (!gameConfig) {
      return 0
    }

    return Object.keys(gameConfig).filter((key) => key.toLowerCase().includes('npcreplacements')).length
  }, [gameConfig])

  const generatedReplacerSnippet = useMemo(() => {
    const fromId = replacerFrom.trim()
    const toId = replacerTo.trim()

    if (!fromId || !toId) {
      return ''
    }

    const weight = replacerWeight.trim() || '1'
    return `NPCReplacements=(FromClassName="${fromId}",ToClassName="${toId}",EntryWeight=${weight})`
  }, [replacerFrom, replacerTo, replacerWeight])

  const handleAddToConfig = () => {
    if (!generatedReplacerSnippet) {
      setActionFeedback('Enter both creature IDs first.')
      return
    }

    onAddToConfig?.(generatedReplacerSnippet)
    setActionFeedback('Added to Game.ini config.')
  }

  return (
    <div className="w-full rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 shadow-inner shadow-violet-950/20 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">Replacer helper</h3>
          <p className="mt-1 text-sm text-slate-300">
            Use the Creature IDs reference to look up the exact IDs you want to replace, then paste them here to build a copy-ready snippet for Game.ini.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <a
              href="https://ark.wiki.gg/wiki/Creature_IDs"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-violet-200 transition hover:text-violet-100"
            >
              Open Creature IDs reference ↗
            </a>
            {existingReplacementCount > 0 && (
              <span className="rounded-full border border-slate-700 bg-slate-950/70 px-2.5 py-1 text-xs font-medium text-slate-400">
                {existingReplacementCount} existing replacement entry{existingReplacementCount === 1 ? '' : 'ies'} detected
              </span>
            )}
          </div>
        </div>

        <div className="flex w-full flex-1 flex-col gap-3 sm:flex-row">
          <div className="w-full">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">From creature</div>
            <input
              type="text"
              value={replacerFrom}
              onChange={(event) => {
                setReplacerFrom(event.target.value)
                setActionFeedback('')
              }}
              placeholder="From creature ID"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30"
            />
          </div>
          <div className="w-full">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">To creature</div>
            <input
              type="text"
              value={replacerTo}
              onChange={(event) => {
                setReplacerTo(event.target.value)
                setActionFeedback('')
              }}
              placeholder="To creature ID"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30"
            />
          </div>
          <div className="w-full sm:max-w-[8rem]">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Spawn rate</div>
            <input
              type="number"
              min="0"
              step="0.1"
              value={replacerWeight}
              onChange={(event) => {
                setReplacerWeight(event.target.value)
                setActionFeedback('')
              }}
              placeholder="Weight"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30"
            />
          </div>
        </div>
      </div>

      {generatedReplacerSnippet ? (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Copy-ready template</div>
            <button
              type="button"
              onClick={handleAddToConfig}
              className="rounded-full border border-violet-500/40 bg-violet-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-200 transition hover:border-violet-400 hover:bg-violet-500/20"
            >
              Add to config
            </button>
          </div>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-sm text-slate-200">
            {generatedReplacerSnippet}
          </pre>
          <p className="mt-2 text-xs text-slate-400">
            Tip: set the weight to 0 to disable a spawn entry instead of replacing it.
          </p>
          {actionFeedback && <p className="mt-2 text-xs text-violet-200">{actionFeedback}</p>}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-3 text-sm text-slate-400">
          Enter both creature IDs to generate a replacement snippet.
        </div>
      )}
    </div>
  )
}
