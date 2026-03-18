'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UnitMeta, Direction } from '@/types/content'
import PWAInstallButton from '@/app/components/PWAInstallButton'

const GRADE_LABELS = ['1. razred', '2. razred', '3. razred', '4. razred']
const GRADE_COLORS = [
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-yellow-100 border-yellow-300 text-yellow-800',
]
const GRADE_ACCENT = [
  'border-pink-400 bg-pink-50',
  'border-blue-400 bg-blue-50',
  'border-green-400 bg-green-50',
  'border-yellow-400 bg-yellow-50',
]

const ACTIVE_GRADES = [3, 4]

interface UnitGroup {
  grade: number
  unit: number
  lessons: UnitMeta[]
  totalWords: number
}

function groupByUnit(units: UnitMeta[]): UnitGroup[] {
  const map = new Map<string, UnitGroup>()
  for (const u of units) {
    const key = `${u.grade}-${u.unit}`
    if (!map.has(key)) {
      map.set(key, { grade: u.grade, unit: u.unit, lessons: [], totalWords: 0 })
    }
    const g = map.get(key)!
    g.lessons.push(u)
    g.totalWords += u.wordCount
  }
  return Array.from(map.values()).sort((a, b) =>
    a.grade !== b.grade ? a.grade - b.grade : a.unit - b.unit
  )
}

export default function HomeClient({ units }: { units: UnitMeta[] }) {
  const router = useRouter()
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)
  const [direction, setDirection] = useState<Direction>('en-hr')
  const [openUnits, setOpenUnits] = useState<Set<string>>(new Set())

  const filteredUnits = selectedGrade
    ? units.filter((u) => u.grade === selectedGrade)
    : units

  const unitGroups = groupByUnit(filteredUnits)

  function startSession(slugs: string[]) {
    const params = new URLSearchParams()
    params.set('slugs', slugs.join(','))
    params.set('direction', direction)
    router.push(`/exercise?${params.toString()}`)
  }

  function startFillInBlank(slug: string) {
    router.push(`/exercise/fill-in-blank?slug=${encodeURIComponent(slug)}`)
  }

  function toggleUnit(key: string) {
    setOpenUnits((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-indigo-50 to-slate-50">
      {/* Header */}
      <header className="px-4 pt-10 pb-4 text-center relative">
        <div className="absolute top-4 right-4">
          <PWAInstallButton />
        </div>
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
              direction === 'en-hr' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500'
            }`}
          >
            English → Hrvatski
          </button>
          <button
            onClick={() => setDirection('hr-en')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              direction === 'hr-en' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500'
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
          {ACTIVE_GRADES.map((g) => (
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

        {/* Practice whole grade button */}
        {selectedGrade && (
          <button
            onClick={() =>
              startSession(units.filter((u) => u.grade === selectedGrade).map((u) => u.slug))
            }
            className={`w-full py-3 rounded-2xl font-bold mb-4 border-2 text-base active:scale-95 transition-transform ${GRADE_COLORS[selectedGrade - 1]}`}
          >
            ▶ Vježbaj cijeli {selectedGrade}. razred
          </button>
        )}

        {/* Unit groups — collapsible */}
        <div className="flex flex-col gap-3">
          {unitGroups.map((group) => {
            const key = `${group.grade}-${group.unit}`
            const isOpen = openUnits.has(key)
            const gradeIdx = group.grade - 1

            return (
              <div
                key={key}
                className={`rounded-2xl border-2 overflow-hidden ${GRADE_ACCENT[gradeIdx]}`}
              >
                {/* Unit header — tap to expand */}
                <button
                  onClick={() => toggleUnit(key)}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full border ${GRADE_COLORS[gradeIdx]}`}
                    >
                      {GRADE_LABELS[gradeIdx]}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800 leading-tight">
                        Unit {group.unit}
                      </p>
                      <p className="text-xs text-slate-500">
                        {group.lessons.length} lekcij{group.lessons.length === 1 ? 'a' : 'e'} · {group.totalWords} riječi
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Practice whole unit */}
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        startSession(group.lessons.map((l) => l.slug))
                      }}
                      className="text-xs font-semibold px-3 py-1.5 bg-indigo-600 text-white rounded-full active:scale-95 transition-transform"
                    >
                      ▶ Sve
                    </span>
                    <span
                      className={`text-slate-400 text-lg transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    >
                      ▾
                    </span>
                  </div>
                </button>

                {/* Lessons list */}
                {isOpen && (
                  <div className="border-t border-slate-200 bg-white divide-y divide-slate-100">
                    {group.lessons.map((lesson) => (
                      <div
                        key={lesson.slug}
                        className="px-4 py-3 flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 text-sm">{lesson.title}</p>
                          <p className="text-xs text-slate-400">{lesson.titleHr}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                          <button
                            onClick={() => startSession([lesson.slug])}
                            className="flex flex-col items-center px-3 py-1.5 bg-indigo-600 text-white rounded-xl active:scale-95 transition-transform"
                          >
                            <span className="text-xs font-bold">🔤 {lesson.wordCount}</span>
                            <span className="text-[10px] opacity-80">prijevod</span>
                          </button>
                          {lesson.fillInBlankCount > 0 && (
                            <button
                              onClick={() => startFillInBlank(lesson.slug)}
                              className="flex flex-col items-center px-3 py-1.5 bg-emerald-600 text-white rounded-xl active:scale-95 transition-transform"
                            >
                              <span className="text-xs font-bold">✏️ {lesson.fillInBlankCount}</span>
                              <span className="text-[10px] opacity-80">rečenice</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
