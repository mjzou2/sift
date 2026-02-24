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
  album_art_url?: string;
}

export interface SearchResult extends Track {
  similarity: number;
}

export interface EmbeddingMetadata {
  shape: [number, number];
  dtype: string;
  size_bytes?: number;
}

// Spotify API response types
export interface SpotifyTrack {
  preview_url: string | null;
  name: string;
  artists: Array<{ name: string }>;
}

// Spotify OAuth types
export interface SpotifyAuthState {
  prompt: string;
  seedTracks: Array<{ seq_id: string; track_name: string; artist: string }>;
  results: SearchResult[];
  appState: 'landing' | 'loading' | 'results';
}

export interface SavePlaylistResponse {
  playlist_url: string;
  playlist_id: string;
  playlist_name: string;
  tracks_added: number;
}
