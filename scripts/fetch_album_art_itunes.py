#!/usr/bin/env python3
"""
Fetch album art URLs from Deezer API and add to sift_metadata.csv.

Reads sift_metadata.csv, searches Deezer for each track by name + artist,
and adds a 'deezer_album_art_url' column to the CSV.

No authentication required. 0.2s delay between requests.
"""

import time
import requests
import pandas as pd
from pathlib import Path
from typing import Optional
from urllib.parse import quote


def fetch_deezer_art(track_name: str, artist: str, max_retries: int = 3) -> tuple[Optional[str], bool]:
    """
    Search Deezer for a track and return the album cover URL.
    Returns (url_or_None, should_stop). should_stop=True means rate limited and retries exhausted.
    """
    # Clean artist: take first artist if multiple (semicolon-separated)
    first_artist = artist.split(';')[0].strip()
    query = quote(f'track:"{track_name}" artist:"{first_artist}"')
    url = f'https://api.deezer.com/search?q={query}&limit=1'

    for attempt in range(max_retries):
        try:
            response = requests.get(url, timeout=10)

            if response.status_code == 429:
                retry_after = max(int(response.headers.get('Retry-After', 30)), 30)
                print(f'  Rate limited (429). Waiting {retry_after}s... (attempt {attempt + 1}/{max_retries})')
                time.sleep(retry_after)
                continue

            response.raise_for_status()
            data = response.json()

            # Deezer returns errors in JSON body, not HTTP status
            if 'error' in data:
                error_code = data['error'].get('code', 0)
                if error_code == 4:  # Quota exceeded
                    print(f'  Deezer quota exceeded. Waiting 30s... (attempt {attempt + 1}/{max_retries})')
                    time.sleep(30)
                    continue
                print(f'  Deezer API error: {data["error"]}')
                return None, False

            results = data.get('data', [])
            if not results:
                return None, False

            album = results[0].get('album', {})
            art_url = album.get('cover_medium', '')
            if not art_url:
                return None, False

            return art_url, False

        except requests.exceptions.HTTPError:
            if attempt < max_retries - 1:
                continue
            print(f'  Warning: Failed to fetch "{track_name}" by {first_artist} after {max_retries} attempts')
            return None, False
        except Exception as e:
            print(f'  Warning: Failed to fetch "{track_name}" by {first_artist}: {e}')
            return None, False

    print(f'  Rate limit retries exhausted for "{track_name}". Saving progress and stopping.')
    return None, True


def main():
    print('=' * 60)
    print('Fetch Album Art URLs from Deezer API')
    print('=' * 60)
    print()

    # Load metadata CSV
    csv_path = Path('data/features/sift_metadata.csv')
    print(f'Loading {csv_path}...')
    df = pd.read_csv(csv_path, dtype={'seq_id': str})
    print(f'✓ Loaded {len(df)} tracks')
    print()

    # Initialize deezer_album_art_url column if it doesn't exist
    if 'deezer_album_art_url' not in df.columns:
        df['deezer_album_art_url'] = ''
        print('✓ Created deezer_album_art_url column')
    else:
        print('⚠ deezer_album_art_url column already exists. Will resume from last saved position.')

    # Ensure column is string type
    df['deezer_album_art_url'] = df['deezer_album_art_url'].astype(str).replace('nan', '')
    print()

    # Count tracks that still need fetching
    needs_fetch = df['deezer_album_art_url'].isna() | (df['deezer_album_art_url'] == '')
    total_needed = needs_fetch.sum()
    already_fetched = len(df) - total_needed

    print(f'Status: {already_fetched}/{len(df)} tracks already have Deezer album art')
    print(f'Need to fetch: {total_needed} tracks')
    print()

    if total_needed == 0:
        print('✓ All tracks already have Deezer album art URLs!')
        return

    request_delay = 0.2
    print(f'Fetching album art URLs ({request_delay}s delay between requests)...')
    print(f'Estimated time: ~{int(total_needed * request_delay / 60)} minutes')
    print('(Progress saved every 100 tracks)')
    print()

    batch_size = 100
    success_count = already_fetched
    fail_count = 0

    # Get rows that need fetching
    rows_to_fetch = df[needs_fetch]

    stopped_early = False
    for i, (idx, row) in enumerate(rows_to_fetch.iterrows()):
        art_url, should_stop = fetch_deezer_art(row['track_name'], row['artist'])

        if art_url:
            df.at[idx, 'deezer_album_art_url'] = art_url
            success_count += 1
        else:
            # Leave as empty string so it gets retried on next run
            fail_count += 1

        # Save progress and print status every batch_size tracks
        if (i + 1) % batch_size == 0 or i == len(rows_to_fetch) - 1 or should_stop:
            df.to_csv(csv_path, index=False)
            tracks_processed = already_fetched + i + 1
            print(f'  Progress: {tracks_processed}/{len(df)} tracks | {success_count} success, {fail_count} failed')

        if should_stop:
            print()
            print('⚠ Stopping due to persistent rate limiting. Run again later to resume.')
            stopped_early = True
            break

        # Rate limiting
        if i < len(rows_to_fetch) - 1:
            time.sleep(request_delay)

    print()
    print('=' * 60)
    if stopped_early:
        print(f'⚠ Stopped early. Progress saved.')
    else:
        print(f'✓ Complete!')
    print(f'  {success_count}/{len(df)} tracks have Deezer album art URLs')
    print(f'  {fail_count}/{len(df)} tracks missing album art (will retry on next run)')
    print('=' * 60)


if __name__ == '__main__':
    main()
