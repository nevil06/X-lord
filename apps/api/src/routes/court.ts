import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { commitToBlockchain } from '../services/blockchain';

const router = Router();

// Freeze a parcel (Court Action)
router.post('/freeze', async (req: Request, res: Response) => {
  try {
    const { parcelId, courtOrderNumber, reason, officialId } = req.body;

    // 1. Update Parcel Status
    const parcel = await prisma.parcel.update({
      where: { id: parcelId },
      data: { status: 'FROZEN' }
    });

    // 2. Log Court Case
    const courtCase = await prisma.courtCase.create({
      data: {
        parcelId,
        caseNumber: courtOrderNumber,
        status: 'ACTIVE',
        filingDate: new Date(),
        freezeStart: new Date()
      }
    });

    // 3. Commit to Blockchain
    await commitToBlockchain(parcelId, 'FREEZE', { courtOrderNumber, reason }, officialId);

    res.json({ message: 'Parcel legally frozen successfully', parcel, courtCase });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Unfreeze a parcel
router.post('/unfreeze', async (req: Request, res: Response) => {
  try {
    const { parcelId, courtOrderNumber, reason, officialId } = req.body;

    const parcel = await prisma.parcel.update({
      where: { id: parcelId },
      data: { status: 'VERIFIED' }
    });

    await prisma.courtCase.updateMany({
      where: { parcelId, caseNumber: courtOrderNumber },
      data: { status: 'RESOLVED', freezeEnd: new Date() }
    });

    await commitToBlockchain(parcelId, 'UNFREEZE', { courtOrderNumber, reason }, officialId);

    res.json({ message: 'Parcel unfrozen successfully', parcel });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;
