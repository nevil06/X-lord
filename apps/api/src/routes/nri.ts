import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Get NRI parcels and alerts
router.get('/:ownerId/alerts', async (req: Request, res: Response) => {
  try {
    const ownerId = req.params.ownerId as string;

    // Fetch parcels owned by this NRI
    const events = await prisma.ownershipEvent.findMany({
      where: { toOwnerId: ownerId },
      include: { parcel: true }
    });

    const parcelIds = events.map(e => e.parcelId);

    // Fetch any fraud flags or pending mutations for these parcels
    const alerts = await prisma.fraudFlag.findMany({
      where: { parcelId: { in: parcelIds }, resolved: false }
    });

    const pendingMutations = await prisma.mutation.findMany({
      where: { parcelId: { in: parcelIds }, status: 'PENDING' }
    });

    res.json({ 
      parcels: events.map((e: any) => e.parcel),
      alerts,
      pendingMutations
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;
