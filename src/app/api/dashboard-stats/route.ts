import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma" // adjust path to your prisma client

export async function GET() {
  try {
    // current date for active rentals
    const today = new Date()

    // Run all queries in parallel
    const [totalAssets, totalClients, totalStations, activeRentals] = await Promise.all([
      prisma.asset.count(),
      prisma.client.count(),
      prisma.station.count(),
      prisma.rental.count({
        where: {
          datestart: { lte: today },
          dateend: { gte: today }
        }
      })
    ])

    return NextResponse.json({
      totalAssets,
      totalClients,
      totalStations,
      activeRentals
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
