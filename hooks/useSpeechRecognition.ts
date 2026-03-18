'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Status = 'idle' | 'listening' | 'done' | 'error' | 'denied' | 'unsupported'

interface RecognitionInstance extends EventTarget {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((ev: SpeechRecognitionEvent) => void) | null
  onerror:  ((ev: SpeechRecognitionErrorEvent) => void) | null
  onend:    ((ev: Event) => void) | null
}

declare global {
  interface Window {
    SpeechRecognition?:       new () => RecognitionInstance
    webkitSpeechRecognition?: new () => RecognitionInstance
  }
}

export function useSpeechRecognition(lang: string) {
  const [status, setStatus]         = useState<Status>('idle')
  const [transcript, setTranscript] = useState('')

  const recRef           = useRef<RecognitionInstance | null>(null)
  const sessionActiveRef = useRef(false)
  const pendingStartRef  = useRef(false)
  const statusRef        = useRef<Status>('idle')
  const langRef          = useRef(lang)
  const alternativesRef  = useRef<string[]>([])
  const spawnRef         = useRef<() => void>(() => {})

  langRef.current = lang

  useEffect(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Ctor) {
      setStatus('unsupported')
      statusRef.current = 'unsupported'
      return
    }

    // Fire-and-forget: obtain then immediately release a MediaStream.
    // This resets Chrome's internal audio pipeline so the next rec.start()
    // always gets real microphone input (workaround for Chrome Android bug
    // where rapid session cycling causes silent audio capture failure).
    // Called on mount AND after every session ends — runs while the user
    // is reading the word, so there is zero extra delay on tap.
    function warmUpMic() {
      navigator.mediaDevices
        ?.getUserMedia({ audio: true })
        .then(stream => stream.getTracks().forEach(t => t.stop()))
        .catch(() => { /* permission denied — SpeechRecognition handles it */ })
    }

    // Do NOT warm up on mount — doing so triggers the mic permission dialog
    // before the user has interacted with the mic button, which can lead to
    // accidental dismissal and subsequent 'not-allowed' errors.

    function spawn() {
      const rec = new Ctor()
      rec.lang            = langRef.current
      rec.interimResults  = false
      rec.maxAlternatives = 5

      rec.onresult = (e: SpeechRecognitionEvent) => {
        const results: string[] = []
        for (let i = 0; i < e.results[0].length; i++) {
          results.push(e.results[0][i].transcript.trim().toLowerCase())
        }
        alternativesRef.current = results
        setTranscript(results[0])
        setStatus('done')
        statusRef.current = 'done'
      }

      rec.onerror = (e: SpeechRecognitionErrorEvent) => {
        if (e.error === 'no-speech' || e.error === 'aborted') {
          if (statusRef.current === 'listening') {
            setStatus('idle')
            statusRef.current = 'idle'
          }
        } else if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          // Check actual mic permission — these errors can also fire for
          // unrelated reasons (no user gesture, Chrome service hiccup, etc.)
          // Only show the "denied" message if the browser explicitly says denied.
          navigator.permissions
            .query({ name: 'microphone' as PermissionName })
            .then((result) => {
              if (result.state === 'denied') {
                setStatus('denied')
                statusRef.current = 'denied'
              } else {
                // Permission is granted or prompt — treat as a transient error
                setStatus('idle')
                statusRef.current = 'idle'
              }
            })
            .catch(() => {
              // permissions API unavailable (e.g. Firefox) — just go idle
              setStatus('idle')
              statusRef.current = 'idle'
            })
        } else {
          setStatus('error')
          statusRef.current = 'error'
        }
      }

      rec.onend = () => {
        sessionActiveRef.current = false
        recRef.current = null

        // Warm up Chrome's audio NOW — the session just released the mic,
        // so getUserMedia is safe and finishes long before the user taps again.
        warmUpMic()

        if (pendingStartRef.current) {
          pendingStartRef.current = false
          spawn()
          return
        }

        if (statusRef.current === 'listening') {
          setStatus('idle')
          statusRef.current = 'idle'
        }
      }

      recRef.current = rec
      try {
        rec.start()
        sessionActiveRef.current = true
        // Set listening here so it's always in sync with actual rec state
        setStatus('listening')
        statusRef.current = 'listening'
      } catch {
        sessionActiveRef.current = false
        recRef.current = null
        setStatus('idle')
        statusRef.current = 'idle'
      }
    }

    spawnRef.current = spawn
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const start = useCallback(() => {
    if (statusRef.current === 'unsupported') return
    if (statusRef.current === 'listening') return  // already active
    // Allow retry from denied/error — user may have just granted permission
    if (statusRef.current === 'denied') {
      statusRef.current = 'idle'
      setStatus('idle')
    }

    setTranscript('')
    // Set listening immediately for instant button feedback,
    // spawn() will revert to idle if rec.start() throws
    setStatus('listening')
    statusRef.current = 'listening'

    if (sessionActiveRef.current) {
      pendingStartRef.current = true
      try { recRef.current?.abort() } catch { /* ignore */ }
    } else {
      pendingStartRef.current = false
      spawnRef.current()
    }
  }, [])

  const stop = useCallback(() => {
    pendingStartRef.current = false
    try { recRef.current?.stop() } catch { /* ignore */ }
  }, [])

  const reset = useCallback(() => {
    pendingStartRef.current = false

    const rec = recRef.current
    if (rec) {
      if (sessionActiveRef.current) {
        rec.onresult = null
        rec.onerror  = null
        rec.onend = () => {
          sessionActiveRef.current = false
          recRef.current = null
        }
        try { rec.abort() } catch { /* ignore */ }
      } else {
        // Session already ended — detach handlers only, NO abort().
        // Calling abort() on a dead session tricks Chrome into blocking
        // the next rec.start() (silent audio capture failure).
        rec.onresult = null
        rec.onerror  = null
        rec.onend    = null
        recRef.current = null
      }
    }

    sessionActiveRef.current = false
    alternativesRef.current  = []
    setStatus('idle')
    setTranscript('')
    statusRef.current = 'idle'
  }, [])

  const getAlternatives = useCallback((): string[] => alternativesRef.current, [])

  return { status, transcript, start, stop, reset, getAlternatives }
}
