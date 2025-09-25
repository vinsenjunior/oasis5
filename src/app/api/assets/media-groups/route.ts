import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const mediaGroups = await db.asset.findMany({
      select: {
        txtMediaGroup: true
      },
      distinct: ['txtMediaGroup'],
      orderBy: {
        txtMediaGroup: 'asc'
      }
    })

    return NextResponse.json(mediaGroups.map(g => g.txtMediaGroup))
  } catch (error) {
    console.error('Error fetching media groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media groups' },
      { status: 500 }
    )
  }
}