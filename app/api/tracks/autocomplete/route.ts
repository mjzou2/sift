import { NextRequest, NextResponse } from 'next/server';
import { getMetadata } from '@/lib/embeddings';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    // Return empty results for empty query
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    const normalizedQuery = query.toLowerCase().trim();
    const metadata = getMetadata();

    // Case-insensitive substring match on track_name and artist
    const matches = metadata.filter(track => {
      const trackName = track.track_name.toLowerCase();
      const artist = track.artist.toLowerCase();

      return trackName.includes(normalizedQuery) || artist.includes(normalizedQuery);
    });

    // Take top 10 matches
    const results = matches.slice(0, 10).map(track => ({
      seq_id: track.seq_id,
      track_name: track.track_name,
      artist: track.artist,
    }));

    return NextResponse.json({ results });

  } catch (error) {
    console.error('[autocomplete] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
