// Spotify Web API integration for fetching track preview URLs

interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyTrack {
  preview_url: string | null;
  name: string;
  artists: Array<{ name: string }>;
}

// Module-level token cache (persists across requests in same serverless function)
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get Spotify access token using client credentials flow
 * Tokens are cached for 1 hour to minimize API calls
 */
async function getSpotifyAccessToken(): Promise<string | null> {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('[spotify] Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET');
    return null;
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      console.error('[spotify] Token request failed:', response.status, response.statusText);
      return null;
    }

    const data: SpotifyToken = await response.json();

    // Cache token (expires in 1 hour, subtract 5 minutes for safety)
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 300) * 1000,
    };

    console.log('[spotify] New access token obtained, expires in', data.expires_in, 'seconds');
    return data.access_token;
  } catch (error) {
    console.error('[spotify] Error fetching access token:', error);
    return null;
  }
}

/**
 * Fetch preview URL for a Spotify track
 * Returns null if preview is not available or on error
 */
export async function getTrackPreviewUrl(spotifyId: string): Promise<string | null> {
  const token = await getSpotifyAccessToken();

  if (!token) {
    console.error('[spotify] Cannot fetch preview URL: no access token');
    return null;
  }

  try {
    const response = await fetch(`https://api.spotify.com/v1/tracks/${spotifyId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('[spotify] Track request failed:', response.status, response.statusText);
      return null;
    }

    const track: SpotifyTrack = await response.json();

    if (!track.preview_url) {
      console.log(`[spotify] No preview available for track ${spotifyId}`);
    }

    return track.preview_url;
  } catch (error) {
    console.error('[spotify] Error fetching track preview:', error);
    return null;
  }
}
