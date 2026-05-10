import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Get all fraud flags (with optional resolved filter)
router.get('/', async (req: Request, res: Response) => {
  try {
    const resolved = req.query.resolved;
    
    const where = resolved !== undefined 
      ? { resolved: resolved === 'true' } 
      : {};
    
    const flags = await prisma.fraudFlag.findMany({
      where,
      include: { parcel: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({ flags });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Resolve a fraud flag
router.post('/:id/resolve', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { resolvedBy } = req.body;

    const flag = await prisma.fraudFlag.update({
      where: { id },
      data: { resolved: true, resolvedBy }
    });

    res.json({ message: 'Fraud flag resolved', flag });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get blockchain checkpoints
router.get('/blockchain', async (req: Request, res: Response) => {
  try {
    const checkpoints = await prisma.blockchainCheckpoint.findMany({
      orderBy: { blockNumber: 'desc' },
      take: 20
    });
    res.json({ checkpoints });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
