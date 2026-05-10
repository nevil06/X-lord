import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data...');

  // Clean existing data (in correct order due to FK constraints)
  await prisma.alert.deleteMany();
  await prisma.fraudFlag.deleteMany();
  await prisma.mutation.deleteMany();
  await prisma.ownershipEvent.deleteMany();
  await prisma.courtCase.deleteMany();
  await prisma.blockchainCheckpoint.deleteMany();
  await prisma.document.deleteMany();
  await prisma.gisBoundary.deleteMany();
  await prisma.$executeRawUnsafe('DELETE FROM "parcels"');
  await prisma.owner.deleteMany();

  // ─── 1. Create Demo Owners ─────────────────────────────
  const owner1 = await prisma.owner.create({
    data: {
      fullName: 'Ramesh Gowda',
      phone: '+919876543210',
      address: '123 MG Road, Bengaluru, Karnataka',
      isNri: false,
    }
  });

  const owner2 = await prisma.owner.create({
    data: {
      fullName: 'Anjali Desai',
      email: 'anjali.d@example.com',
      phone: '+14155551234',
      isNri: true,
      country: 'USA',
      ociNumber: 'OCI-9283746',
    }
  });

  const owner3 = await prisma.owner.create({
    data: {
      fullName: 'Suresh Patil',
      phone: '+919123456789',
      address: '45 Gandhi Nagar, Mysuru, Karnataka',
      isNri: false,
    }
  });

  const ownerGovt = await prisma.owner.create({
    data: {
      fullName: 'Karnataka Revenue Dept (Govt)',
      address: 'Vidhana Soudha, Bengaluru',
      isNri: false,
    }
  });

  console.log(`Created owners: ${owner1.id}, ${owner2.id}, ${owner3.id}`);

  // ─── 2. Create Parcels with PostGIS Boundaries ─────────
  const parcels: any[] = [];

  const p1Result = await prisma.$queryRawUnsafe(`
    INSERT INTO "parcels" (
      "id", "land_uid", "state_code", "district_code", "taluk_code", 
      "survey_number", "village", "area_sqm", "status", "boundary"
    ) VALUES (
      gen_random_uuid(), 'KA-BLR-KRP-0000001', 'KA', 'BLR', 'KRP',
      '41/A', 'Devasandra', 1200.50, 'VERIFIED', 
      ST_GeomFromText('POLYGON((77.5946 12.9716, 77.5950 12.9716, 77.5950 12.9720, 77.5946 12.9720, 77.5946 12.9716))', 4326)
    ) RETURNING id;
  `) as any[];
  parcels.push({ id: p1Result[0].id, uid: 'KA-BLR-KRP-0000001' });

  const p2Result = await prisma.$queryRawUnsafe(`
    INSERT INTO "parcels" (
      "id", "land_uid", "state_code", "district_code", "taluk_code", 
      "survey_number", "village", "area_sqm", "status", "boundary"
    ) VALUES (
      gen_random_uuid(), 'KA-BLR-KRP-0000002', 'KA', 'BLR', 'KRP',
      '41/B', 'Devasandra', 850.00, 'PENDING', 
      ST_GeomFromText('POLYGON((77.5950 12.9716, 77.5955 12.9716, 77.5955 12.9720, 77.5950 12.9720, 77.5950 12.9716))', 4326)
    ) RETURNING id;
  `) as any[];
  parcels.push({ id: p2Result[0].id, uid: 'KA-BLR-KRP-0000002' });

  const p3Result = await prisma.$queryRawUnsafe(`
    INSERT INTO "parcels" (
      "id", "land_uid", "state_code", "district_code", "taluk_code", 
      "survey_number", "village", "area_sqm", "status", "boundary"
    ) VALUES (
      gen_random_uuid(), 'KA-MYS-HNK-0000001', 'KA', 'MYS', 'HNK',
      '112/1', 'Hinkal', 4000.00, 'FROZEN', 
      ST_GeomFromText('POLYGON((76.6135 12.3218, 76.6145 12.3218, 76.6145 12.3225, 76.6135 12.3225, 76.6135 12.3218))', 4326)
    ) RETURNING id;
  `) as any[];
  parcels.push({ id: p3Result[0].id, uid: 'KA-MYS-HNK-0000001' });

  const p4Result = await prisma.$queryRawUnsafe(`
    INSERT INTO "parcels" (
      "id", "land_uid", "state_code", "district_code", "taluk_code", 
      "survey_number", "village", "area_sqm", "status", "boundary"
    ) VALUES (
      gen_random_uuid(), 'KA-BLR-YLH-0000001', 'KA', 'BLR', 'YLH',
      '88/2A', 'Yelahanka', 2200.00, 'VERIFIED', 
      ST_GeomFromText('POLYGON((77.5800 13.1010, 77.5810 13.1010, 77.5810 13.1020, 77.5800 13.1020, 77.5800 13.1010))', 4326)
    ) RETURNING id;
  `) as any[];
  parcels.push({ id: p4Result[0].id, uid: 'KA-BLR-YLH-0000001' });

  console.log(`Created ${parcels.length} parcels.`);

  // ─── 3. Create Ownership Events (Lineage) ──────────────
  // Parcel 1: Govt Grant → Ramesh Gowda
  const event1 = await prisma.ownershipEvent.create({
    data: {
      parcelId: parcels[0].id,
      eventType: 'GRANT',
      fromOwnerId: ownerGovt.id,
      toOwnerId: owner1.id,
      eventDate: new Date('2015-03-15'),
      verifierId: 'SR-BLR-001',
      blockRef: '1',
      documentHash: crypto.createHash('sha256').update('grant-p1').digest('hex'),
      metadata: { type: 'Government Land Grant', district: 'Bengaluru Urban' }
    }
  });

  // Parcel 2: Ramesh → Anjali (Sale, Pending)
  const event2 = await prisma.ownershipEvent.create({
    data: {
      parcelId: parcels[1].id,
      eventType: 'GRANT',
      fromOwnerId: ownerGovt.id,
      toOwnerId: owner1.id,
      eventDate: new Date('2018-07-20'),
      verifierId: 'SR-BLR-001',
      blockRef: '2',
      documentHash: crypto.createHash('sha256').update('grant-p2').digest('hex'),
    }
  });

  const event3 = await prisma.ownershipEvent.create({
    data: {
      parcelId: parcels[1].id,
      eventType: 'SALE',
      fromOwnerId: owner1.id,
      toOwnerId: owner2.id,
      eventDate: new Date('2024-11-01'),
      verifierId: 'SR-BLR-092',
      blockRef: '3',
      documentHash: crypto.createHash('sha256').update('sale-p2').digest('hex'),
      metadata: { saleAmount: '₹45,00,000', registrationNumber: 'REG-2024-88201' }
    }
  });

  // Parcel 3: Suresh owns it, FROZEN due to court case
  const event4 = await prisma.ownershipEvent.create({
    data: {
      parcelId: parcels[2].id,
      eventType: 'GRANT',
      fromOwnerId: ownerGovt.id,
      toOwnerId: owner3.id,
      eventDate: new Date('2010-01-10'),
      verifierId: 'SR-MYS-004',
      blockRef: '4',
      documentHash: crypto.createHash('sha256').update('grant-p3').digest('hex'),
    }
  });

  const event5 = await prisma.ownershipEvent.create({
    data: {
      parcelId: parcels[2].id,
      eventType: 'FREEZE',
      toOwnerId: owner3.id,
      eventDate: new Date('2025-02-14'),
      verifierId: 'HC-KAR-BENCH-02',
      blockRef: '5',
      documentHash: crypto.createHash('sha256').update('freeze-p3').digest('hex'),
      metadata: { courtOrder: 'WP-2025-10492', reason: 'Disputed ownership boundary' }
    }
  });

  // Parcel 4: Anjali (NRI) owns it
  await prisma.ownershipEvent.create({
    data: {
      parcelId: parcels[3].id,
      eventType: 'REGISTRATION',
      fromOwnerId: ownerGovt.id,
      toOwnerId: owner2.id,
      eventDate: new Date('2020-06-01'),
      verifierId: 'SR-BLR-012',
      blockRef: '6',
      documentHash: crypto.createHash('sha256').update('reg-p4').digest('hex'),
    }
  });

  console.log('Created ownership lineage events.');

  // ─── 4. Create Blockchain Checkpoints ──────────────────
  for (let i = 1; i <= 6; i++) {
    await prisma.blockchainCheckpoint.create({
      data: {
        blockNumber: i,
        eventHash: crypto.createHash('sha256').update(`block-${i}`).digest('hex'),
        signer: i <= 2 ? 'SR-BLR-001' : i <= 4 ? 'SR-MYS-004' : 'HC-KAR-BENCH-02',
        parcelId: parcels[Math.min(i - 1, parcels.length - 1)].id,
        eventType: i === 5 ? 'FREEZE' : (i === 3 ? 'SALE' : 'GRANT'),
        txId: crypto.randomBytes(16).toString('hex'),
        timestamp: new Date(Date.now() - (6 - i) * 86400000) // Spaced 1 day apart
      }
    });
  }
  console.log('Created blockchain checkpoints.');

  // ─── 5. Create Mutations ───────────────────────────────
  await prisma.mutation.create({
    data: {
      parcelId: parcels[1].id,
      mutationType: 'SALE',
      status: 'PENDING',
      initiatorId: owner1.id,
    }
  });

  await prisma.mutation.create({
    data: {
      parcelId: parcels[2].id,
      mutationType: 'INHERITANCE',
      status: 'PENDING',
      initiatorId: owner3.id,
    }
  });

  await prisma.mutation.create({
    data: {
      parcelId: parcels[3].id,
      mutationType: 'CORRECTION',
      status: 'APPROVED',
      initiatorId: owner2.id,
      approvals: { approvedBy: 'SR-BLR-012', approvedAt: '2025-01-15' }
    }
  });
  console.log('Created mutations.');

  // ─── 6. Create Fraud Flags ─────────────────────────────
  await prisma.fraudFlag.create({
    data: {
      parcelId: parcels[1].id,
      flagType: 'VELOCITY_ANOMALY',
      riskScore: 78,
      explanation: 'Multiple transfer attempts detected within 48 hours for parcel KA-BLR-KRP-0000002. Potential velocity fraud pattern.',
      aiModel: 'IsolationForest-v1',
      resolved: false
    }
  });

  await prisma.fraudFlag.create({
    data: {
      parcelId: parcels[2].id,
      flagType: 'BOUNDARY_OVERLAP',
      riskScore: 92,
      explanation: 'GIS boundary for parcel KA-MYS-HNK-0000001 overlaps with adjacent survey 112/2 by 15%. Court investigation recommended.',
      aiModel: 'PostGIS-Overlap-v1',
      resolved: false
    }
  });

  await prisma.fraudFlag.create({
    data: {
      parcelId: parcels[0].id,
      flagType: 'DOCUMENT_MISMATCH',
      riskScore: 35,
      explanation: 'Minor discrepancy in owner name spelling between registration and mutation documents. Low risk.',
      aiModel: 'OCR-Compare-v1',
      resolved: true,
      resolvedBy: 'SR-BLR-001'
    }
  });
  console.log('Created fraud flags.');

  // ─── 7. Create Court Case ──────────────────────────────
  await prisma.courtCase.create({
    data: {
      parcelId: parcels[2].id,
      caseNumber: 'WP-2025-10492',
      courtName: 'Karnataka High Court, Bengaluru Bench',
      filingDate: new Date('2025-02-14'),
      status: 'ACTIVE',
      freezeStart: new Date('2025-02-14'),
    }
  });
  console.log('Created court case.');

  console.log('\n✅ Seeding complete. Demo data is ready.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
