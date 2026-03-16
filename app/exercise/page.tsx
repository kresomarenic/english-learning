import { Suspense } from 'react'
import ExerciseClient from './ExerciseClient'

export default function ExercisePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-slate-400">Učitavanje...</div>}>
      <ExerciseClient />
    </Suspense>
  )
}
