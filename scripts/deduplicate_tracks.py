#!/usr/bin/env python3
"""
Remove duplicate tracks from sift_metadata.csv and sift_embeddings.npy.

Duplicates are identified by (track_name, artist) case-insensitive match.
For each duplicate group, the first occurrence (lowest seq_id) is kept.
Remaining rows are removed from both files, and seq_ids are reassigned
to be contiguous (0000, 0001, ...).
"""

import numpy as np
import pandas as pd
from pathlib import Path


def main():
    features_dir = Path('data/features')
    meta_path = features_dir / 'sift_metadata.csv'
    emb_path = features_dir / 'sift_embeddings.npy'

    # Load data
    df = pd.read_csv(meta_path, dtype={'seq_id': str})
    emb = np.load(emb_path)
    print(f'Loaded {len(df)} tracks, embeddings shape: {emb.shape}')

    assert len(df) == emb.shape[0], 'Metadata and embeddings row count mismatch!'

    # Find duplicates by (track_name, artist) case-insensitive
    df['_key'] = df['track_name'].str.lower() + '|||' + df['artist'].str.lower()
    duplicated_mask = df.duplicated(subset='_key', keep='first')
    n_duplicates = duplicated_mask.sum()

    if n_duplicates == 0:
        print('No duplicates found.')
        return

    # Show what's being removed
    print(f'\nFound {n_duplicates} duplicate(s) to remove:\n')
    dup_groups = df[df['_key'].isin(df.loc[duplicated_mask, '_key'])].groupby('_key')
    for key, group in dup_groups:
        rows = group[['seq_id', 'track_name', 'artist', 'album']].values.tolist()
        print(f'  Keeping:  [{rows[0][0]}] {rows[0][1]} — {rows[0][2]} ({rows[0][3]})')
        for row in rows[1:]:
            print(f'  Removing: [{row[0]}] {row[1]} — {row[2]} ({row[3]})')
        print()

    # Keep only non-duplicate rows
    keep_indices = df.index[~duplicated_mask].tolist()
    df_clean = df.loc[keep_indices].copy()
    emb_clean = emb[keep_indices]

    # Reassign contiguous seq_ids
    df_clean['seq_id'] = [f'{i:04d}' for i in range(len(df_clean))]
    df_clean.drop(columns=['_key'], inplace=True)

    # Save
    df_clean.to_csv(meta_path, index=False)
    np.save(emb_path, emb_clean)

    print(f'Removed {n_duplicates} duplicates.')
    print(f'Saved {len(df_clean)} tracks → {meta_path}')
    print(f'Saved embeddings {emb_clean.shape} → {emb_path}')


if __name__ == '__main__':
    main()
