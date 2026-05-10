import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { generateLandUid } from '../services/landUid';

const router = Router();

// Register a new parcel
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { stateCode, districtCode, talukCode, surveyNumber, village, areaSqm, boundaryWkt } = req.body;

    // Validate inputs
    if (!stateCode || !districtCode || !talukCode || !surveyNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if parcel already exists
    const existing = await prisma.parcel.findUnique({
      where: {
        stateCode_districtCode_talukCode_surveyNumber: {
          stateCode,
          districtCode,
          talukCode,
          surveyNumber
        }
      }
    });

    if (existing) {
      return res.status(409).json({ error: 'Parcel already exists for this survey number.' });
    }

    // Generate unique Land UID
    const landUid = await generateLandUid(stateCode, districtCode, talukCode);

    // Use parameterized query to prevent SQL injection
    let newParcelResult;
    if (boundaryWkt) {
      newParcelResult = await prisma.$queryRaw`
        INSERT INTO "parcels" (
          "id", "land_uid", "state_code", "district_code", "taluk_code", 
          "survey_number", "village", "area_sqm", "status", "boundary"
        ) VALUES (
          gen_random_uuid(), ${landUid}, ${stateCode}, ${districtCode}, ${talukCode},
          ${surveyNumber}, ${village || ''}, ${areaSqm ? Number(areaSqm) : null}::numeric, 
          'VERIFIED', ST_GeomFromText(${boundaryWkt}, 4326)
        )
        RETURNING *;
      `;
    } else {
      newParcelResult = await prisma.$queryRaw`
        INSERT INTO "parcels" (
          "id", "land_uid", "state_code", "district_code", "taluk_code", 
          "survey_number", "village", "area_sqm", "status"
        ) VALUES (
          gen_random_uuid(), ${landUid}, ${stateCode}, ${districtCode}, ${talukCode},
          ${surveyNumber}, ${village || ''}, ${areaSqm ? Number(areaSqm) : null}::numeric, 
          'VERIFIED'
        )
        RETURNING *;
      `;
    }

    res.status(201).json({ message: 'Parcel registered successfully', parcel: (newParcelResult as any[])[0] });

  } catch (error: any) {
    console.error('Error registering parcel:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Search parcels (by UID or Survey Number)
router.get('/search', async (req: Request, res: Response) => {
  try {
    const q = req.query.q;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchQuery = `%${String(q)}%`;
    
    // Parameterized query prevents SQL injection
    const parcels = await prisma.$queryRaw`
      SELECT "id", "land_uid", "state_code", "district_code", "taluk_code", 
             "survey_number", "village", "area_sqm", "status", 
             ST_AsGeoJSON("boundary") as "boundary_geojson"
      FROM "parcels"
      WHERE "land_uid" ILIKE ${searchQuery} OR "survey_number" ILIKE ${searchQuery}
      LIMIT 50;
    `;

    res.status(200).json({ parcels });
  } catch (error: any) {
    console.error('Error searching parcels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all parcels (for map rendering)
router.get('/all', async (req: Request, res: Response) => {
  try {
    const parcels = await prisma.$queryRaw`
      SELECT "id", "land_uid", "state_code", "district_code", "taluk_code", 
             "survey_number", "village", "area_sqm", "status",
             ST_AsGeoJSON("boundary") as "boundary_geojson"
      FROM "parcels"
      LIMIT 200;
    `;
    res.json({ parcels });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dashboard stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const totalParcels = await prisma.parcel.count();
    const frozenParcels = await prisma.parcel.count({ where: { status: 'FROZEN' } });
    const pendingParcels = await prisma.parcel.count({ where: { status: 'PENDING' } });
    const verifiedParcels = await prisma.parcel.count({ where: { status: 'VERIFIED' } });

    const activeCases = await prisma.courtCase.count({ where: { status: 'ACTIVE' } });
    const highRiskFlags = await prisma.fraudFlag.count({ where: { resolved: false } });
    const nriOwners = await prisma.owner.count({ where: { isNri: true } });
    const pendingMutations = await prisma.mutation.count({ where: { status: 'PENDING' } });

    res.json({
      totalParcels,
      frozenParcels,
      pendingParcels,
      verifiedParcels,
      activeCases,
      highRiskFlags,
      nriOwners,
      pendingMutations
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
