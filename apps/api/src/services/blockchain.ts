import crypto from 'crypto';
import { prisma } from '../lib/prisma';

/**
 * Simulates a Hyperledger Fabric smart contract execution.
 * In a production environment, this would use the fabric-network SDK 
 * to submit a transaction to the chaincode.
 */
export const commitToBlockchain = async (
  parcelId: string, 
  eventType: string, 
  data: any, 
  signer: string
) => {
  // 1. Hash the document/data bundle
  const payloadStr = JSON.stringify(data);
  const eventHash = crypto.createHash('sha256').update(payloadStr).digest('hex');
  
  // 2. Generate a mock TxID (simulating Fabric TxID)
  const txId = crypto.randomBytes(16).toString('hex');
  
  // 3. Get next block number (simulating ordering service)
  const lastBlock = await prisma.blockchainCheckpoint.findFirst({
    orderBy: { blockNumber: 'desc' }
  });
  const nextBlockNum = lastBlock ? lastBlock.blockNumber + 1 : 1;

  // 4. Save the checkpoint
  const checkpoint = await prisma.blockchainCheckpoint.create({
    data: {
      blockNumber: nextBlockNum,
      eventHash,
      signer,
      parcelId,
      eventType,
      txId,
      timestamp: new Date()
    }
  });

  return {
    success: true,
    txId,
    blockNumber: nextBlockNum,
    eventHash,
    checkpointId: checkpoint.id
  };
};

export const verifyBlockchainRecord = async (blockNumber: number, providedHash: string) => {
  const block = await prisma.blockchainCheckpoint.findFirst({
    where: { blockNumber }
  });

  if (!block) return { valid: false, error: 'Block not found' };

  if (block.eventHash !== providedHash) {
    return { valid: false, error: 'Hash mismatch - Data has been tampered with' };
  }

  return { valid: true, block };
};
