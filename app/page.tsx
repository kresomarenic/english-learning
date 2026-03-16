import { getAllUnits } from '@/lib/content'
import HomeClient from './HomeClient'

export default function Home() {
  const units = getAllUnits()
  return <HomeClient units={units} />
}
