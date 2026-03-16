'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Status = 'idle' | 'listening' | 'done' | 'error' | 'unsupported'

interface RecognitionInstance extends EventTarget {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((ev: SpeechRecognitionEvent) => void) | null
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null
  onend: ((ev: Event) => void) | null
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

  const recRef      = useRef<RecognitionInstance | null>(null)
  const statusRef   = useRef<Status>('idle')
  const langRef     = useRef(lang)
  // true  = onend has fired, safe to call start() again
  const endedRef    = useRef(true)
  // true  = start() was called while a session was still ending — retry in onend
  const pendingRef  = useRef(false)

  langRef.current = lang

  // Create ONE instance for the lifetime of the component
  useEffect(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Ctor) {
      setStatus('unsupported')
      statusRef.current = 'unsupported'
      return
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
      endedRef.current = true
      if (e.error === 'no-speech' || e.error === 'aborted') {
        if (statusRef.current === 'listening') {
          setStatus('idle')
          statusRef.current = 'idle'
        }
      } else {
        setStatus('error')
        statusRef.current = 'error'
      }
    }

    rec.onend = () => {
      endedRef.current = true

      // A new start() was called while the session was still closing — fire it now
      if (pendingRef.current) {
        pendingRef.current = false
        rec.lang = langRef.current
        endedRef.current = false
        try {
          rec.start()
        } catch {
          setStatus('idle')
          statusRef.current = 'idle'
          endedRef.current = true
        }
        return
      }

      if (statusRef.current === 'listening') {
        setStatus('idle')
        statusRef.current = 'idle'
      }
    }

    recRef.current = rec
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty — one instance for the whole session

  const start = useCallback(() => {
    const rec = recRef.current
    if (!rec || statusRef.current === 'unsupported') return

    setTranscript('')
    setStatus('listening')
    statusRef.current = 'listening'
    rec.lang = langRef.current

    if (endedRef.current) {
      // Previous session has fully ended — start immediately
      endedRef.current = false
      pendingRef.current = false
      try {
        rec.start()
      } catch {
        setStatus('idle')
        statusRef.current = 'idle'
        endedRef.current = true
      }
    } else {
      // Session still closing — stop it and let onend restart it
      pendingRef.current = true
      try { rec.stop() } catch { /* ignore */ }
    }
  }, [])

  const stop = useCallback(() => {
    pendingRef.current = false
    try { recRef.current?.stop() } catch { /* ignore */ }
  }, [])

  const reset = useCallback(() => {
    pendingRef.current = false
    if (statusRef.current === 'listening') {
      try { recRef.current?.stop() } catch { /* ignore */ }
    }
    setStatus('idle')
    setTranscript('')
    statusRef.current = 'idle'
  }, [])

  const getAlternatives = useCallback((): string[] => {
    return recRef.current?._alternatives ?? []
  }, [])

  return { status, transcript, start, stop, reset, getAlternatives }
}
