import fs from 'fs';
import path from 'path';
import type { Track, EmbeddingMetadata } from './types';

// Module-level cache (persists across requests in same serverless function instance)
let cachedTrackEmbeddings: Float32Array | null = null;
let cachedPhraseEmbeddings: Float32Array | null = null;
let cachedMetadata: Track[] | null = null;
let cachedPhrases: string[] | null = null;

const DATA_DIR = path.join(process.cwd(), 'data', 'json');

/**
 * Load Float32 binary data directly into Float32Array
 */
function loadFloat32Binary(filepath: string): Float32Array {
  const buffer = fs.readFileSync(filepath);

  // Create Float32Array directly from buffer
  // Note: buffer.buffer gives us the underlying ArrayBuffer
  const float32Array = new Float32Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength / 4  // 4 bytes per float32
  );

  return float32Array;
}

/**
 * Get track embeddings (4594 x 512 matrix as flat Float32Array)
 * Matrix is stored row-major: [track0_dim0, track0_dim1, ..., track0_dim511, track1_dim0, ...]
 */
export function getTrackEmbeddings(): Float32Array {
  if (!cachedTrackEmbeddings) {
    console.log('[embeddings] Loading track embeddings...');
    const binPath = path.join(DATA_DIR, 'embeddings.bin');
    cachedTrackEmbeddings = loadFloat32Binary(binPath);
    console.log(`[embeddings] Loaded ${cachedTrackEmbeddings.length} values (${cachedTrackEmbeddings.length / 512} tracks)`);
  }
  return cachedTrackEmbeddings;
}

/**
 * Get phrase embeddings (116 x 512 matrix as flat Float32Array)
 */
export function getPhraseEmbeddings(): Float32Array {
  if (!cachedPhraseEmbeddings) {
    console.log('[embeddings] Loading phrase embeddings...');
    const binPath = path.join(DATA_DIR, 'phrase_embeddings.bin');
    cachedPhraseEmbeddings = loadFloat32Binary(binPath);
    console.log(`[embeddings] Loaded ${cachedPhraseEmbeddings.length} values (${cachedPhraseEmbeddings.length / 512} phrases)`);
  }
  return cachedPhraseEmbeddings;
}

/**
 * Get track metadata array
 */
export function getMetadata(): Track[] {
  if (!cachedMetadata) {
    console.log('[embeddings] Loading metadata...');
    const jsonPath = path.join(DATA_DIR, 'metadata.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    cachedMetadata = JSON.parse(jsonData);
    console.log(`[embeddings] Loaded ${cachedMetadata?.length ?? 0} tracks`);
  }
  return cachedMetadata!;
}

/**
 * Get phrase strings array
 */
export function getPhrases(): string[] {
  if (!cachedPhrases) {
    console.log('[embeddings] Loading phrases...');
    const jsonPath = path.join(DATA_DIR, 'phrases.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    cachedPhrases = JSON.parse(jsonData);
    console.log(`[embeddings] Loaded ${cachedPhrases?.length ?? 0} phrases`);
  }
  return cachedPhrases!;
}

/**
 * Get a single track embedding by seq_id
 * Returns a view into the embeddings array (not a copy)
 */
export function getTrackEmbedding(seqId: string): Float32Array {
  const metadata = getMetadata();
  const embeddings = getTrackEmbeddings();

  const index = metadata.findIndex(t => t.seq_id === seqId);
  if (index === -1) {
    throw new Error(`Track not found: ${seqId}`);
  }

  // Extract row from flat array (each embedding is 512 floats)
  const start = index * 512;
  return embeddings.slice(start, start + 512);
}

/**
 * Get a phrase embedding by index
 * Returns a view into the embeddings array (not a copy)
 */
export function getPhraseEmbedding(phraseIndex: number): Float32Array {
  const embeddings = getPhraseEmbeddings();

  if (phraseIndex < 0 || phraseIndex >= embeddings.length / 512) {
    throw new Error(`Invalid phrase index: ${phraseIndex}`);
  }

  const start = phraseIndex * 512;
  return embeddings.slice(start, start + 512);
}
