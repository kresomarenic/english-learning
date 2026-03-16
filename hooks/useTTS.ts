'use client'

import { useCallback, useEffect, useState } from 'react'

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
  // Poll the real browser state — utterance events (onend/onstart) are
  // unreliable on Android Chrome and often don't fire, causing stuck states.
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      const speaking = typeof window !== 'undefined'
        ? (window.speechSynthesis?.speaking ?? false)
        : false
      setIsSpeaking(speaking)
    }, 100)
    return () => clearInterval(timer)
  }, [])

  const speak = useCallback((text: string, lang: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()

    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = lang === 'en-US' ? 'en-GB' : lang
    utt.rate = 0.78
    utt.pitch = 1.0
    utt.volume = 1.0

    const voice = pickVoice(utt.lang)
    if (voice) utt.voice = voice

    window.speechSynthesis.speak(utt)
  }, [])

  const cancel = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
  }, [])

  return { speak, cancel, isSpeaking }
}
