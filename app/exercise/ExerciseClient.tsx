'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Word, Direction, SessionResult } from '@/types/content'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useTTS } from '@/hooks/useTTS'

// How strictly to match — strips accents and does fuzzy compare
function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, '')
    .trim()
}

function isCorrect(heard: string, expected: string, alternatives: string[]): boolean {
  const norm = normalize(expected)
  const allHeard = [heard, ...alternatives].map(normalize)
  return allHeard.some((h) => h === norm || h.includes(norm) || norm.includes(h))
}

export default function ExerciseClient() {
  const router = useRouter()
  const params = useSearchParams()
  const direction = (params.get('direction') ?? 'en-hr') as Direction
  const slugs = (params.get('slugs') ?? '').split(',').filter(Boolean)

  const [words, setWords] = useState<Word[]>([])
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<SessionResult[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [heardText, setHeardText] = useState('')
  const [loading, setLoading] = useState(true)

  const speechLang = direction === 'en-hr' ? 'hr' : 'en-US'
  const displayLang = direction === 'en-hr' ? 'en-US' : 'hr'

  const { status, transcript, start, stop, getAlternatives } = useSpeechRecognition(speechLang)
  const { speak } = useTTS()

  // Load words
  useEffect(() => {
    async function load() {
      const all: Word[] = []
      for (const slug of slugs) {
        const res = await fetch(`/api/unit?slug=${encodeURIComponent(slug)}`)
        const unit = await res.json()
        all.push(...unit.words)
      }
      // Shuffle
      const shuffled = all.sort(() => Math.random() - 0.5)
      setWords(shuffled)
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentWord = words[index]
  const prompt = currentWord
    ? direction === 'en-hr'
      ? currentWord.en
      : currentWord.hr
    : ''
  const answer = currentWord
    ? direction === 'en-hr'
      ? currentWord.hr
      : currentWord.en
    : ''

  // Auto-speak prompt when word changes
  useEffect(() => {
    if (currentWord && !loading) {
      setTimeout(() => speak(prompt, displayLang), 300)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, loading])

  // Handle recognition result
  useEffect(() => {
    if (status !== 'done' || !currentWord) return

    const alternatives = getAlternatives()
    const correct = isCorrect(transcript, answer, alternatives)
    setHeardText(transcript)
    setFeedback(correct ? 'correct' : 'wrong')

    setResults((prev) => [
      ...prev,
      { word: currentWord, direction, heard: transcript, correct },
    ])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const handleNext = useCallback(() => {
    setFeedback(null)
    setHeardText('')
    if (index + 1 >= words.length) {
      // Go to summary — encode results in sessionStorage
      sessionStorage.setItem('results', JSON.stringify(results.concat()))
      router.push('/summary')
    } else {
      setIndex((i) => i + 1)
    }
  }, [index, words.length, results, router])

  // Auto-advance on correct after short delay
  useEffect(() => {
    if (feedback === 'correct') {
      const t = setTimeout(handleNext, 1200)
      return () => clearTimeout(t)
    }
  }, [feedback, handleNext])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400 text-lg">Učitavanje...</p>
      </div>
    )
  }

  if (!currentWord) return null

  const progress = ((index) / words.length) * 100

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-indigo-50 to-slate-50">
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
              className="bg-indigo-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-slate-500 font-medium whitespace-nowrap">
            {index + 1} / {words.length}
          </span>
        </div>
        <p className="text-xs text-center text-slate-400">
          {direction === 'en-hr' ? 'Reci na hrvatskom' : 'Say it in English'}
        </p>
      </div>

      {/* Word card */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 pt-6 max-w-md mx-auto w-full">
        <div className="w-full bg-white rounded-3xl shadow-md border border-slate-100 p-8 text-center mb-6">
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">
            {direction === 'en-hr' ? 'English' : 'Hrvatski'}
          </p>
          <p className="text-4xl font-bold text-slate-800 mb-4">{prompt}</p>
          <button
            onClick={() => speak(prompt, displayLang)}
            className="text-indigo-400 hover:text-indigo-600 text-2xl transition-colors"
            title="Čuj izgovor"
          >
            🔊
          </button>
        </div>

        {/* Feedback area */}
        {feedback && (
          <div
            className={`w-full rounded-2xl p-5 mb-5 text-center transition-all ${
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
                  <span className="font-bold text-slate-800">{answer}</span>
                </p>
                <button
                  onClick={() => speak(answer, speechLang)}
                  className="mt-2 text-sm text-indigo-500 underline"
                >
                  🔊 Čuj točan odgovor
                </button>
              </>
            )}
          </div>
        )}

        {/* Mic / Next button */}
        {!feedback ? (
          <button
            onPointerDown={start}
            onPointerUp={stop}
            onPointerLeave={stop}
            disabled={status === 'unsupported'}
            className={`w-24 h-24 rounded-full text-4xl shadow-lg transition-all active:scale-95 select-none
              ${status === 'listening'
                ? 'bg-red-500 text-white scale-110 animate-pulse'
                : status === 'unsupported'
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
          >
            {status === 'listening' ? '🎙' : '🎤'}
          </button>
        ) : feedback === 'wrong' ? (
          <button
            onClick={handleNext}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl text-lg shadow active:scale-95 transition-transform"
          >
            Nastavi →
          </button>
        ) : null}

        {status === 'unsupported' && (
          <p className="text-sm text-red-400 mt-3 text-center">
            Preglednik ne podržava prepoznavanje govora. Koristi Chrome.
          </p>
        )}

        {status !== 'listening' && !feedback && (
          <p className="text-slate-400 text-sm mt-4 text-center">
            {direction === 'en-hr'
              ? 'Drži gumb i govori na hrvatskom'
              : 'Hold the button and speak in English'}
          </p>
        )}
      </div>
    </div>
  )
}
