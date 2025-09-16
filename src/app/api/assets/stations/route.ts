import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const stations = await db.asset.findMany({
      select: {
        txtStation: true
      },
      distinct: ['txtStation'],
      orderBy: {
        txtStation: 'asc'
      }
    })

    return NextResponse.json(stations.map(s => s.txtStation))
  } catch (error) {
    console.error('Error fetching stations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stations' },
      { status: 500 }
    )
  }
}