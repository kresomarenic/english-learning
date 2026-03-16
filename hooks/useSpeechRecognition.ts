'use client'

import { useCallback, useRef, useState } from 'react'

type Status = 'idle' | 'listening' | 'done' | 'error' | 'unsupported'

interface RecognitionInstance extends EventTarget {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  onresult: ((this: RecognitionInstance, ev: SpeechRecognitionEvent) => void) | null
  onerror: ((this: RecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null
  onend: ((this: RecognitionInstance, ev: Event) => void) | null
  _alternatives?: string[]
}

declare global {
  interface Window {
    SpeechRecognition?: new () => RecognitionInstance
    webkitSpeechRecognition?: new () => RecognitionInstance
  }
}

export function useSpeechRecognition(lang: string) {
  const [status, setStatus] = useState<Status>('idle')
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<RecognitionInstance | null>(null)
  const statusRef = useRef<Status>('idle')
  const langRef = useRef(lang)
  langRef.current = lang

  // Create a fresh instance every time start() is called —
  // the Web Speech API instance cannot be restarted after onresult fires.
  const start = useCallback(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Ctor) {
      setStatus('unsupported')
      statusRef.current = 'unsupported'
      return
    }

    // Abort any previous instance cleanly
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* ignore */ }
      recognitionRef.current.onresult = null
      recognitionRef.current.onerror = null
      recognitionRef.current.onend = null
      recognitionRef.current = null
    }

    const rec = new Ctor()
    rec.lang = langRef.current
    rec.interimResults = false
    rec.maxAlternatives = 5

    rec.onresult = (e) => {
      const results: string[] = []
      for (let i = 0; i < e.results[0].length; i++) {
        results.push(e.results[0][i].transcript.trim().toLowerCase())
      }
      rec._alternatives = results
      setTranscript(results[0])
      setStatus('done')
      statusRef.current = 'done'
    }

    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') {
        setStatus('idle')
        statusRef.current = 'idle'
      } else {
        setStatus('error')
        statusRef.current = 'error'
      }
    }

    rec.onend = () => {
      if (statusRef.current === 'listening') {
        setStatus('idle')
        statusRef.current = 'idle'
      }
    }

    recognitionRef.current = rec
    setTranscript('')
    setStatus('listening')
    statusRef.current = 'listening'

    try {
      rec.start()
    } catch {
      setStatus('idle')
      statusRef.current = 'idle'
    }
  }, [])

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop() } catch { /* ignore */ }
  }, [])

  const reset = useCallback(() => {
    try { recognitionRef.current?.stop() } catch { /* ignore */ }
    setStatus('idle')
    setTranscript('')
    statusRef.current = 'idle'
  }, [])

  const getAlternatives = useCallback((): string[] => {
    return recognitionRef.current?._alternatives ?? []
  }, [])

  return { status, transcript, start, stop, reset, getAlternatives }
}
