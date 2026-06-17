import { BloodRequest, DonorMatch, DonationRecord } from '@prisma/client';

/**
 * AI Service Integration (Server-only)
 * 
 * Safe wrapper around OpenAI or mocked AI fallback in case the API key is not present.
 */

// Fallback logic if OpenAI API Key is missing or invalid
const MOCK_AI = true;

/**
 * Call OpenAI GPT-4o-mini to classify emergency blood requests based on description and details.
 * returns "CRITICAL", "URGENT", or "STANDARD"
 */
export async function classifyRequestUrgency(
  description: string,
  suggestedUrgency: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || MOCK_AI) {
    // Basic heuristics-based NLP for fallback mock
    const descLower = description.toLowerCase();
    if (
      descLower.includes('icu') || 
      descLower.includes('accident') || 
      descLower.includes('emergency') || 
      descLower.includes('critical') || 
      descLower.includes('dying') || 
      descLower.includes('operation now') || 
      descLower.includes('immediate')
    ) {
      return 'CRITICAL';
    }
    if (
      descLower.includes('surgery') || 
      descLower.includes('thalessemia') || 
      descLower.includes('cancer') || 
      descLower.includes('urgent')
    ) {
      return 'URGENT';
    }
    return suggestedUrgency || 'STANDARD';
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant in a blood donation system in Pakistan. 
Analyze the request details and classify the case urgency into exactly one of these three categories:
- CRITICAL (immediate threat to life, e.g., active bleeding, major trauma, ICU emergency)
- URGENT (scheduled surgery soon, chronic transfusion needed within 24 hours)
- STANDARD (elective procedure, stable condition)

Respond only with the classification word (CRITICAL, URGENT, or STANDARD) and nothing else.`,
          },
          {
            role: 'user',
            content: `Suggested Urgency: ${suggestedUrgency}\nDescription: ${description}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 10,
      }),
    });

    const data = await response.json();
    const classification = data.choices?.[0]?.message?.content?.trim().toUpperCase();

    if (['CRITICAL', 'URGENT', 'STANDARD'].includes(classification)) {
      return classification;
    }
  } catch (error) {
    console.error('OpenAI classification error, falling back to heuristics:', error);
  }

  return suggestedUrgency || 'STANDARD';
}

/**
 * Estimate no-show risk score (0.0 to 1.0) for a donor based on their match and donation history.
 */
export async function estimateNoShowRisk(
  donorId: string,
  requestCity: string,
  requestArea: string,
  donorCity: string,
  donorArea: string
): Promise<number> {
  const apiKey = process.env.OPENAI_API_KEY;

  // 1. Gather donor history from DB to pass to model
  // (In dynamic setup we query matches and donation history to get real statistics)
  // Let's do a quick query or fallback
  let noShowCount = 0;
  let committedCount = 0;
  let donationCount = 0;

  try {
    const prisma = (await import('./prisma')).prisma;
    const matches = await prisma.donorMatch.findMany({
      where: { donorId },
      select: { fulfillmentStatus: true },
    });
    
    matches.forEach(m => {
      if (m.fulfillmentStatus === 'NO_SHOW') noShowCount++;
      if (m.fulfillmentStatus === 'COMMITTED' || m.fulfillmentStatus === 'DONATED') committedCount++;
    });

    const donor = await prisma.donorProfile.findUnique({
      where: { id: donorId },
      select: { totalDonations: true }
    });
    donationCount = donor?.totalDonations || 0;
  } catch {
    // DB not ready or error
  }

  const distanceMismatch = 
    requestCity.toLowerCase() !== donorCity.toLowerCase() ? 'different_cities' :
    requestArea.toLowerCase() !== donorArea.toLowerCase() ? 'different_areas' : 'same_area';

  if (!apiKey || MOCK_AI) {
    // Standard heuristics fallback
    let risk = 0.15; // Base risk

    if (noShowCount > 0) {
      risk += 0.3 * noShowCount; // Penalty for past no-shows
    }

    if (distanceMismatch === 'different_cities') {
      risk += 0.4; // High risk if in a different city
    } else if (distanceMismatch === 'different_areas') {
      risk += 0.1; // Moderate risk if different area
    }

    if (donationCount > 3) {
      risk -= 0.1; // Lower risk for highly active donors
    }

    return Math.max(0.01, Math.min(0.99, risk));
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant analyzing donor behavior. 
Calculate the probability of a donor failing to show up (No-Show Risk Score) as a float between 0.00 and 0.99.
Consider:
- Past no-show count: high penalty
- Past successful donations: positive buffer
- Distance mismatch: different city is very high risk (+0.4), different area is moderate risk (+0.1)

Respond with only a single numerical value (e.g. 0.25) and nothing else.`,
          },
          {
            role: 'user',
            content: `Donor profile:
- Total Donations: ${donationCount}
- Past Committed Matches: ${committedCount}
- Past No-Show Matches: ${noShowCount}
- Proximity: Request is in ${requestCity}/${requestArea}. Donor is in ${donorCity}/${donorArea}. Distance status: ${distanceMismatch}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 10,
      }),
    });

    const data = await response.json();
    const scoreText = data.choices?.[0]?.message?.content?.trim();
    const parsed = parseFloat(scoreText);

    if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
      return parsed;
    }
  } catch (error) {
    console.error('OpenAI risk score error, falling back to heuristics:', error);
  }

  // Final fallback
  return 0.15;
}
