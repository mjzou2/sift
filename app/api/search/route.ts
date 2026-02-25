import { NextRequest, NextResponse } from 'next/server';
import { search, type SearchParams } from '@/lib/search';

// Rate limiting: 20 requests per minute per IP
const RATE_LIMIT = 20;
const WINDOW_MS = 60_000;
const requestLog = new Map<string, number[]>();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of requestLog) {
    const valid = timestamps.filter(t => now - t < WINDOW_MS);
    if (valid.length === 0) requestLog.delete(ip);
    else requestLog.set(ip, valid);
  }
}, 5 * 60_000);

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter(t => now - t < WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT) {
    requestLog.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return false;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a minute.' },
      { status: 429 }
    );
  }

  try {
    const body: SearchParams = await request.json();

    const { prompt, seed_track_ids, limit = 20 } = body;

    // Validate input
    if (!prompt && (!seed_track_ids || seed_track_ids.length === 0)) {
      return NextResponse.json(
        { error: 'Must provide either prompt or seed_track_ids' },
        { status: 400 }
      );
    }

    if (limit && (limit < 1 || limit > 100)) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (seed_track_ids && seed_track_ids.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 seed tracks allowed' },
        { status: 400 }
      );
    }

    // Perform search
    console.log('[search] Request:', {
      prompt,
      seed_count: seed_track_ids?.length || 0,
      limit
    });

    const startTime = Date.now();
    const results = await search({ prompt, seed_track_ids, limit });
    const duration = Date.now() - startTime;

    console.log(`[search] Found ${results.length} results in ${duration}ms`);

    return NextResponse.json({
      tracks: results,
      metadata: {
        query: { prompt, seed_track_ids },
        count: results.length,
        duration_ms: duration,
      }
    });

  } catch (error) {
    console.error('[search] Error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
