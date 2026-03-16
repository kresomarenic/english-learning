'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UnitMeta, Direction } from '@/types/content'

const GRADE_LABELS = ['1. razred', '2. razred', '3. razred', '4. razred']
const GRADE_COLORS = [
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-yellow-100 border-yellow-300 text-yellow-800',
]

export default function HomeClient({ units }: { units: UnitMeta[] }) {
  const router = useRouter()
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)
  const [direction, setDirection] = useState<Direction>('en-hr')

  const grades = [1, 2, 3, 4]
  const filteredUnits = selectedGrade
    ? units.filter((u) => u.grade === selectedGrade)
    : units

  function startSession(slugs: string[]) {
    const params = new URLSearchParams()
    params.set('slugs', slugs.join(','))
    params.set('direction', direction)
    router.push(`/exercise?${params.toString()}`)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-indigo-50 to-slate-50">
      {/* Header */}
      <header className="px-4 pt-10 pb-4 text-center">
        <div className="text-4xl mb-2">🌟</div>
        <h1 className="text-2xl font-bold text-indigo-700">Učimo Engleski!</h1>
        <p className="text-slate-500 text-sm mt-1">Odaberi lekciju i vježbaj</p>
      </header>

      <main className="flex-1 px-4 pb-8 max-w-md mx-auto w-full">

        {/* Direction toggle */}
        <div className="bg-white rounded-2xl border border-slate-200 p-1 flex mb-5">
          <button
            onClick={() => setDirection('en-hr')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              direction === 'en-hr'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-500'
            }`}
          >
            English → Hrvatski
          </button>
          <button
            onClick={() => setDirection('hr-en')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              direction === 'hr-en'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-500'
            }`}
          >
            Hrvatski → English
          </button>
        </div>

        {/* Practice all button */}
        <button
          onClick={() => startSession(units.map((u) => u.slug))}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl mb-5 text-lg shadow-md active:scale-95 transition-transform"
        >
          ▶ Vježbaj sve lekcije
        </button>

        {/* Grade filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedGrade(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap transition-all ${
              selectedGrade === null
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            Svi razredi
          </button>
          {grades.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGrade(selectedGrade === g ? null : g)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap transition-all ${
                selectedGrade === g
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {g}. razred
            </button>
          ))}
        </div>

        {/* If a grade is selected, show "Practice whole grade" button */}
        {selectedGrade && (
          <button
            onClick={() =>
              startSession(
                units
                  .filter((u) => u.grade === selectedGrade)
                  .map((u) => u.slug)
              )
            }
            className={`w-full py-3 rounded-2xl font-bold mb-4 border-2 text-base active:scale-95 transition-transform ${GRADE_COLORS[selectedGrade - 1]}`}
          >
            ▶ Vježbaj cijeli {selectedGrade}. razred
          </button>
        )}

        {/* Unit list */}
        <div className="flex flex-col gap-3">
          {filteredUnits.map((unit) => (
            <button
              key={unit.slug}
              onClick={() => startSession([unit.slug])}
              className="bg-white rounded-2xl border border-slate-200 p-4 text-left shadow-sm active:scale-95 transition-transform hover:border-indigo-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${GRADE_COLORS[unit.grade - 1]}`}
                    >
                      {GRADE_LABELS[unit.grade - 1]}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Unit {unit.unit}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800">{unit.title}</p>
                  <p className="text-sm text-slate-400">{unit.titleHr}</p>
                </div>
                <div className="text-right ml-3">
                  <p className="text-2xl font-bold text-indigo-600">
                    {unit.wordCount}
                  </p>
                  <p className="text-xs text-slate-400">riječi</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
