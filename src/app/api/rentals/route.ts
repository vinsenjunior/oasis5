import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rentId = searchParams.get("rentId")
    
    if (rentId) {
      const rental = await db.rentDetail.findUnique({
        where: { rentid: parseInt(rentId) },
        include: {
          asset: true,
          client: true
        }
      })
      
      return NextResponse.json(rental)
    }
    
    const rentals = await db.rentDetail.findMany({
      include: {
        asset: true,
        client: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })
    
    return NextResponse.json(rentals)
  } catch (error) {
    console.error("Error fetching rentals:", error)
    return NextResponse.json(
      { error: "Failed to fetch rentals" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Check for overlapping rentals
    const overlappingRental = await db.rentDetail.findFirst({
      where: {
        assetID: body.assetID,
        OR: [
          {
            AND: [
              { datestart: { lte: body.datestart } },
              { dateend: { gte: body.datestart } }
            ]
          },
          {
            AND: [
              { datestart: { lte: body.dateend } },
              { dateend: { gte: body.dateend } }
            ]
          },
          {
            AND: [
              { datestart: { gte: body.datestart } },
              { dateend: { lte: body.dateend } }
            ]
          }
        ]
      }
    })
    
    if (overlappingRental) {
      return NextResponse.json(
        { error: "Asset sudah disewa untuk periode tersebut" },
        { status: 400 }
      )
    }
    
    const rental = await db.rentDetail.create({
      data: {
        assetID: body.assetID,
        clientID: body.clientID,
        datestart: body.datestart,
        dateend: body.dateend,
        txtsales: body.txtsales || null,
        lnkreport: body.lnkreport || null,
        txtnotes: body.txtnotes || null
      },
      include: {
        asset: true,
        client: true
      }
    })
    
    return NextResponse.json(rental, { status: 201 })
  } catch (error) {
    console.error("Error creating rental:", error)
    return NextResponse.json(
      { error: "Failed to create rental" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { rentid, ...updateData } = body
    
    const rental = await db.rentDetail.update({
      where: { rentid: parseInt(rentid) },
      data: updateData,
      include: {
        asset: true,
        client: true
      }
    })
    
    return NextResponse.json(rental)
  } catch (error) {
    console.error("Error updating rental:", error)
    return NextResponse.json(
      { error: "Failed to update rental" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rentId = searchParams.get("rentId")
    
    if (!rentId) {
      return NextResponse.json(
        { error: "Rent ID is required" },
        { status: 400 }
      )
    }

    await db.rentDetail.delete({
      where: { rentid: parseInt(rentId) }
    })
    
    return NextResponse.json({ message: "Rental deleted successfully" })
  } catch (error) {
    console.error("Error deleting rental:", error)
    return NextResponse.json(
      { error: "Failed to delete rental" },
      { status: 500 }
    )
  }
}