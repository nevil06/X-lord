import { prisma } from '../lib/prisma';

/**
 * Generates a unique Land UID based on state, district, and taluk.
 * Format: {STATE}-{DISTRICT}-{TALUK}-{SERIAL}
 * Example: KA-BLR-KRP-0041792
 */
export const generateLandUid = async (
  stateCode: string,
  districtCode: string,
  talukCode: string
): Promise<string> => {
  const prefix = `${stateCode.toUpperCase()}-${districtCode.toUpperCase()}-${talukCode.toUpperCase()}`;
  
  // Find the highest serial number for this prefix
  const lastParcel = await prisma.parcel.findFirst({
    where: {
      landUid: {
        startsWith: prefix,
      },
    },
    orderBy: {
      landUid: 'desc',
    },
  });

  let nextSerial = 1;
  if (lastParcel) {
    const lastSerialStr = lastParcel.landUid.split('-').pop();
    if (lastSerialStr) {
      nextSerial = parseInt(lastSerialStr, 10) + 1;
    }
  }

  // Pad the serial number to 7 digits
  const paddedSerial = nextSerial.toString().padStart(7, '0');
  
  return `${prefix}-${paddedSerial}`;
};
