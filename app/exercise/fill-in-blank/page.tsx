import { getUnit } from '@/lib/content'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import FillInBlankClient from './FillInBlankClient'
import { FillInBlank } from '@/types/content'

interface Props {
  searchParams: Promise<{ slugs?: string }>
}

export default async function FillInBlankPage({ searchParams }: Props) {
  const { slugs } = await searchParams
  if (!slugs) notFound()

  const slugList = slugs.split(',').map((s) => s.trim()).filter(Boolean)
  if (slugList.length === 0) notFound()

  const allFillInBlanks: FillInBlank[] = []
  let lessonTitle = 'Rečenice'

  for (let i = 0; i < slugList.length; i++) {
    const unit = getUnit(slugList[i])
    if (i === 0 && slugList.length === 1) lessonTitle = unit.title
    if (unit.fillInBlanks && unit.fillInBlanks.length > 0) {
      allFillInBlanks.push(...unit.fillInBlanks)
    }
  }

  if (allFillInBlanks.length === 0) notFound()

  return (
    <Suspense>
      <FillInBlankClient fillInBlanks={allFillInBlanks} lessonTitle={lessonTitle} />
    </Suspense>
  )
}
