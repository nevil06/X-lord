import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Get all mutations (with optional status filter)
router.get('/', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    
    const where = status ? { status } : {};
    
    const mutations = await prisma.mutation.findMany({
      where,
      include: {
        parcel: true,
        initiator: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({ mutations });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Approve a mutation
router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { officerId } = req.body;

    const mutation = await prisma.mutation.update({
      where: { id },
      data: { 
        status: 'APPROVED',
        approvals: { approvedBy: officerId, approvedAt: new Date().toISOString() }
      },
      include: { parcel: true }
    });

    res.json({ message: 'Mutation approved', mutation });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Reject a mutation
router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;

    const mutation = await prisma.mutation.update({
      where: { id },
      data: { 
        status: 'REJECTED',
        rejectionReason: reason
      }
    });

    res.json({ message: 'Mutation rejected', mutation });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;
