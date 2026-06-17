import { prisma } from './prisma';

const DEFAULT_COOLDOWN_DAYS = parseInt(process.env.DEFAULT_COOLDOWN_DAYS || '56', 10);

/**
 * Get the configured cooldown period in days from SystemConfig table,
 * falling back to the environment variable default.
 */
export async function getCooldownDays(): Promise<number> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'COOLDOWN_DAYS' },
    });
    if (config) {
      return parseInt(config.value, 10) || DEFAULT_COOLDOWN_DAYS;
    }
  } catch {
    // DB may not be ready yet, fall back
  }
  return DEFAULT_COOLDOWN_DAYS;
}

/**
 * Get the configured request expiry window in hours.
 */
export async function getExpiryHours(): Promise<number> {
  const DEFAULT_EXPIRY = parseInt(process.env.DEFAULT_REQUEST_EXPIRY_HOURS || '48', 10);
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'REQUEST_EXPIRY_HOURS' },
    });
    if (config) {
      return parseInt(config.value, 10) || DEFAULT_EXPIRY;
    }
  } catch {
    // fall back
  }
  return DEFAULT_EXPIRY;
}

/**
 * Check if a donor is eligible to donate based on their last donation date
 * and the configured cooldown period.
 * 
 * @returns true if the donor is eligible (past cooldown or never donated)
 */
export function checkEligibility(
  lastDonationDate: Date | null,
  cooldownDays: number
): boolean {
  if (!lastDonationDate) return true; // Never donated = eligible
  
  const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
  const now = new Date();
  const timeSinceLastDonation = now.getTime() - lastDonationDate.getTime();
  
  return timeSinceLastDonation >= cooldownMs;
}

/**
 * Calculate how many days until a donor becomes eligible again.
 * Returns 0 if already eligible.
 */
export function getDaysUntilEligible(
  lastDonationDate: Date | null,
  cooldownDays: number
): number {
  if (!lastDonationDate) return 0;
  
  const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
  const now = new Date();
  const eligibleDate = new Date(lastDonationDate.getTime() + cooldownMs);
  const remaining = eligibleDate.getTime() - now.getTime();
  
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / (24 * 60 * 60 * 1000));
}

/**
 * Update a donor's eligibility status in the database based on current cooldown rules.
 */
export async function updateDonorEligibility(donorId: string): Promise<boolean> {
  const cooldownDays = await getCooldownDays();
  const donor = await prisma.donorProfile.findUnique({
    where: { id: donorId },
  });
  
  if (!donor) return false;
  
  const isEligible = checkEligibility(donor.lastDonationDate, cooldownDays);
  
  if (donor.isEligible !== isEligible) {
    await prisma.donorProfile.update({
      where: { id: donorId },
      data: { isEligible },
    });
  }
  
  return isEligible;
}

/**
 * Recalculate eligibility for all donors. Useful after admin changes cooldown config.
 */
export async function recalculateAllEligibility(): Promise<void> {
  const cooldownDays = await getCooldownDays();
  const donors = await prisma.donorProfile.findMany();
  
  for (const donor of donors) {
    const isEligible = checkEligibility(donor.lastDonationDate, cooldownDays);
    if (donor.isEligible !== isEligible) {
      await prisma.donorProfile.update({
        where: { id: donor.id },
        data: { isEligible },
      });
    }
  }
}
