import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Read user's access token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization token' },
        { status: 401 }
      );
    }
    const userToken = authHeader.slice(7);

    const { spotify_ids, playlist_name } = await request.json();

    if (!Array.isArray(spotify_ids) || spotify_ids.length === 0) {
      return NextResponse.json(
        { error: 'spotify_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!playlist_name || typeof playlist_name !== 'string') {
      return NextResponse.json(
        { error: 'playlist_name is required' },
        { status: 400 }
      );
    }

    // Get the current user's Spotify profile
    const meResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    if (!meResponse.ok) {
      console.error('[spotify-save] Failed to get user profile:', meResponse.status);
      if (meResponse.status === 401) {
        return NextResponse.json(
          { error: 'Token expired or invalid' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to get Spotify user profile' },
        { status: 502 }
      );
    }

    const me = await meResponse.json();
    const userId = me.id;
    console.log('[spotify-save] Creating playlist for user:', userId);

    // Create the playlist (using /me/playlists — preferred in Development Mode)
    const createResponse = await fetch(
      'https://api.spotify.com/v1/me/playlists',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playlist_name,
          public: false,
          description: 'Created with Sift — sift.love',
        }),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('[spotify-save] Failed to create playlist:', createResponse.status, errorText);
      if (createResponse.status === 401) {
        return NextResponse.json({ error: 'Token expired or invalid' }, { status: 401 });
      }
      if (createResponse.status === 403) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Failed to create playlist' }, { status: 502 });
    }

    const playlist = await createResponse.json();
    const playlistId = playlist.id;
    const playlistUrl = playlist.external_urls?.spotify || `https://open.spotify.com/playlist/${playlistId}`;
    console.log('[spotify-save] Playlist created:', playlistId);

    // Add items to playlist (using /items endpoint — /tracks is deprecated and blocked)
    const uris = spotify_ids.map((id: string) => `spotify:track:${id}`);
    const addResponse = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/items`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris }),
      }
    );

    if (!addResponse.ok) {
      const errBody = await addResponse.text();
      console.error('[spotify-save] Add items failed:', addResponse.status, errBody);
      return NextResponse.json(
        { error: 'Playlist created but failed to add tracks', playlist_url: playlistUrl },
        { status: 502 }
      );
    }

    console.log('[spotify-save] Added', spotify_ids.length, 'tracks to playlist');

    return NextResponse.json({
      playlist_url: playlistUrl,
      playlist_id: playlistId,
      playlist_name: playlist.name,
      tracks_added: spotify_ids.length,
    });
  } catch (error) {
    console.error('[spotify-save] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
