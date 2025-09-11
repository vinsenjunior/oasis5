import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const station = searchParams.get("station")
    const mediaGroup = searchParams.get("mediaGroup")
    const mediaSubGroup = searchParams.get("mediaSubGroup")
    const code = searchParams.get("code")
    
    const where: any = {}
    
    if (station) {
      where.txtStation = station
    }
    
    if (mediaGroup) {
      where.txtMediaGroup = mediaGroup
    }
    
    if (mediaSubGroup) {
      where.txtMediaSubGroup = mediaSubGroup
    }
    
    if (code) {
      where.txtCode = { contains: code }
    }
    
    const assets = await db.asset.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: {
        txtStation: "asc"
      }
    })
    
    return NextResponse.json(assets)
  } catch (error) {
    console.error("Error fetching assets:", error)
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const asset = await db.asset.create({
      data: {
        txtStation: body.txtStation,
        txtDesc: body.txtDesc || null,
        txtCode: body.txtCode,
        kodetitik: body.kodetitik || null, 
        txtMediaGroup: body.txtMediaGroup,
        txtMediaSubGroup: body.txtMediaSubGroup,
        intQty: body.intQty || 1,
        lnkMockup: body.lnkMockup || null,
        numvisualW: body.numvisualW || null,
        numvisualH: body.numvisualH || null,
        numsizeW: body.numsizeW || null,
        numsizeH: body.numsizeH || null,
        numsizeD: body.numsizeD || null,
        numsizeSQM: body.numsizeSQM || null,
        numweightmedia: body.numweightmedia || null,
        numweightstructure: body.numweightstructure || null,
        numpoweract: body.numpoweract || null,
        numpowerest: body.numpowerest || null,
        txtpixelpitch: body.txtpixelpitch || null,
        txtnotes: body.txtnotes || null
      }
    })
    
    return NextResponse.json(asset, { status: 201 })
  } catch (error) {
    console.error("Error creating asset:", error)
    return NextResponse.json(
      { error: "Failed to create asset" },
      { status: 500 }
    )
  }
}