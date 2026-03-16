import fs from 'fs'
import path from 'path'
import { Unit, UnitMeta } from '@/types/content'

const CONTENT_DIR = path.join(process.cwd(), 'content')

export function getAllUnits(): UnitMeta[] {
  const units: UnitMeta[] = []

  const gradeDirs = fs.readdirSync(CONTENT_DIR).filter((d) =>
    fs.statSync(path.join(CONTENT_DIR, d)).isDirectory()
  )

  for (const gradeDir of gradeDirs.sort()) {
    const gradePath = path.join(CONTENT_DIR, gradeDir)
    const files = fs.readdirSync(gradePath).filter((f) => f.endsWith('.json')).sort()

    for (const file of files) {
      const raw = fs.readFileSync(path.join(gradePath, file), 'utf-8')
      const unit: Unit = JSON.parse(raw)
      units.push({
        grade: unit.grade,
        unit: unit.unit,
        title: unit.title,
        titleHr: unit.titleHr,
        wordCount: unit.words.length,
        slug: `${gradeDir}/${file.replace('.json', '')}`,
      })
    }
  }

  return units
}

export function getUnit(slug: string): Unit {
  const filePath = path.join(CONTENT_DIR, `${slug}.json`)
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw)
}

export function getAllWords() {
  const units = getAllUnits()
  return units.flatMap((meta) => {
    const unit = getUnit(meta.slug)
    return unit.words
  })
}
