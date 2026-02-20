import {
  getTrackEmbeddings,
  getPhraseEmbeddings,
  getMetadata,
  getPhrases,
  getTrackEmbedding,
  getPhraseEmbedding
} from './embeddings';
import type { SearchResult } from './types';

/**
 * Compute cosine similarity between two vectors (dot product, since vectors are L2-normalized)
 */
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error('Vector dimensions must match');
  }

  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }

  return dotProduct;
}

/**
 * Compute batch cosine similarity between a query vector and all track embeddings
 * Returns array of similarity scores (one per track)
 */
function batchCosineSimilarity(queryVector: Float32Array, trackEmbeddings: Float32Array): Float32Array {
  const numTracks = trackEmbeddings.length / 512;
  const similarities = new Float32Array(numTracks);

  for (let i = 0; i < numTracks; i++) {
    const trackStart = i * 512;
    let dotProduct = 0;

    for (let j = 0; j < 512; j++) {
      dotProduct += queryVector[j] * trackEmbeddings[trackStart + j];
    }

    similarities[i] = dotProduct;
  }

  return similarities;
}

/**
 * Levenshtein distance for fuzzy string matching
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize first column and row
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Find the closest pre-embedded phrase to user's text query using fuzzy string matching
 * Returns the index of the closest phrase
 */
export function findClosestPhrase(userQuery: string): number {
  const phrases = getPhrases();
  const normalizedQuery = userQuery.toLowerCase().trim();

  let minDistance = Infinity;
  let closestIndex = 0;

  for (let i = 0; i < phrases.length; i++) {
    const phrase = phrases[i].toLowerCase();

    // Compute Levenshtein distance
    let distance = levenshteinDistance(normalizedQuery, phrase);

    // Boost exact substring matches (reduce distance by 50%)
    if (phrase.includes(normalizedQuery) || normalizedQuery.includes(phrase)) {
      distance *= 0.5;
    }

    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = i;
    }
  }

  console.log(`[search] Matched "${userQuery}" to phrase "${phrases[closestIndex]}" (distance: ${minDistance.toFixed(2)})`);

  return closestIndex;
}

/**
 * Normalize a vector to L2 norm = 1
 */
function normalize(vector: Float32Array): Float32Array {
  let norm = 0;
  for (let i = 0; i < vector.length; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  const normalized = new Float32Array(vector.length);
  for (let i = 0; i < vector.length; i++) {
    normalized[i] = vector[i] / norm;
  }

  return normalized;
}

/**
 * Average multiple embeddings and normalize the result
 */
function averageEmbeddings(embeddings: Float32Array[]): Float32Array {
  if (embeddings.length === 0) {
    throw new Error('Cannot average empty array of embeddings');
  }

  const dim = embeddings[0].length;
  const avg = new Float32Array(dim);

  // Sum all embeddings
  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) {
      avg[i] += emb[i];
    }
  }

  // Divide by count
  for (let i = 0; i < dim; i++) {
    avg[i] /= embeddings.length;
  }

  // Normalize to unit length
  return normalize(avg);
}

/**
 * Blend two embeddings with given weights and normalize
 * Weights should sum to 1.0
 */
function blendEmbeddings(emb1: Float32Array, weight1: number, emb2: Float32Array, weight2: number): Float32Array {
  if (emb1.length !== emb2.length) {
    throw new Error('Embedding dimensions must match');
  }

  const blended = new Float32Array(512);

  for (let i = 0; i < 512; i++) {
    blended[i] = emb1[i] * weight1 + emb2[i] * weight2;
  }

  return normalize(blended);
}

export interface SearchParams {
  prompt?: string;
  seed_track_ids?: string[];
  limit?: number;
}

/**
 * Main search function
 * Supports three modes:
 * 1. Text only: prompt provided, no seed tracks
 * 2. Seed only: seed tracks provided, no prompt
 * 3. Combined: both prompt and seed tracks (70% seed + 30% text)
 */
export function search(params: SearchParams): SearchResult[] {
  const { prompt, seed_track_ids, limit = 20 } = params;

  // Validate input
  if (!prompt && (!seed_track_ids || seed_track_ids.length === 0)) {
    throw new Error('Must provide either prompt or seed_track_ids');
  }

  let queryVector: Float32Array;

  // Case 1: Text only
  if (prompt && (!seed_track_ids || seed_track_ids.length === 0)) {
    const phraseIndex = findClosestPhrase(prompt);
    queryVector = getPhraseEmbedding(phraseIndex);
  }

  // Case 2: Seed tracks only
  else if (!prompt && seed_track_ids && seed_track_ids.length > 0) {
    const seedEmbeddings = seed_track_ids.map(id => getTrackEmbedding(id));
    queryVector = averageEmbeddings(seedEmbeddings);
  }

  // Case 3: Combined (70% seed + 30% text)
  else {
    const phraseIndex = findClosestPhrase(prompt!);
    const textEmbedding = getPhraseEmbedding(phraseIndex);

    const seedEmbeddings = seed_track_ids!.map(id => getTrackEmbedding(id));
    const seedEmbedding = averageEmbeddings(seedEmbeddings);

    queryVector = blendEmbeddings(seedEmbedding, 0.7, textEmbedding, 0.3);
  }

  // Compute similarities against all tracks
  const trackEmbeddings = getTrackEmbeddings();
  const similarities = batchCosineSimilarity(queryVector, trackEmbeddings);

  // Create results with similarity scores
  const metadata = getMetadata();
  const results: SearchResult[] = metadata.map((track, i) => ({
    ...track,
    similarity: similarities[i],
  }));

  // Filter out seed tracks from results
  const seedSet = new Set(seed_track_ids || []);
  const filtered = results.filter(r => !seedSet.has(r.seq_id));

  // Sort by similarity (descending) and take top N
  filtered.sort((a, b) => b.similarity - a.similarity);

  return filtered.slice(0, limit);
}
