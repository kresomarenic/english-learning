export interface Word {
  en: string
  hr: string
}

export interface Unit {
  grade: number
  unit: number
  title: string
  titleHr: string
  words: Word[]
}

export interface UnitMeta {
  grade: number
  unit: number
  title: string
  titleHr: string
  wordCount: number
  slug: string // e.g. "grade1/unit01-greetings"
}

export type Direction = 'en-hr' | 'hr-en'

export interface SessionResult {
  word: Word
  direction: Direction
  heard: string
  correct: boolean
}
