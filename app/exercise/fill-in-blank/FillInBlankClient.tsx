'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FillInBlank } from '@/types/content'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useTTS } from '@/hooks/useTTS'

type Mode = 'speak' | 'choice'

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, '')
    .trim()
}

interface PreparedExercise {
  displayed: string  // sentence with ___ in place of the answer
  ttsText: string    // sentence with "blank" spoken by TTS
  answer: string     // the word the student must say/choose
  emoji: string      // hint
  choices: string[]  // answer + distractors, shuffled
}

function prepareExercises(fillInBlanks: FillInBlank[]): PreparedExercise[] {
  const shuffled = [...fillInBlanks].sort(() => Math.random() - 0.5)
  return shuffled.map((item) => {
    const blank = item.blanks[Math.floor(Math.random() * item.blanks.length)]
    const choices = [blank.word, ...blank.distractors].sort(() => Math.random() - 0.5)
    return {
      displayed: item.sentence.replace(blank.word, '___'),
      ttsText:   item.sentence.replace(blank.word, '...'),
      answer:    blank.word,
      emoji:     blank.emoji,
      choices,
    }
  })
}

export default function FillInBlankClient({
  fillInBlanks,
  lessonTitle,
}: {
  fillInBlanks: FillInBlank[]
  lessonTitle: string
}) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('choice')
  const [exercises, setExercises] = useState<PreparedExercise[]>([])
  const [index, setIndex] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [heardText, setHeardText] = useState('')
  const [tappedChoice, setTappedChoice] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [speakScheduled, setSpeakScheduled] = useState(false)

  // Randomise on the client only — avoids SSR/hydration mismatch
  useEffect(() => {
    setExercises(prepareExercises(fillInBlanks))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { status, transcript, start, stop, reset, getAlternatives } = useSpeechRecognition('en-GB')
  const { speak, isSpeaking } = useTTS()

  const current = exercises[index]

  // Clear speakScheduled once TTS actually starts
  useEffect(() => {
    if (isSpeaking) setSpeakScheduled(false)
  }, [isSpeaking])

  // Auto-speak sentence on each new exercise
  useEffect(() => {
    if (!current || done) return
    setSpeakScheduled(true)
    speak(current.ttsText, 'en-GB')
    const safety = setTimeout(() => setSpeakScheduled(false), 5000)
    return () => {
      clearTimeout(safety)
      setSpeakScheduled(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, done, mode])

  // Handle speech recognition result
  useEffect(() => {
    if (status !== 'done' || !current || mode !== 'speak') return
    const alternatives = getAlternatives()
    const normAnswer = normalize(current.answer)
    const heard = [transcript, ...alternatives].map(normalize)
    const correct = heard.some(
      (h) => h === normAnswer || h.includes(normAnswer) || normAnswer.includes(h)
    )
    setHeardText(transcript)
    setFeedback(correct ? 'correct' : 'wrong')
    if (correct) setScore((s) => s + 1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const handleNext = useCallback(() => {
    reset()
    setFeedback(null)
    setHeardText('')
    setTappedChoice(null)
    if (index + 1 >= exercises.length) {
      setDone(true)
    } else {
      setIndex((i) => i + 1)
    }
  }, [index, exercises.length, reset])

  // Auto-advance on correct after short delay
  useEffect(() => {
    if (feedback === 'correct') {
      const t = setTimeout(handleNext, 1200)
      return () => clearTimeout(t)
    }
  }, [feedback, handleNext])

  // Handle choice tap
  function handleChoiceTap(choice: string) {
    if (feedback) return
    const correct = choice === current.answer
    setTappedChoice(choice)
    setHeardText(choice)
    setFeedback(correct ? 'correct' : 'wrong')
    if (correct) setScore((s) => s + 1)
  }

  // Switch mode: reset current exercise state but keep progress
  function switchMode(next: Mode) {
    reset()
    setFeedback(null)
    setHeardText('')
    setTappedChoice(null)
    setMode(next)
  }

  const micBlocked = speakScheduled || isSpeaking
  const progress = exercises.length ? (index / exercises.length) * 100 : 0

  if (!exercises.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400 text-lg">Učitavanje...</p>
      </div>
    )
  }

  // ── Done screen ─────────────────────────────────────────────────
  if (done) {
    const pct = Math.round((score / exercises.length) * 100)
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-emerald-50 to-slate-50 items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-md border border-slate-100 p-8 text-center max-w-sm w-full">
          <p className="text-6xl mb-4">{pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '💪'}</p>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Gotovo!</h2>
          <p className="text-slate-400 text-sm mb-4">{lessonTitle}</p>
          <p className="text-slate-500 mb-1">Točnih odgovora</p>
          <p className="text-5xl font-bold text-emerald-600 mb-1">
            {score}
            <span className="text-2xl text-slate-400">/{exercises.length}</span>
          </p>
          <p className="text-slate-400 text-sm mb-6">{pct}%</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/')}
              className="w-full bg-emerald-600 text-white font-bold py-3 rounded-2xl active:scale-95 transition-transform"
            >
              ← Natrag
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full border-2 border-emerald-400 text-emerald-700 font-semibold py-3 rounded-2xl active:scale-95 transition-transform"
            >
              Vježbaj ponovo
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Exercise screen ──────────────────────────────────────────────
  const parts = current.displayed.split('___')

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-emerald-50 to-slate-50">
      {/* Top bar */}
      <div className="px-4 pt-6 pb-2 max-w-md mx-auto w-full">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-slate-600 text-lg"
          >
            ←
          </button>
          <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-slate-500 font-medium whitespace-nowrap">
            {index + 1} / {exercises.length}
          </span>
        </div>

        {/* Mode toggle */}
        <div className="bg-white rounded-2xl border border-slate-200 p-1 flex">
          <button
            onClick={() => switchMode('choice')}
            className={`flex-1 py-1.5 rounded-xl text-sm font-medium transition-all ${
              mode === 'choice' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500'
            }`}
          >
            👆 Odaberi
          </button>
          <button
            onClick={() => switchMode('speak')}
            className={`flex-1 py-1.5 rounded-xl text-sm font-medium transition-all ${
              mode === 'speak' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500'
            }`}
          >
            🎤 Govori
          </button>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 pt-4 max-w-md mx-auto w-full">
        <div className="w-full bg-white rounded-3xl shadow-md border border-slate-100 p-8 text-center mb-5">
          {/* Emoji hint */}
          <p className="text-8xl mb-6 leading-none select-none">{current.emoji}</p>

          {/* Sentence with blank */}
          <p className="text-xl font-semibold text-slate-700 leading-relaxed">
            {parts[0]}
            <span className="inline-block border-b-4 border-emerald-400 px-3 mx-1 text-emerald-500 font-bold min-w-[64px] text-center">
              {feedback ? current.answer : '___'}
            </span>
            {parts[1]}
          </p>

          {/* Replay TTS */}
          <button
            onClick={() => speak(current.ttsText, 'en-GB')}
            className="mt-5 text-slate-400 hover:text-slate-600 text-2xl transition-colors"
            title="Čuj rečenicu"
          >
            🔊
          </button>
        </div>

        {/* ── CHOICE MODE ─────────────────────────────────────────── */}
        {mode === 'choice' && !feedback && (
          <div className="w-full grid grid-cols-2 gap-3 mb-4">
            {current.choices.map((choice) => (
              <button
                key={choice}
                onClick={() => handleChoiceTap(choice)}
                className="bg-white border-2 border-slate-200 rounded-2xl py-4 px-3 text-center font-semibold text-slate-700 text-sm shadow-sm active:scale-95 transition-all hover:border-emerald-400 hover:text-emerald-700"
              >
                {choice}
              </button>
            ))}
          </div>
        )}

        {/* Choice result buttons (after tap) */}
        {mode === 'choice' && feedback && (
          <div className="w-full grid grid-cols-2 gap-3 mb-4">
            {current.choices.map((choice) => {
              const isCorrect = choice === current.answer
              const isTapped = choice === tappedChoice
              return (
                <div
                  key={choice}
                  className={`rounded-2xl py-4 px-3 text-center font-semibold text-sm border-2 transition-all ${
                    isCorrect
                      ? 'bg-green-100 border-green-400 text-green-800'
                      : isTapped
                        ? 'bg-red-100 border-red-400 text-red-700'
                        : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  {isCorrect ? '✅ ' : isTapped ? '❌ ' : ''}{choice}
                </div>
              )
            })}
          </div>
        )}

        {/* ── SPEAK MODE ──────────────────────────────────────────── */}
        {mode === 'speak' && (
          <>
            {feedback && (
              <div
                className={`w-full rounded-2xl p-5 mb-5 text-center ${
                  feedback === 'correct'
                    ? 'bg-green-100 border border-green-300'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {feedback === 'correct' ? (
                  <>
                    <p className="text-3xl mb-1">✅</p>
                    <p className="text-green-700 font-bold text-lg">Točno!</p>
                    <p className="text-green-600 text-sm mt-1">
                      Čuo/la sam: <span className="font-semibold">{heardText}</span>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl mb-1">❌</p>
                    <p className="text-red-600 font-bold text-lg">Nije točno</p>
                    {heardText && (
                      <p className="text-red-500 text-sm mt-1">
                        Čuo/la sam: <span className="font-semibold">{heardText}</span>
                      </p>
                    )}
                    <p className="text-slate-600 text-sm mt-2">
                      Točan odgovor:{' '}
                      <span className="font-bold text-slate-800">{current.answer}</span>
                    </p>
                    <button
                      onClick={() => speak(current.answer, 'en-GB')}
                      className="mt-2 text-sm text-indigo-500 underline"
                    >
                      🔊 Čuj točan odgovor
                    </button>
                  </>
                )}
              </div>
            )}

            {!feedback ? (
              <button
                onClick={
                  micBlocked || status === 'unsupported'
                    ? undefined
                    : status === 'listening'
                      ? stop
                      : start
                }
                disabled={micBlocked || status === 'unsupported'}
                className={`w-24 h-24 rounded-full text-4xl shadow-lg transition-all select-none
                  ${micBlocked
                    ? 'bg-amber-100 text-amber-400 cursor-not-allowed animate-pulse'
                    : status === 'listening'
                      ? 'bg-red-500 text-white scale-110 animate-pulse'
                      : status === 'unsupported'
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                  }`}
              >
                {micBlocked ? '🔊' : status === 'listening' ? '🎙' : '🎤'}
              </button>
            ) : feedback === 'wrong' ? (
              <button
                onClick={handleNext}
                className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl text-lg shadow active:scale-95 transition-transform"
              >
                Nastavi →
              </button>
            ) : null}

            {status !== 'listening' && !feedback && (
              <p className="text-slate-400 text-sm mt-4 text-center">
                {micBlocked ? 'Pričekaj da završi izgovor...' : 'Pritisni i reci nedostajuću riječ'}
              </p>
            )}

            {status === 'unsupported' && (
              <p className="text-sm text-red-400 mt-3 text-center">
                Preglednik ne podržava prepoznavanje govora. Koristi Chrome.
              </p>
            )}
          </>
        )}

        {/* Continue button — shown after choice feedback (wrong) */}
        {mode === 'choice' && feedback === 'wrong' && (
          <button
            onClick={handleNext}
            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl text-lg shadow active:scale-95 transition-transform mt-1"
          >
            Nastavi →
          </button>
        )}
      </div>
    </div>
  )
}
