import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await db.client.findUnique({
      where: {
        clientID: parseInt(params.id)
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Check if client exists
    const existingClient = await db.client.findUnique({
      where: {
        clientID: parseInt(params.id)
      }
    })

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Check if another client with the same name exists
    if (body.txtClient && body.txtClient !== existingClient.txtClient) {
      const duplicateClient = await db.client.findFirst({
        where: {
          txtClient: body.txtClient,
          NOT: {
            clientID: parseInt(params.id)
          }
        }
      })

      if (duplicateClient) {
        return NextResponse.json(
          { error: 'Client with this name already exists' },
          { status: 400 }
        )
      }
    }

    const client = await db.client.update({
      where: {
        clientID: parseInt(params.id)
      },
      data: {
        txtClient: body.txtClient,
        txtCompany: body.txtCompany || null,
        txtPhone: body.txtPhone || null,
        txtAddress: body.txtAddress || null
      }
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if client has existing rentals
    const existingRentals = await db.rentDetail.findMany({
      where: {
        clientID: parseInt(params.id)
      }
    })

    if (existingRentals.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete client with existing rentals' },
        { status: 400 }
      )
    }

    await db.client.delete({
      where: {
        clientID: parseInt(params.id)
      }
    })

    return NextResponse.json({ message: 'Client deleted successfully' })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}