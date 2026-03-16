'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Word, Direction, SessionResult } from '@/types/content'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useTTS } from '@/hooks/useTTS'

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

export default function RetryClient() {
  const router = useRouter()
  const params = useSearchParams()
  const direction = (params.get('direction') ?? 'en-hr') as Direction

  const [words, setWords] = useState<Word[]>([])
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<SessionResult[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [heardText, setHeardText] = useState('')

  const speechLang = direction === 'en-hr' ? 'hr' : 'en-GB'
  const displayLang = direction === 'en-hr' ? 'en-GB' : 'hr'

  const { status, transcript, start, stop, getAlternatives } = useSpeechRecognition(speechLang)
  const { speak } = useTTS()

  useEffect(() => {
    const raw = sessionStorage.getItem('retryWords')
    if (raw) {
      const w: Word[] = JSON.parse(raw)
      setWords(w.sort(() => Math.random() - 0.5))
    }
  }, [])

  const currentWord = words[index]
  const prompt = currentWord ? (direction === 'en-hr' ? currentWord.en : currentWord.hr) : ''
  const answer = currentWord ? (direction === 'en-hr' ? currentWord.hr : currentWord.en) : ''

  useEffect(() => {
    if (currentWord) setTimeout(() => speak(prompt, displayLang), 300)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, words.length])

  useEffect(() => {
    if (status !== 'done' || !currentWord) return
    const alternatives = getAlternatives()
    const correct = isCorrect(transcript, answer, alternatives)
    setHeardText(transcript)
    setFeedback(correct ? 'correct' : 'wrong')
    setResults((prev) => [...prev, { word: currentWord, direction, heard: transcript, correct }])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  function handleNext() {
    setFeedback(null)
    setHeardText('')
    if (index + 1 >= words.length) {
      sessionStorage.setItem('results', JSON.stringify(results))
      router.push('/summary')
    } else {
      setIndex((i) => i + 1)
    }
  }

  useEffect(() => {
    if (feedback === 'correct') {
      const t = setTimeout(handleNext, 1200)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback])

  if (!words.length) return null

  const progress = (index / words.length) * 100

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-red-50 to-slate-50">
      <div className="px-4 pt-6 pb-2 max-w-md mx-auto w-full">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.push('/')} className="text-slate-400 hover:text-slate-600 text-lg">←</button>
          <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
            <div className="bg-red-400 h-3 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-sm text-slate-500 font-medium">{index + 1} / {words.length}</span>
        </div>
        <p className="text-xs text-center text-red-400 font-medium">🔁 Ponovi pogrešne</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start px-4 pt-6 max-w-md mx-auto w-full">
        <div className="w-full bg-white rounded-3xl shadow-md border border-slate-100 p-8 text-center mb-6">
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">
            {direction === 'en-hr' ? 'English' : 'Hrvatski'}
          </p>
          <p className="text-4xl font-bold text-slate-800 mb-4">{prompt}</p>
          <button onClick={() => speak(prompt, displayLang)} className="text-indigo-400 hover:text-indigo-600 text-2xl">🔊</button>
        </div>

        {feedback && (
          <div className={`w-full rounded-2xl p-5 mb-5 text-center ${feedback === 'correct' ? 'bg-green-100 border border-green-300' : 'bg-red-50 border border-red-200'}`}>
            {feedback === 'correct' ? (
              <>
                <p className="text-3xl mb-1">✅</p>
                <p className="text-green-700 font-bold text-lg">Točno!</p>
                <p className="text-green-600 text-sm mt-1">Čuo/la sam: <span className="font-semibold">{heardText}</span></p>
              </>
            ) : (
              <>
                <p className="text-3xl mb-1">❌</p>
                <p className="text-red-600 font-bold text-lg">Nije točno</p>
                {heardText && <p className="text-red-500 text-sm mt-1">Čuo/la sam: <span className="font-semibold">{heardText}</span></p>}
                <p className="text-slate-600 text-sm mt-2">Točan odgovor: <span className="font-bold text-slate-800">{answer}</span></p>
                <button onClick={() => speak(answer, speechLang)} className="mt-2 text-sm text-indigo-500 underline">🔊 Čuj točan odgovor</button>
              </>
            )}
          </div>
        )}

        {!feedback ? (
          <button
            onPointerDown={start}
            onPointerUp={stop}
            onPointerLeave={stop}
            className={`w-24 h-24 rounded-full text-4xl shadow-lg transition-all active:scale-95 select-none ${status === 'listening' ? 'bg-red-500 text-white scale-110 animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            {status === 'listening' ? '🎙' : '🎤'}
          </button>
        ) : feedback === 'wrong' ? (
          <button onClick={handleNext} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl text-lg shadow active:scale-95 transition-transform">
            Nastavi →
          </button>
        ) : null}

        {status !== 'listening' && !feedback && (
          <p className="text-slate-400 text-sm mt-4 text-center">
            {direction === 'en-hr' ? 'Drži gumb i govori na hrvatskom' : 'Drži gumb i govori na engleskom'}
          </p>
        )}
      </div>
    </div>
  )
}
