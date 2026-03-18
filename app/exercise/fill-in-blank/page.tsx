import { getUnit } from '@/lib/content'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import FillInBlankClient from './FillInBlankClient'

interface Props {
  searchParams: Promise<{ slug?: string }>
}

export default async function FillInBlankPage({ searchParams }: Props) {
  const { slug } = await searchParams
  if (!slug) notFound()

  const unit = getUnit(slug)
  if (!unit.fillInBlanks || unit.fillInBlanks.length === 0) notFound()

  return (
    <Suspense>
      <FillInBlankClient fillInBlanks={unit.fillInBlanks} lessonTitle={unit.title} />
    </Suspense>
  )
}
