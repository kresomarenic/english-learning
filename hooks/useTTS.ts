'use client'

import { useCallback } from 'react'

// Preferred British English voices, in priority order
const EN_GB_VOICE_NAMES = [
  'Google UK English Female',
  'Google UK English Male',
  'Microsoft Libby Online (Natural) - English (United Kingdom)',
  'Microsoft Ryan Online (Natural) - English (United Kingdom)',
  'Daniel',       // macOS/iOS British English
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
    // Fallback: any en-GB voice
    return voices.find((v) => v.lang === 'en-GB') ?? null
  }

  // For Croatian just use the first hr voice available
  return voices.find((v) => v.lang.startsWith('hr')) ?? null
}

export function useTTS() {
  const speak = useCallback((text: string, lang: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()

    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = lang === 'en-US' ? 'en-GB' : lang  // always use British English
    utt.rate = 0.78   // clear and deliberate
    utt.pitch = 1.0
    utt.volume = 1.0

    // Try to pick a good voice; voices may not be loaded yet on first call
    const voice = pickVoice(utt.lang)
    if (voice) utt.voice = voice

    window.speechSynthesis.speak(utt)
  }, [])

  return { speak }
}
