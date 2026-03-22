'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UnitMeta, Direction } from '@/types/content'
import PWAInstallButton from '@/app/components/PWAInstallButton'
import NameEntryModal from '@/app/components/NameEntryModal'

const USER_NAME_KEY = 'englishApp_userName'

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
  const [openGrades, setOpenGrades] = useState<Set<number>>(new Set())
  const [userName, setUserName] = useState<string | null>(null)
  const [nameChecked, setNameChecked] = useState(false)

  // Read name from localStorage once mounted (avoids SSR mismatch)
  useEffect(() => {
    const stored = localStorage.getItem(USER_NAME_KEY)
    setUserName(stored)
    setNameChecked(true)
  }, [])

  function saveName(name: string) {
    localStorage.setItem(USER_NAME_KEY, name)
    setUserName(name)
  }

  const filteredUnits = selectedGrade
    ? units.filter((u) => u.grade === selectedGrade)
    : units

  const unitGroups = groupByUnit(filteredUnits)

  function startSession(slugs: string[]) {
    if (userName) sessionStorage.setItem('userName', userName)
    const params = new URLSearchParams()
    params.set('slugs', slugs.join(','))
    params.set('direction', direction)
    router.push(`/exercise?${params.toString()}`)
  }

  function startFillInBlank(slugs: string[]) {
    if (userName) sessionStorage.setItem('userName', userName)
    const params = new URLSearchParams()
    params.set('slugs', slugs.join(','))
    router.push(`/exercise/fill-in-blank?${params.toString()}`)
  }

  function toggleUnit(key: string) {
    setOpenUnits((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function toggleGrade(grade: number) {
    setOpenGrades((prev) => {
      const next = new Set(prev)
      next.has(grade) ? next.delete(grade) : next.add(grade)
      return next
    })
  }

  function renderUnitGroup(group: UnitGroup, showGradeLabel = false) {
    const key = `${group.grade}-${group.unit}`
    const isOpen = openUnits.has(key)
    const gradeIdx = group.grade - 1

    return (
      <div
        key={key}
        className={`rounded-2xl border-2 overflow-hidden ${GRADE_ACCENT[gradeIdx]}`}
      >
        <button
          onClick={() => toggleUnit(key)}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            {showGradeLabel && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${GRADE_COLORS[gradeIdx]}`}>
                {GRADE_LABELS[gradeIdx]}
              </span>
            )}
            <div>
              <p className="font-bold text-slate-800 leading-tight">
                Unit {group.unit}
              </p>
              <p className="text-xs text-slate-500">
                {group.lessons.length} lekcij{group.lessons.length === 1 ? 'a' : 'e'} · {group.totalWords} riječi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {group.lessons.some((l) => l.wordCount > 0) && (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation()
                  startSession(group.lessons.filter((l) => l.wordCount > 0).map((l) => l.slug))
                }}
                className="text-xs font-semibold px-2.5 py-1.5 bg-indigo-600 text-white rounded-full active:scale-95 transition-transform"
              >
                🔤
              </span>
            )}
            {group.lessons.some((l) => l.fillInBlankCount > 0) && (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation()
                  startFillInBlank(group.lessons.filter((l) => l.fillInBlankCount > 0).map((l) => l.slug))
                }}
                className="text-xs font-semibold px-2.5 py-1.5 bg-emerald-600 text-white rounded-full active:scale-95 transition-transform"
              >
                ✏️
              </span>
            )}
            <span
              className={`text-slate-400 text-lg transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            >
              ▾
            </span>
          </div>
        </button>

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
                  {lesson.wordCount > 0 && (
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => startSession([lesson.slug])}
                        className="flex flex-col items-center px-3 py-1.5 bg-indigo-600 text-white rounded-xl active:scale-95 transition-transform w-full"
                      >
                        <span className="text-xs font-bold">🔤 {lesson.wordCount}</span>
                        <span className="text-[10px] opacity-80">prijevod</span>
                      </button>
                      <div className="flex rounded-lg overflow-hidden border border-indigo-300 w-full">
                        <button
                          onClick={(e) => { e.stopPropagation(); setDirection('en-hr') }}
                          className={`flex-1 text-[10px] font-semibold py-0.5 transition-colors ${
                            direction === 'en-hr'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white text-indigo-500'
                          }`}
                        >
                          EN
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDirection('hr-en') }}
                          className={`flex-1 text-[10px] font-semibold py-0.5 transition-colors ${
                            direction === 'hr-en'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white text-indigo-500'
                          }`}
                        >
                          HR
                        </button>
                      </div>
                    </div>
                  )}
                  {lesson.fillInBlankCount > 0 && (
                    <button
                      onClick={() => startFillInBlank([lesson.slug])}
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
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-indigo-50 to-slate-50">
      {/* Name entry modal — shown only after localStorage is checked and name is missing */}
      {nameChecked && !userName && <NameEntryModal onSave={saveName} />}

      {/* Header */}
      <header className="px-4 pt-10 pb-4 text-center relative">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {userName && (
            <button
              onClick={() => {
                localStorage.removeItem(USER_NAME_KEY)
                setUserName(null)
              }}
              title="Promijeni ime"
              className="text-xs text-slate-400 hover:text-slate-600 border border-slate-200 rounded-full px-2 py-0.5"
            >
              {userName} ✏️
            </button>
          )}
          <PWAInstallButton />
        </div>
        <div className="text-4xl mb-2">🌟</div>
        <h1 className="text-2xl font-bold text-indigo-700">Učimo Engleski!</h1>
        <p className="text-slate-500 text-sm mt-1">Odaberi lekciju i vježbaj</p>
      </header>

      <main className="flex-1 px-4 pb-8 max-w-md mx-auto w-full">

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

        {/* Practice whole grade buttons */}
        {selectedGrade && (() => {
          const gradeTranslationSlugs = units.filter((u) => u.grade === selectedGrade && u.wordCount > 0).map((u) => u.slug)
          const gradeFillInBlankSlugs = units.filter((u) => u.grade === selectedGrade && u.fillInBlankCount > 0).map((u) => u.slug)
          return (
            <div className={`flex gap-2 mb-4`}>
              {gradeTranslationSlugs.length > 0 && (
                <button
                  onClick={() => startSession(gradeTranslationSlugs)}
                  className={`flex-1 py-3 rounded-2xl font-bold border-2 text-sm active:scale-95 transition-transform ${GRADE_COLORS[selectedGrade - 1]}`}
                >
                  🔤 Prijevod
                </button>
              )}
              {gradeFillInBlankSlugs.length > 0 && (
                <button
                  onClick={() => startFillInBlank(gradeFillInBlankSlugs)}
                  className={`flex-1 py-3 rounded-2xl font-bold border-2 text-sm active:scale-95 transition-transform ${GRADE_COLORS[selectedGrade - 1]}`}
                >
                  ✏️ Rečenice
                </button>
              )}
            </div>
          )
        })()}

        {/* Unit groups — collapsible, grouped by grade when showing all */}
        <div className="flex flex-col gap-3">
          {selectedGrade ? (
            unitGroups.map((group) => renderUnitGroup(group, true))
          ) : (
            ACTIVE_GRADES.filter((g) => unitGroups.some((u) => u.grade === g)).map((grade) => {
              const gradeIdx = grade - 1
              const isGradeOpen = openGrades.has(grade)
              const gradeUnitGroups = unitGroups.filter((u) => u.grade === grade)
              const totalWords = gradeUnitGroups.reduce((sum, g) => sum + g.totalWords, 0)
              const gradeSlugsTranslation = units.filter((u) => u.grade === grade && u.wordCount > 0).map((u) => u.slug)
              const gradeSlugsFillin = units.filter((u) => u.grade === grade && u.fillInBlankCount > 0).map((u) => u.slug)

              return (
                <div key={grade} className={`rounded-2xl border-2 overflow-hidden ${GRADE_ACCENT[gradeIdx]}`}>
                  <button
                    onClick={() => toggleGrade(grade)}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${GRADE_COLORS[gradeIdx]}`}>
                        {GRADE_LABELS[gradeIdx]}
                      </span>
                      <div>
                        <p className="font-bold text-slate-800 leading-tight">
                          {gradeUnitGroups.length} unit{gradeUnitGroups.length === 1 ? '' : 'a'}
                        </p>
                        <p className="text-xs text-slate-500">{totalWords} riječi</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {gradeSlugsTranslation.length > 0 && (
                        <span
                          role="button"
                          onClick={(e) => { e.stopPropagation(); startSession(gradeSlugsTranslation) }}
                          className="text-xs font-semibold px-2.5 py-1.5 bg-indigo-600 text-white rounded-full active:scale-95 transition-transform"
                        >
                          🔤
                        </span>
                      )}
                      {gradeSlugsFillin.length > 0 && (
                        <span
                          role="button"
                          onClick={(e) => { e.stopPropagation(); startFillInBlank(gradeSlugsFillin) }}
                          className="text-xs font-semibold px-2.5 py-1.5 bg-emerald-600 text-white rounded-full active:scale-95 transition-transform"
                        >
                          ✏️
                        </span>
                      )}
                      <span className={`text-slate-400 text-lg transition-transform duration-200 ${isGradeOpen ? 'rotate-180' : ''}`}>
                        ▾
                      </span>
                    </div>
                  </button>

                  {isGradeOpen && (
                    <div className="border-t border-slate-200 bg-white/50 p-2 flex flex-col gap-2">
                      {gradeUnitGroups.map((group) => renderUnitGroup(group))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
