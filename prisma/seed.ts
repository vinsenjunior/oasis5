import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.rentDetail.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.client.deleteMany()

  // Create sample clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        txtClient: 'PT. Adira Dinamika Multifinance',
        txtCompany: 'Adira Finance',
        txtPhone: '021-12345678',
        txtAddress: 'Jakarta Selatan'
      }
    }),
    prisma.client.create({
      data: {
        txtClient: 'PT. Bank Central Asia Tbk',
        txtCompany: 'BCA',
        txtPhone: '021-23456789',
        txtAddress: 'Jakarta Pusat'
      }
    }),
    prisma.client.create({
      data: {
        txtClient: 'PT. Telkom Indonesia Tbk',
        txtCompany: 'Telkom',
        txtPhone: '021-34567890',
        txtAddress: 'Bandung'
      }
    }),
    prisma.client.create({
      data: {
        txtClient: 'PT. Unilever Indonesia Tbk',
        txtCompany: 'Unilever',
        txtPhone: '021-45678901',
        txtAddress: 'Jakarta Barat'
      }
    }),
    prisma.client.create({
      data: {
        txtClient: 'PT. Indofood Sukses Makmur Tbk',
        txtCompany: 'Indofood',
        txtPhone: '021-56789012',
        txtAddress: 'Jakarta Utara'
      }
    })
  ])

  // Create sample assets for MRT stations
  const stations = ['Lebak Bulus', 'Fatmawati', 'Cipete Raya', 'Haji Nawi', 'Blok A', 'Blok M', 'ASEAN', 'Senayan', 'Istora Mandiri', 'Bendungan Hilir', 'Setiabudi', 'Dukuh Atas BNI', 'Bundaran HI']
  
  const mediaGroups = ['Digital', 'Print', 'LED Screen', 'Billboard', 'Transit Media']
  const mediaSubGroups = ['Indoor', 'Outdoor', 'Platform', 'Concourse', 'Exit', 'Entrance', 'Ticket Hall']

  const assets = []
  
  for (let i = 0; i < stations.length; i++) {
    const station = stations[i]
    const assetsPerStation = Math.floor(Math.random() * 3) + 2 // 2-4 assets per station
    
    for (let j = 0; j < assetsPerStation; j++) {
      const mediaGroup = mediaGroups[Math.floor(Math.random() * mediaGroups.length)]
      const mediaSubGroup = mediaSubGroups[Math.floor(Math.random() * mediaSubGroups.length)]
      
      const asset = await prisma.asset.create({
        data: {
          txtStation: station,
          txtDesc: `${mediaGroup} advertising space at ${station} MRT station`,
          txtCode: `${station.substring(0, 3).toUpperCase()}-${mediaGroup.substring(0, 3).toUpperCase()}-${String(j + 1).padStart(2, '0')}`,
          kodetitik: `${station.substring(0, 3).toUpperCase()}-${mediaGroup.substring(0, 3).toUpperCase()}-${String(j + 1).padStart(2, '0')}-${Math.floor(Math.random() * 999) + 1}`,
          txtMediaGroup: mediaGroup,
          txtMediaSubGroup: mediaSubGroup,
          intQty: Math.floor(Math.random() * 5) + 1,
          lnkMockup: `https://via.placeholder.com/300x200?text=${station}-${mediaGroup}`,
          numvisualW: `${Math.floor(Math.random() * 10) + 5}m`,
          numvisualH: `${Math.floor(Math.random() * 5) + 2}m`,
          numsizeW: `${Math.floor(Math.random() * 10) + 5}m`,
          numsizeH: `${Math.floor(Math.random() * 5) + 2}m`,
          numsizeD: `${Math.floor(Math.random() * 2) + 0.5}m`,
          numsizeSQM: `${(Math.random() * 50 + 10).toFixed(2)}`,
          numweightmedia: `${(Math.random() * 100 + 50).toFixed(2)}kg`,
          numweightstructure: `${(Math.random() * 200 + 100).toFixed(2)}kg`,
          numpoweract: `${Math.floor(Math.random() * 500) + 100}W`,
          numpowerest: `${Math.floor(Math.random() * 600) + 150}W`,
          txtpixelpitch: `${Math.floor(Math.random() * 5) + 2}mm`,
          txtnotes: `High visibility ${mediaGroup.toLowerCase()} advertising location with excellent foot traffic.`
        }
      })
      assets.push(asset)
    }
  }

  // Create some sample rentals
  const today = new Date()
  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + 30)

  await Promise.all([
    prisma.rentDetail.create({
      data: {
        assetID: assets[0].assetID,
        clientID: clients[0].clientID,
        datestart: today.toISOString().split('T')[0],
        dateend: futureDate.toISOString().split('T')[0],
        txtsales: 'John Doe',
        txtnotes: 'Premium placement for Q4 campaign'
      }
    }),
    prisma.rentDetail.create({
      data: {
        assetID: assets[5].assetID,
        clientID: clients[1].clientID,
        datestart: today.toISOString().split('T')[0],
        dateend: futureDate.toISOString().split('T')[0],
        txtsales: 'Jane Smith',
        txtnotes: 'Brand awareness campaign'
      }
    }),
    prisma.rentDetail.create({
      data: {
        assetID: assets[10].assetID,
        clientID: clients[2].clientID,
        datestart: today.toISOString().split('T')[0],
        dateend: futureDate.toISOString().split('T')[0],
        txtsales: 'Mike Johnson',
        txtnotes: 'Product launch promotion'
      }
    })
  ])

  console.log('✅ Database seeded successfully!')
  console.log(`📊 Created ${clients.length} clients, ${assets.length} assets, and 3 rentals`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })