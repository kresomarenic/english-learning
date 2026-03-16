import { NextResponse } from 'next/server'
import { getAllUnits } from '@/lib/content'

export function GET() {
  const units = getAllUnits()
  return NextResponse.json(units)
}
