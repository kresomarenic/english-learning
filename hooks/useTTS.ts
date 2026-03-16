'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Preferred British English voices, in priority order
const EN_GB_VOICE_NAMES = [
  'Google UK English Female',
  'Google UK English Male',
  'Microsoft Libby Online (Natural) - English (United Kingdom)',
  'Microsoft Ryan Online (Natural) - English (United Kingdom)',
  'Daniel',
  'Kate',
  'Serena',
]

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null

  if (lang === 'en-GB') {
    for (const name of EN_GB_VOICE_NAMES) {
      const v = voices.find((v) => v.name === name)
      if (v) return v
    }
    return voices.find((v) => v.lang === 'en-GB') ?? null
  }

  return voices.find((v) => v.lang.startsWith('hr')) ?? null
}

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  // Track when the current utterance started so we can detect stuck-speaking
  const speakStartedAt = useRef<number | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof window === 'undefined') return
      const speaking = window.speechSynthesis?.speaking ?? false

      if (speaking) {
        if (speakStartedAt.current === null) {
          speakStartedAt.current = Date.now()
        } else if (Date.now() - speakStartedAt.current > 6000) {
          // speechSynthesis.speaking is stuck true (known Chrome Android bug).
          // Force-cancel to unblock the mic button.
          window.speechSynthesis.cancel()
          speakStartedAt.current = null
          setIsSpeaking(false)
          return
        }
      } else {
        speakStartedAt.current = null
      }

      setIsSpeaking(speaking)
    }, 100)
    return () => clearInterval(timer)
  }, [])

  const speak = useCallback((text: string, lang: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()

    // 50 ms pause lets Chrome register the cancel() before we queue a new
    // utterance.  Without it the 100 ms poll can read speaking=false during
    // the gap between cancel() and speak(), briefly re-enabling the mic
    // button mid-transition and causing a mic/TTS audio conflict.
    setTimeout(() => {
      const utt = new SpeechSynthesisUtterance(text)
      utt.lang   = lang === 'en-US' ? 'en-GB' : lang
      utt.rate   = 0.78
      utt.pitch  = 1.0
      utt.volume = 1.0

      const voice = pickVoice(utt.lang)
      if (voice) utt.voice = voice

      window.speechSynthesis.speak(utt)
    }, 50)
  }, [])

  const cancel = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
  }, [])

  return { speak, cancel, isSpeaking }
}
