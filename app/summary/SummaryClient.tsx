'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SessionResult } from '@/types/content'
import { useTTS } from '@/hooks/useTTS'

function Stars({ score }: { score: number }) {
  const full = score >= 90 ? 3 : score >= 60 ? 2 : score >= 30 ? 1 : 0
  return (
    <div className="flex gap-1 justify-center text-3xl">
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < full ? 'opacity-100' : 'opacity-20'}>
          ⭐
        </span>
      ))}
    </div>
  )
}

export default function SummaryClient() {
  const router = useRouter()
  const { speak } = useTTS()
  const [results, setResults] = useState<SessionResult[]>([])

  useEffect(() => {
    const raw = sessionStorage.getItem('results')
    if (!raw) return
    const parsed: SessionResult[] = JSON.parse(raw)
    setResults(parsed)

    // Fire email report (best-effort, never blocks the UI)
    const userName = sessionStorage.getItem('userName') ?? 'Nepoznat'
    const lessonTitle = sessionStorage.getItem('lessonTitle') ?? 'Vježba'
    const wrong = parsed
      .filter((r) => !r.correct)
      .map((r) => ({
        en: r.word.en,
        hr: r.word.hr,
        direction: r.direction,
        heard: r.heard,
      }))
    const correct = parsed.filter((r) => r.correct).length
    fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName,
        lessonTitle,
        correct,
        total: parsed.length,
        timestamp: new Date().toISOString(),
        wrong,
      }),
    }).catch(() => {/* silently ignore */})
  }, [])

  if (!results.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <button onClick={() => router.push('/')} className="text-indigo-600 underline">
          ← Natrag na početak
        </button>
      </div>
    )
  }

  const correct = results.filter((r) => r.correct).length
  const total = results.length
  const score = Math.round((correct / total) * 100)
  const wrong = results.filter((r) => !r.correct)

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-indigo-50 to-slate-50">
      <div className="max-w-md mx-auto w-full px-4 py-10">
        {/* Score card */}
        <div className="bg-white rounded-3xl shadow-md border border-slate-100 p-8 text-center mb-6">
          <p className="text-5xl mb-3">{score >= 90 ? '🎉' : score >= 60 ? '👍' : '💪'}</p>
          <Stars score={score} />
          <p className="text-4xl font-bold text-indigo-700 mt-3">
            {correct} / {total}
          </p>
          <p className="text-slate-500 mt-1">
            {score >= 90
              ? 'Odlično! Sve si znala!'
              : score >= 60
              ? 'Bravo! Dobro ide!'
              : 'Vježbaj malo više!'}
          </p>
        </div>

        {/* Wrong words */}
        {wrong.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Pogrešne riječi ({wrong.length})
            </h2>
            <div className="flex flex-col gap-2">
              {wrong.map((r, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-red-100 p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {r.direction === 'en-hr' ? r.word.en : r.word.hr[0]}
                    </p>
                    <p className="text-sm text-green-600 font-medium">
                      ✓ {r.direction === 'en-hr' ? r.word.hr.join(' / ') : r.word.en}
                    </p>
                    {r.heard && (
                      <p className="text-xs text-red-400 mt-0.5">
                        Rekla si: {r.heard}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      speak(
                        r.direction === 'en-hr' ? r.word.en : r.word.hr[0],
                        r.direction === 'en-hr' ? 'en-US' : 'hr'
                      )
                    }
                    className="text-2xl text-indigo-400 ml-3"
                  >
                    🔊
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {wrong.length > 0 && (
            <button
              onClick={() => {
                // Retry only wrong words — pack them as a special session
                const wrongWords = wrong.map((r) => r.word)
                sessionStorage.setItem('retryWords', JSON.stringify(wrongWords))
                const direction = wrong[0].direction
                router.push(`/exercise/retry?direction=${direction}`)
              }}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl shadow active:scale-95 transition-transform"
            >
              🔁 Ponovi pogrešne ({wrong.length})
            </button>
          )}
          <button
            onClick={() => router.push('/')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow active:scale-95 transition-transform"
          >
            ← Odaberi lekciju
          </button>
        </div>
      </div>
    </div>
  )
}
