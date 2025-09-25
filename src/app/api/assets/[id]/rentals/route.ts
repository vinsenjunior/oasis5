import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rentals = await db.rentDetail.findMany({
      where: {
        assetID: params.id
      },
      include: {
        client: true
      },
      orderBy: {
        datestart: 'desc'
      }
    })

    return NextResponse.json(rentals)
  } catch (error) {
    console.error('Error fetching asset rentals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch asset rentals' },
      { status: 500 }
    )
  }
}