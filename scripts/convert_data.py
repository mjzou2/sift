#!/usr/bin/env python3
"""
Convert SIFT data files from numpy/CSV to Node.js-compatible formats.

Converts:
- sift_embeddings.npy → embeddings.bin (Float32 binary) + embeddings.meta.json
- phrase_embeddings.npz → phrase_embeddings.bin + phrase_embeddings.meta.json + phrases.json
- sift_metadata.csv → metadata.json (array of track objects)

All output files are written to data/json/ directory.
"""

import numpy as np
import pandas as pd
import json
from pathlib import Path


def convert_embeddings():
    """Convert track embeddings to Float32 binary format."""
    print('Converting track embeddings...')

    # Load embeddings
    emb = np.load('data/features/sift_embeddings.npy')
    print(f'  Loaded shape: {emb.shape}, dtype: {emb.dtype}')

    # Ensure float32 dtype
    if emb.dtype != np.float32:
        emb = emb.astype(np.float32)

    # Create output directory
    output_dir = Path('data/json')
    output_dir.mkdir(exist_ok=True)

    # Write raw binary
    bin_path = output_dir / 'embeddings.bin'
    with open(bin_path, 'wb') as f:
        f.write(emb.tobytes())
    print(f'  Wrote {bin_path} ({emb.nbytes:,} bytes)')

    # Write metadata
    meta_path = output_dir / 'embeddings.meta.json'
    with open(meta_path, 'w') as f:
        json.dump({
            'shape': list(emb.shape),
            'dtype': 'float32',
            'size_bytes': emb.nbytes
        }, f, indent=2)
    print(f'  Wrote {meta_path}')


def convert_phrases():
    """Convert phrase embeddings to separate JSON + binary files."""
    print('Converting phrase embeddings...')

    # Load phrase embeddings
    data = np.load('data/features/phrase_embeddings.npz')
    phrases = data['phrases']
    emb = data['embeddings']
    print(f'  Loaded {len(phrases)} phrases, embeddings shape: {emb.shape}')

    # Ensure float32 dtype
    if emb.dtype != np.float32:
        emb = emb.astype(np.float32)

    output_dir = Path('data/json')

    # Write phrases as JSON array
    phrases_path = output_dir / 'phrases.json'
    with open(phrases_path, 'w') as f:
        json.dump(phrases.tolist(), f, indent=2)
    print(f'  Wrote {phrases_path}')

    # Write embeddings as binary
    bin_path = output_dir / 'phrase_embeddings.bin'
    with open(bin_path, 'wb') as f:
        f.write(emb.tobytes())
    print(f'  Wrote {bin_path} ({emb.nbytes:,} bytes)')

    # Write metadata
    meta_path = output_dir / 'phrase_embeddings.meta.json'
    with open(meta_path, 'w') as f:
        json.dump({
            'shape': list(emb.shape),
            'dtype': 'float32',
            'size_bytes': emb.nbytes
        }, f, indent=2)
    print(f'  Wrote {meta_path}')


def convert_metadata():
    """Convert metadata CSV to typed JSON array."""
    print('Converting metadata...')

    # Load CSV (keep seq_id as string)
    df = pd.read_csv('data/features/sift_metadata.csv', dtype={'seq_id': str})
    print(f'  Loaded {len(df)} tracks')

    # Convert to list of track objects
    tracks = []
    for _, row in df.iterrows():
        track = {
            'seq_id': str(row['seq_id']),  # Ensure seq_id is string
            'spotify_id': row['spotify_id'],
            'track_name': row['track_name'],
            'artist': row['artist'],
            'album': row['album'],
            'duration_ms': int(row['duration_ms']),
            'popularity': int(row['popularity']),
            'tags': [
                {'name': row['tag_1'], 'score': float(row['tag_1_score'])},
                {'name': row['tag_2'], 'score': float(row['tag_2_score'])},
                {'name': row['tag_3'], 'score': float(row['tag_3_score'])},
                {'name': row['tag_4'], 'score': float(row['tag_4_score'])},
                {'name': row['tag_5'], 'score': float(row['tag_5_score'])},
            ]
        }
        tracks.append(track)

    # Write to JSON with compact formatting
    output_dir = Path('data/json')
    meta_path = output_dir / 'metadata.json'
    with open(meta_path, 'w') as f:
        json.dump(tracks, f, separators=(',', ':'))

    # Get file size
    file_size = meta_path.stat().st_size
    print(f'  Wrote {meta_path} ({file_size:,} bytes)')


def main():
    print('=' * 60)
    print('SIFT Data Conversion Script')
    print('=' * 60)
    print()

    try:
        convert_embeddings()
        print()
        convert_phrases()
        print()
        convert_metadata()
        print()
        print('=' * 60)
        print('✓ Conversion complete!')
        print('Generated files in data/json/')
        print('=' * 60)

    except Exception as e:
        print()
        print('=' * 60)
        print(f'✗ Error: {e}')
        print('=' * 60)
        raise


if __name__ == '__main__':
    main()
