import { BloodGroup } from '@prisma/client';

/**
 * Blood Group Compatibility Matrix
 * 
 * Maps each RECIPIENT blood group to the list of DONOR blood groups
 * that can safely donate to them.
 * 
 * Based on standard medical guidelines:
 * - O- is the universal donor (can donate to anyone)
 * - AB+ is the universal receiver (can receive from anyone)
 */
export const COMPATIBILITY_MATRIX: Record<BloodGroup, BloodGroup[]> = {
  [BloodGroup.O_NEG]:  [BloodGroup.O_NEG],
  [BloodGroup.O_POS]:  [BloodGroup.O_NEG, BloodGroup.O_POS],
  [BloodGroup.A_NEG]:  [BloodGroup.O_NEG, BloodGroup.A_NEG],
  [BloodGroup.A_POS]:  [BloodGroup.O_NEG, BloodGroup.O_POS, BloodGroup.A_NEG, BloodGroup.A_POS],
  [BloodGroup.B_NEG]:  [BloodGroup.O_NEG, BloodGroup.B_NEG],
  [BloodGroup.B_POS]:  [BloodGroup.O_NEG, BloodGroup.O_POS, BloodGroup.B_NEG, BloodGroup.B_POS],
  [BloodGroup.AB_NEG]: [BloodGroup.O_NEG, BloodGroup.A_NEG, BloodGroup.B_NEG, BloodGroup.AB_NEG],
  [BloodGroup.AB_POS]: [BloodGroup.O_NEG, BloodGroup.O_POS, BloodGroup.A_NEG, BloodGroup.A_POS, BloodGroup.B_NEG, BloodGroup.B_POS, BloodGroup.AB_NEG, BloodGroup.AB_POS],
};

/**
 * Reverse matrix: Maps each DONOR blood group to the list of RECIPIENT
 * blood groups they can donate to.
 */
export const DONATION_MATRIX: Record<BloodGroup, BloodGroup[]> = {
  [BloodGroup.O_NEG]:  [BloodGroup.O_NEG, BloodGroup.O_POS, BloodGroup.A_NEG, BloodGroup.A_POS, BloodGroup.B_NEG, BloodGroup.B_POS, BloodGroup.AB_NEG, BloodGroup.AB_POS],
  [BloodGroup.O_POS]:  [BloodGroup.O_POS, BloodGroup.A_POS, BloodGroup.B_POS, BloodGroup.AB_POS],
  [BloodGroup.A_NEG]:  [BloodGroup.A_NEG, BloodGroup.A_POS, BloodGroup.AB_NEG, BloodGroup.AB_POS],
  [BloodGroup.A_POS]:  [BloodGroup.A_POS, BloodGroup.AB_POS],
  [BloodGroup.B_NEG]:  [BloodGroup.B_NEG, BloodGroup.B_POS, BloodGroup.AB_NEG, BloodGroup.AB_POS],
  [BloodGroup.B_POS]:  [BloodGroup.B_POS, BloodGroup.AB_POS],
  [BloodGroup.AB_NEG]: [BloodGroup.AB_NEG, BloodGroup.AB_POS],
  [BloodGroup.AB_POS]: [BloodGroup.AB_POS],
};

/**
 * Get all donor blood groups that are compatible with the given recipient blood group.
 */
export function getCompatibleDonorGroups(recipientGroup: BloodGroup): BloodGroup[] {
  return COMPATIBILITY_MATRIX[recipientGroup] || [];
}

/**
 * Check if a donor with the given blood group can donate to a recipient.
 */
export function canDonateTo(donorGroup: BloodGroup, recipientGroup: BloodGroup): boolean {
  return COMPATIBILITY_MATRIX[recipientGroup]?.includes(donorGroup) ?? false;
}

/**
 * Get all recipient blood groups that a donor can donate to.
 */
export function getRecipientGroups(donorGroup: BloodGroup): BloodGroup[] {
  return DONATION_MATRIX[donorGroup] || [];
}

/**
 * Get human-readable blood group label (e.g., "A_POS" → "A+")
 */
export function formatBloodGroup(group: BloodGroup): string {
  const map: Record<BloodGroup, string> = {
    [BloodGroup.A_POS]: 'A+',
    [BloodGroup.A_NEG]: 'A−',
    [BloodGroup.B_POS]: 'B+',
    [BloodGroup.B_NEG]: 'B−',
    [BloodGroup.AB_POS]: 'AB+',
    [BloodGroup.AB_NEG]: 'AB−',
    [BloodGroup.O_POS]: 'O+',
    [BloodGroup.O_NEG]: 'O−',
  };
  return map[group] || group;
}

/**
 * Get all blood groups in display order.
 */
export function getAllBloodGroups(): BloodGroup[] {
  return [
    BloodGroup.A_POS,
    BloodGroup.A_NEG,
    BloodGroup.B_POS,
    BloodGroup.B_NEG,
    BloodGroup.AB_POS,
    BloodGroup.AB_NEG,
    BloodGroup.O_POS,
    BloodGroup.O_NEG,
  ];
}
