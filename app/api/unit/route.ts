import { NextRequest, NextResponse } from 'next/server'
import { getUnit } from '@/lib/content'

export function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  try {
    const unit = getUnit(slug)
    return NextResponse.json(unit)
  } catch {
    return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
  }
}
