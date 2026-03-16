'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true)
      return
    }
    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Already running as installed PWA — hide button
  if (isStandalone) return null

  const handleClick = async () => {
    if (prompt) {
      await prompt.prompt()
      await prompt.userChoice
      setPrompt(null)
    } else {
      setShowInstructions(true)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        title="Instaliraj aplikaciju"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-blue-700 text-xs font-semibold rounded-full shadow-md border border-blue-100 transition-all hover:shadow-lg active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v13M8 11l4 4 4-4"/>
          <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/>
        </svg>
        Instaliraj
      </button>

      {/* Manual instructions modal */}
      {showInstructions && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4"
          onClick={() => setShowInstructions(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-slate-800 mb-1">Instaliraj aplikaciju</h2>
            <p className="text-slate-500 text-sm mb-4">Dodaj na početni zaslon u nekoliko koraka:</p>

            <div className="flex flex-col gap-3 mb-5">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <p className="text-sm text-slate-700">
                  Tapni <strong>⋮</strong> (tri točke) gore desno u Chromeu
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <p className="text-sm text-slate-700">
                  Odaberi <strong>„Dodaj na početni zaslon"</strong> ili <strong>„Instaliraj aplikaciju"</strong>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <p className="text-sm text-slate-700">
                  Tapni <strong>„Dodaj"</strong> za potvrdu
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInstructions(false)}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl active:scale-95 transition-transform"
            >
              Razumijem
            </button>
          </div>
        </div>
      )}
    </>
  )
}
