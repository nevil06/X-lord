import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { commitToBlockchain } from '../services/blockchain';

const router = Router();

// Get the ownership lineage timeline for a parcel
router.get('/:parcelUid', async (req: Request, res: Response) => {
  try {
    const parcelUid = req.params.parcelUid as string;

    const parcel = await prisma.parcel.findUnique({
      where: { landUid: parcelUid },
      include: {
        ownershipEvents: {
          orderBy: { eventDate: 'asc' },
          include: {
            fromOwner: true,
            toOwner: true
          }
        }
      }
    });

    if (!parcel) {
      return res.status(404).json({ error: 'Parcel not found' });
    }

    const { ownershipEvents, ...parcelData } = parcel;
    const latestEvent = ownershipEvents.length > 0 ? ownershipEvents[ownershipEvents.length - 1] : null;
    const currentOwner = latestEvent ? latestEvent.toOwner : null;

    res.json({ 
      parcel: {
        ...parcelData,
        currentOwner
      }, 
      events: ownershipEvents 
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Record a new ownership event (Mutation, Transfer, Freeze)
router.post('/record', async (req: Request, res: Response) => {
  try {
    const { parcelId, eventType, fromOwnerId, toOwnerId, verifierId, metadata } = req.body;

    // 1. Record the event in the DB
    const event = await prisma.ownershipEvent.create({
      data: {
        parcelId,
        eventType,
        fromOwnerId,
        toOwnerId,
        verifierId,
        eventDate: new Date(),
        metadata: metadata || {}
      }
    });

    // 2. Commit the state change to the Blockchain
    const bcResult = await commitToBlockchain(
      parcelId, 
      eventType, 
      event, 
      verifierId || 'SYSTEM'
    );

    // 3. Update the event with the blockchain block reference
    const updatedEvent = await prisma.ownershipEvent.update({
      where: { id: event.id },
      data: {
        blockRef: bcResult.blockNumber.toString(),
        documentHash: bcResult.eventHash
      }
    });

    res.status(201).json({ 
      message: 'Lineage event recorded securely', 
      event: updatedEvent,
      blockchain: bcResult
    });

  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;
