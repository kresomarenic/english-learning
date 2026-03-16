'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

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

  useEffect(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Ctor) {
      setStatus('unsupported')
      statusRef.current = 'unsupported'
      return
    }

    const rec = new Ctor()
    rec.lang = lang
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
      if (e.error === 'no-speech') {
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
  }, [lang])

  const start = useCallback(() => {
    if (!recognitionRef.current) return
    setTranscript('')
    setStatus('listening')
    statusRef.current = 'listening'
    recognitionRef.current.start()
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const getAlternatives = useCallback((): string[] => {
    return recognitionRef.current?._alternatives ?? []
  }, [])

  return { status, transcript, start, stop, getAlternatives }
}
