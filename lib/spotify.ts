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
 * Extract preview URL from Spotify's embed page.
 * The embed endpoint still returns preview URLs even when the API doesn't.
 */
async function getPreviewUrlFromEmbed(spotifyId: string): Promise<string | null> {
  try {
    const response = await fetch(`https://open.spotify.com/embed/track/${spotifyId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error('[spotify] Embed request failed:', response.status);
      return null;
    }

    const html = await response.text();

    // Extract preview URL from __NEXT_DATA__ JSON blob
    const match = html.match(/<script\s+id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/);
    if (match?.[1]) {
      const data = JSON.parse(match[1]);
      const previewUrl =
        data?.props?.pageProps?.state?.data?.entity?.audioPreview?.url ?? null;
      if (previewUrl) {
        console.log(`[spotify] Got preview URL from embed for ${spotifyId}`);
        return previewUrl;
      }
    }

    // Fallback: search for any p.scdn.co preview URL in the HTML
    const urlMatch = html.match(/https:\/\/p\.scdn\.co\/mp3-preview\/[a-zA-Z0-9]+[^"'\s]*/);
    if (urlMatch) {
      console.log(`[spotify] Got preview URL from embed (regex) for ${spotifyId}`);
      return urlMatch[0];
    }

    console.log(`[spotify] No preview found in embed for ${spotifyId}`);
    return null;
  } catch (error) {
    console.error('[spotify] Error fetching embed:', error);
    return null;
  }
}

/**
 * Fetch preview URL for a Spotify track.
 * Tries the Web API first, falls back to scraping the embed page.
 */
export async function getTrackPreviewUrl(spotifyId: string): Promise<string | null> {
  // Try the standard API first
  const token = await getSpotifyAccessToken();

  if (token) {
    try {
      const response = await fetch(`https://api.spotify.com/v1/tracks/${spotifyId}?market=US`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const track: SpotifyTrack = await response.json();
        if (track.preview_url) {
          return track.preview_url;
        }
      }
    } catch (error) {
      console.error('[spotify] API error, trying embed fallback:', error);
    }
  }

  // Fallback: scrape preview URL from the embed page
  return getPreviewUrlFromEmbed(spotifyId);
}
