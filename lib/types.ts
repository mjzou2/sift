// Core data types for the SIFT search system

export interface TagScore {
  name: string;
  score: number;
}

export interface Track {
  seq_id: string;
  spotify_id: string;
  track_name: string;
  artist: string;
  album: string;
  duration_ms: number;
  popularity: number;
  tags: TagScore[];
}

export interface SearchResult extends Track {
  similarity: number;
}

export interface EmbeddingMetadata {
  shape: [number, number];
  dtype: string;
  size_bytes?: number;
}
