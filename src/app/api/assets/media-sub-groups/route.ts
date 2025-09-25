import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const mediaSubGroups = await db.asset.findMany({
      select: {
        txtMediaSubGroup: true
      },
      distinct: ['txtMediaSubGroup'],
      orderBy: {
        txtMediaSubGroup: 'asc'
      }
    })

    return NextResponse.json(mediaSubGroups.map(g => g.txtMediaSubGroup))
  } catch (error) {
    console.error('Error fetching media sub groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media sub groups' },
      { status: 500 }
    )
  }
}