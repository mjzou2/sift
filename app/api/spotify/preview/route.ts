import { NextRequest, NextResponse } from 'next/server';
import { getTrackPreviewUrl } from '@/lib/spotify';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const spotifyId = searchParams.get('id');

  if (!spotifyId) {
    return NextResponse.json({ error: 'Missing track ID' }, { status: 400 });
  }

  try {
    const previewUrl = await getTrackPreviewUrl(spotifyId);
    return NextResponse.json({ preview_url: previewUrl });
  } catch (error) {
    console.error('Spotify API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preview URL', preview_url: null },
      { status: 500 }
    );
  }
}
