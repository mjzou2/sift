// Client-side Spotify OAuth helpers — runs in browser only

import type { SpotifyAuthState } from './types';

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SCOPES = 'playlist-modify-public playlist-modify-private';
const TOKEN_KEY = 'sift_spotify_token';
const STATE_KEY = 'sift_oauth_state';
const PRE_AUTH_STATE_KEY = 'sift_pre_auth_state';

/**
 * Get the OAuth redirect URI based on the current origin.
 * Replaces "localhost" with "127.0.0.1" since Spotify no longer allows
 * localhost in redirect URIs.
 */
export function getRedirectUri(): string {
  const origin = window.location.origin.replace('localhost', '127.0.0.1');
  return `${origin}/callback`;
}

/**
 * Build the Spotify authorization URL with CSRF state parameter.
 */
export function buildAuthUrl(): string {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  if (!clientId) {
    throw new Error('Missing NEXT_PUBLIC_SPOTIFY_CLIENT_ID');
  }

  // Generate random state for CSRF protection
  const stateArray = new Uint8Array(16);
  crypto.getRandomValues(stateArray);
  const state = Array.from(stateArray, b => b.toString(16).padStart(2, '0')).join('');
  sessionStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    state,
  });

  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

/**
 * Save current search state to sessionStorage before OAuth redirect.
 */
export function savePreAuthState(state: SpotifyAuthState): void {
  sessionStorage.setItem(PRE_AUTH_STATE_KEY, JSON.stringify(state));
}

/**
 * Load and remove pre-auth search state from sessionStorage (one-shot).
 */
export function loadPreAuthState(): SpotifyAuthState | null {
  const data = sessionStorage.getItem(PRE_AUTH_STATE_KEY);
  if (!data) return null;

  sessionStorage.removeItem(PRE_AUTH_STATE_KEY);
  try {
    return JSON.parse(data) as SpotifyAuthState;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function getOAuthState(): string | null {
  return sessionStorage.getItem(STATE_KEY);
}

export function clearOAuthState(): void {
  sessionStorage.removeItem(STATE_KEY);
}
