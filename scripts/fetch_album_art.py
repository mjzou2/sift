#!/usr/bin/env python3
"""
Fetch album art URLs from Spotify API and add to sift_metadata.csv.

Reads sift_metadata.csv, fetches album art URLs for each track using the Spotify API,
and adds an 'album_art_url' column to the CSV.

Requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local file.
"""

import os
import sys
import time
import requests
import pandas as pd
from pathlib import Path
from typing import Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

# Try to load .env.local using python-dotenv
try:
    from dotenv import load_dotenv
    load_dotenv('.env.local')
except ImportError:
    print('Warning: python-dotenv not installed. Install with: pip install python-dotenv')
    print('Attempting to read environment variables directly...')


def get_spotify_token() -> str:
    """Get Spotify access token using client credentials flow."""
    client_id = os.getenv('SPOTIFY_CLIENT_ID')
    client_secret = os.getenv('SPOTIFY_CLIENT_SECRET')

    if not client_id or not client_secret:
        print('ERROR: Missing Spotify credentials.')
        print('Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.')
        sys.exit(1)

    auth_url = 'https://accounts.spotify.com/api/token'
    auth_data = {
        'grant_type': 'client_credentials',
        'client_id': client_id,
        'client_secret': client_secret
    }

    response = requests.post(auth_url, data=auth_data)
    response.raise_for_status()

    return response.json()['access_token']


def fetch_album_art_single(spotify_id: str, token: str) -> tuple[str, Optional[str]]:
    """
    Fetch album art URL for a single track.
    Returns tuple of (spotify_id, album_art_url).
    """
    url = f'https://api.spotify.com/v1/tracks/{spotify_id}'
    headers = {'Authorization': f'Bearer {token}'}

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()

        # Get album images (sorted largest to smallest)
        images = data.get('album', {}).get('images', [])
        return (spotify_id, images[0]['url'] if images else None)

    except Exception as e:
        # Log error but don't crash
        print(f'  Warning: Failed to fetch {spotify_id}: {e}')
        return (spotify_id, None)


def main():
    print('=' * 60)
    print('Fetch Album Art URLs from Spotify')
    print('=' * 60)
    print()

    # Get access token
    print('Getting Spotify access token...')
    token = get_spotify_token()
    print('✓ Token acquired')
    print()

    # Load metadata CSV
    csv_path = Path('data/features/sift_metadata.csv')
    print(f'Loading {csv_path}...')
    df = pd.read_csv(csv_path, dtype={'seq_id': str})
    print(f'✓ Loaded {len(df)} tracks')
    print()

    # Initialize album_art_url column if it doesn't exist
    if 'album_art_url' not in df.columns:
        df['album_art_url'] = ''
        print('✓ Created album_art_url column')
    else:
        print('⚠ album_art_url column already exists. Will resume from last saved position.')

    # Ensure column is string type to avoid dtype warnings
    df['album_art_url'] = df['album_art_url'].astype(str).replace('nan', '')
    print()

    # Count tracks that still need fetching
    needs_fetch = df['album_art_url'].isna() | (df['album_art_url'] == '')
    total_needed = needs_fetch.sum()
    already_fetched = len(df) - total_needed

    print(f'Status: {already_fetched}/{len(df)} tracks already have album art')
    print(f'Need to fetch: {total_needed} tracks')
    print()

    if total_needed == 0:
        print('✓ All tracks already have album art URLs!')
        return

    # Fetch album art URLs with conservative parallel requests
    print('Fetching album art URLs (individual requests, 3 concurrent)...')
    print(f'Estimated time: ~{total_needed // 20} seconds')
    print('(Progress saved every 100 tracks)')
    print()

    batch_size = 100  # Save progress every 100 tracks
    max_workers = 3   # Conservative: 3 concurrent requests
    request_delay = 0.3  # 0.3s between requests = ~150 req/min
    success_count = already_fetched
    fail_count = 0

    # Get spotify_ids that need fetching
    ids_to_fetch = df[needs_fetch]['spotify_id'].tolist()
    indices_map = {row['spotify_id']: idx for idx, row in df[needs_fetch].iterrows()}

    # Process in batches for progress saving
    for batch_start in range(0, len(ids_to_fetch), batch_size):
        batch_ids = ids_to_fetch[batch_start:batch_start + batch_size]

        # Fetch batch in parallel with rate limiting
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all tasks
            future_to_id = {
                executor.submit(fetch_album_art_single, spotify_id, token): spotify_id
                for spotify_id in batch_ids
            }

            # Process results as they complete
            for idx_in_batch, future in enumerate(as_completed(future_to_id)):
                spotify_id, album_art_url = future.result()
                df_idx = indices_map[spotify_id]

                # Update dataframe
                if album_art_url:
                    df.at[df_idx, 'album_art_url'] = album_art_url
                    success_count += 1
                else:
                    df.at[df_idx, 'album_art_url'] = ''
                    fail_count += 1

                # Rate limiting: 0.3s delay between requests
                # Skip delay on last request of batch
                if idx_in_batch < len(batch_ids) - 1:
                    time.sleep(request_delay)

        # Save progress after each batch
        df.to_csv(csv_path, index=False)

        # Progress indicator
        tracks_processed = already_fetched + min(batch_start + batch_size, len(ids_to_fetch))
        print(f'  Progress: {tracks_processed}/{len(df)} tracks | {success_count} success, {fail_count} failed')

    print()
    print(f'✓ Completed: {len(df)}/{len(df)} tracks processed')


    print('=' * 60)
    print(f'✓ Complete!')
    print(f'  {success_count}/{len(df)} tracks have album art URLs')
    print(f'  {fail_count}/{len(df)} tracks missing album art')
    print('=' * 60)


if __name__ == '__main__':
    main()
