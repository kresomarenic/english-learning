import { Suspense } from 'react'
import RetryClient from './RetryClient'

export default function RetryPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-slate-400">Učitavanje...</div>}>
      <RetryClient />
    </Suspense>
  )
}
