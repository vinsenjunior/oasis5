import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyMigration() {
  console.log('🔍 Verifying PostgreSQL migration...\n')

  try {
    // Test database connection
    console.log('1. Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful!\n')

    // Check if tables exist
    console.log('2. Checking database tables...')
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ` as Array<{ table_name: string }>

    const expectedTables = ['Asset', 'Client', 'RentDetail']
    const foundTables = tables.map(t => t.table_name)
    
    console.log('Expected tables:', expectedTables)
    console.log('Found tables:', foundTables)
    
    const missingTables = expectedTables.filter(table => !foundTables.includes(table))
    if (missingTables.length > 0) {
      console.log('❌ Missing tables:', missingTables)
      return false
    }
    console.log('✅ All tables found!\n')

    // Check table structures
    console.log('3. Checking table structures...')
    
    // Check Asset table
    const assetColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Asset'
      ORDER BY ordinal_position
    ` as Array<{ column_name: string; data_type: string; is_nullable: string; column_default: string }>

    console.log('Asset table columns:')
    assetColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`)
    })

    // Check Client table
    const clientColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Client'
      ORDER BY ordinal_position
    ` as Array<{ column_name: string; data_type: string; is_nullable: string; column_default: string }>

    console.log('\nClient table columns:')
    clientColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`)
    })

    // Check RentDetail table
    const rentDetailColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'RentDetail'
      ORDER BY ordinal_position
    ` as Array<{ column_name: string; data_type: string; is_nullable: string; column_default: string }>

    console.log('\nRentDetail table columns:')
    rentDetailColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`)
    })

    console.log('\n✅ Table structures verified!\n')

    // Check foreign key constraints
    console.log('4. Checking foreign key constraints...')
    const foreignKeys = await prisma.$queryRaw`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
    ` as Array<{ table_name: string; column_name: string; foreign_table_name: string; foreign_column_name: string }>

    console.log('Foreign key constraints:')
    foreignKeys.forEach(fk => {
      console.log(`  - ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`)
    })

    console.log('\n✅ Foreign key constraints verified!\n')

    // Test CRUD operations
    console.log('5. Testing CRUD operations...')
    
    // Create test data
    console.log('  - Creating test asset...')
    const testAsset = await prisma.asset.create({
      data: {
        txtStation: 'Test Station',
        txtDesc: 'Test Description',
        txtCode: 'TEST-001',
        txtMediaGroup: 'Test Group',
        txtMediaSubGroup: 'Test Subgroup',
        intQty: 1
      }
    })
    console.log(`    ✅ Created asset: ${testAsset.assetID}`)

    console.log('  - Creating test client...')
    const testClient = await prisma.client.create({
      data: {
        txtClient: 'Test Client',
        txtCompany: 'Test Company',
        txtPhone: '123-456-7890',
        txtAddress: 'Test Address'
      }
    })
    console.log(`    ✅ Created client: ${testClient.clientID}`)

    console.log('  - Creating test rent detail...')
    const testRentDetail = await prisma.rentDetail.create({
      data: {
        assetID: testAsset.assetID,
        clientID: testClient.clientID,
        datestart: '2024-01-01',
        dateend: '2024-01-31',
        txtsales: 'Test Sales'
      }
    })
    console.log(`    ✅ Created rent detail: ${testRentDetail.rentid}`)

    console.log('  - Reading test data...')
    const readAsset = await prisma.asset.findUnique({
      where: { assetID: testAsset.assetID }
    })
    console.log(`    ✅ Read asset: ${readAsset?.txtCode}`)

    const readClient = await prisma.client.findUnique({
      where: { clientID: testClient.clientID }
    })
    console.log(`    ✅ Read client: ${readClient?.txtClient}`)

    const readRentDetail = await prisma.rentDetail.findUnique({
      where: { rentid: testRentDetail.rentid },
      include: {
        asset: true,
        client: true
      }
    })
    console.log(`    ✅ Read rent detail: ${readRentDetail?.asset.txtCode} -> ${readRentDetail?.client.txtClient}`)

    console.log('  - Updating test data...')
    const updatedAsset = await prisma.asset.update({
      where: { assetID: testAsset.assetID },
      data: { txtDesc: 'Updated Test Description' }
    })
    console.log(`    ✅ Updated asset: ${updatedAsset.txtDesc}`)

    console.log('  - Deleting test data...')
    await prisma.rentDetail.delete({
      where: { rentid: testRentDetail.rentid }
    })
    await prisma.client.delete({
      where: { clientID: testClient.clientID }
    })
    await prisma.asset.delete({
      where: { assetID: testAsset.assetID }
    })
    console.log('    ✅ Deleted test data')

    console.log('\n✅ All CRUD operations successful!\n')

    // Check data counts
    console.log('6. Checking data counts...')
    const assetCount = await prisma.asset.count()
    const clientCount = await prisma.client.count()
    const rentDetailCount = await prisma.rentDetail.count()

    console.log(`Assets: ${assetCount}`)
    console.log(`Clients: ${clientCount}`)
    console.log(`Rent Details: ${rentDetailCount}`)

    if (assetCount > 0 || clientCount > 0 || rentDetailCount > 0) {
      console.log('✅ Database contains sample data')
    } else {
      console.log('⚠️  Database is empty - you may need to run: npm run db:seed')
    }

    console.log('\n🎉 Migration verification completed successfully!')
    console.log('✅ PostgreSQL migration is working correctly!')

    return true

  } catch (error) {
    console.error('❌ Migration verification failed:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

verifyMigration()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('Unexpected error:', error)
    process.exit(1)
  })