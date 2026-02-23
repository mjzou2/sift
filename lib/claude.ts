import Anthropic from '@anthropic-ai/sdk';
import { getPhrases } from './embeddings';

const TAGS = [
  'piano', 'guitar',
  'sad', 'melancholic', 'nostalgic', 'hopeful', 'peaceful', 'dark', 'lonely',
  'slow', 'mellow', 'sleepy', 'upbeat', 'groovy', 'bossa nova',
  'vinyl crackle', 'ambient', 'spacey', 'bass-heavy', 'minimal',
  'rain', 'ocean', 'night', 'cafe', 'winter', 'home', 'nature', 'space',
  'cozy', 'warm', 'dreamy', 'focus', 'jazz', 'chill',
] as const;

const TAG_SET = new Set<string>(TAGS);

const SYSTEM_PROMPT = `You are a music tag extractor for a lofi music discovery app. Given a user's description, pick 2-5 tags from this vocabulary that best match their vibe:

${TAGS.join(', ')}

Respond with ONLY a JSON array of tags, nothing else. Example: ["sad", "piano", "rain"]`;

/**
 * Call Claude Haiku to extract relevant tags from a user prompt.
 * Returns empty array on any failure (missing key, API error, bad response).
 * Never throws.
 */
export async function extractTags(prompt: string): Promise<string[]> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('[claude] No ANTHROPIC_API_KEY set, skipping');
      return [];
    }

    const client = new Anthropic();

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    // Extract text from response
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const tags: unknown = JSON.parse(text);

    // Validate: must be an array of strings that exist in our vocabulary
    if (!Array.isArray(tags)) {
      console.log('[claude] Response is not an array:', text);
      return [];
    }

    const validTags = tags.filter(
      (t): t is string => typeof t === 'string' && TAG_SET.has(t)
    );

    console.log(`[claude] Extracted tags: ${JSON.stringify(validTags)} from "${prompt}"`);
    return validTags;

  } catch (error) {
    console.log(`[claude] Failed: ${error instanceof Error ? error.message : error}`);
    return [];
  }
}

/**
 * Compute Levenshtein distance for fuzzy string matching
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Find the best matching pre-embedded phrase given a set of tags.
 * Scores each phrase by counting how many tags appear as substrings.
 * Uses Levenshtein distance as a tiebreaker when multiple phrases have the same score.
 * Returns phrase index, or -1 if no phrase matches any tag.
 */
export function findClosestPhraseByTags(tags: string[]): number {
  const phrases = getPhrases();
  const tagQuery = tags.join(' ');

  let bestIndex = -1;
  let bestScore = 0;
  let bestDistance = Infinity;

  for (let i = 0; i < phrases.length; i++) {
    const phrase = phrases[i].toLowerCase();
    let score = 0;

    // Count tag matches
    for (const tag of tags) {
      if (phrase.includes(tag.toLowerCase())) {
        score++;
      }
    }

    // If this phrase has a better score, or same score but better distance
    const distance = levenshteinDistance(tagQuery, phrase);

    if (score > bestScore || (score === bestScore && distance < bestDistance)) {
      bestScore = score;
      bestDistance = distance;
      bestIndex = i;
    }
  }

  if (bestIndex >= 0) {
    console.log(`[claude] Matched tags ${JSON.stringify(tags)} to phrase "${phrases[bestIndex]}" (score: ${bestScore}/${tags.length}, distance: ${bestDistance.toFixed(1)})`);
  }

  return bestIndex;
}
