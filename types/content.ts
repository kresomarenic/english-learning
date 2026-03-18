export interface Word {
  en: string
  hr: string
}

export interface FillInBlankOption {
  word: string          // the word that becomes the blank
  emoji: string         // hint shown to the student
  distractors: string[] // wrong choices shown alongside the correct answer
}

export interface FillInBlank {
  sentence: string            // full sentence, e.g. "The grizzly bear is eating berries."
  blanks: FillInBlankOption[] // randomly pick one each session
}

export interface Unit {
  grade: number
  unit: number
  title: string
  titleHr: string
  words: Word[]
  fillInBlanks?: FillInBlank[]
}

export interface UnitMeta {
  grade: number
  unit: number
  title: string
  titleHr: string
  wordCount: number
  fillInBlankCount: number  // 0 when the lesson has no fill-in-blank exercises
  slug: string // e.g. "grade4/unit04-lesson1-what-a-day"
}

export type Direction = 'en-hr' | 'hr-en'

export interface SessionResult {
  word: Word
  direction: Direction
  heard: string
  correct: boolean
}
