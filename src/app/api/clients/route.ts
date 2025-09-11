import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const clients = await db.client.findMany({
      orderBy: {
        txtClient: "asc"
      }
    })
    
    return NextResponse.json(clients)
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const client = await db.client.create({
      data: {
        txtClient: body.txtClient,
        txtCompany: body.txtCompany || null,
        txtPhone: body.txtPhone || null,
        txtAddress: body.txtAddress || null
      }
    })
    
    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    )
  }
}