import { useMemo, useState } from 'react'

export interface DifficultyOverrideHelperProps {
  onApply?: (values: Record<string, string | number>) => void
}

export function DifficultyOverrideHelper({ onApply }: DifficultyOverrideHelperProps) {
  const [targetLevel, setTargetLevel] = useState('150')

  const calculation = useMemo(() => {
    const trimmedValue = targetLevel.trim()

    if (!trimmedValue) {
      return null
    }

    const numericValue = Number(trimmedValue)

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return null
    }

    const override = numericValue / 30
    const formatValue = (value: number) => {
      const rounded = Number(value.toFixed(2))
      return String(rounded).replace(/\.0$/, '')
    }

    return {
      override,
      formattedOverride: formatValue(override),
      snippet: `OverrideOfficialDifficulty=${formatValue(override)}\nDifficultyOffset=1.0`,
    }
  }, [targetLevel])

  const handleApply = () => {
    if (!calculation) {
      return
    }

    onApply?.({
      'ServerSettings.OverrideOfficialDifficulty': calculation.formattedOverride,
      'ServerSettings.DifficultyOffset': '1.0',
    })
  }

  return (
    <div className="w-full rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 shadow-inner shadow-cyan-950/20 sm:p-6">
      <div className="max-w-3xl">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Difficulty override helper</h3>
        <p className="mt-1 text-sm text-slate-300">
          Convert a target max wild dino level into the OverrideOfficialDifficulty value used by ARK server configs.
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500" htmlFor="target-wild-level">
            Target max wild dino level
          </label>
          <input
            id="target-wild-level"
            type="number"
            min="1"
            step="1"
            value={targetLevel}
            onChange={(event) => setTargetLevel(event.target.value)}
            placeholder="150"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
          />

          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-sm text-slate-300">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Formula</div>
            <div className="mt-2 font-medium text-cyan-200">OverrideOfficialDifficulty = Target Max Wild Dino Level / 30</div>
            <div className="mt-2 text-xs text-slate-400">
              Keep DifficultyOffset=1.0 when using OverrideOfficialDifficulty.
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Result</div>

          {calculation ? (
            <>
              <div className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-3">
                <div className="text-sm text-slate-300">
                  <span className="font-semibold text-cyan-200">Calculated value:</span> {calculation.formattedOverride}
                </div>
                <div className="mt-2 text-sm text-slate-300">
                  <span className="font-semibold text-cyan-200">Recommended offset:</span> 1.0
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Copy-ready snippet</div>
                <button
                  type="button"
                  onClick={handleApply}
                  className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-500/20"
                >
                  Apply
                </button>
              </div>

              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-sm text-slate-200">
                {calculation.snippet}
              </pre>
            </>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-400">
              Enter a valid target level to generate the override value.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
