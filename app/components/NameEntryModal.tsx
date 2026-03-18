'use client'

import { useState } from 'react'

interface Props {
  onSave: (name: string) => void
}

export default function NameEntryModal({ onSave }: Props) {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onSave(trimmed)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center">
        <p className="text-5xl mb-4">👋</p>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Dobrodošao/la!</h2>
        <p className="text-slate-500 text-sm mb-6">Upiši svoje ime da možemo početi.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Tvoje ime..."
            autoFocus
            className="w-full border-2 border-slate-200 focus:border-indigo-400 rounded-2xl px-4 py-3 text-lg text-center outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!value.trim()}
            className="w-full bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-2xl text-lg shadow active:scale-95 transition-all"
          >
            Počni →
          </button>
        </form>
      </div>
    </div>
  )
}
