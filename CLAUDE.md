# SIFT — Claude Code Context

## What This Project Is

Lofi music discovery web app. Users describe a vibe or pick a seed track →
app finds similar tracks from a 4,594-track Lofi Girl/Lofi Records catalog
using pre-computed CLAP audio embeddings and cosine similarity.

**Domain:** sift.love
**Stack:** Next.js 14+ (App Router), Tailwind CSS, TypeScript
**Deploy:** Vercel

See `docs/sift-mvp-spec.md` for the full product and design spec.

---

## Project Structure

```
~/projects/sift/
├── data/
│   ├── lofi_discography.csv              # Original Spotify metadata export
│   ├── download_progress.json            # seq_id → file path mapping
│   ├── downloads/                        # 4,599 MP3s (LOCAL ONLY, .gitignore)
│   ├── tag_combos_review.txt             # 84 curated tag combo phrases
│   └── features/
│       ├── embeddings/                   # Individual .npy files (LOCAL ONLY, .gitignore)
│       ├── sift_embeddings.npy           # (4594, 512) track embedding matrix (~9MB, COMMIT)
│       ├── sift_metadata.csv             # 4594 rows, tracks + top 5 tags (COMMIT)
│       └── phrase_embeddings.npz         # 116 search phrases + embeddings (COMMIT)
├── notebooks/                            # Jupyter notebooks from pipeline work (LOCAL ONLY)
├── venv/                                 # Python venv (LOCAL ONLY, .gitignore)
├── docs/
│   └── sift-mvp-spec.md                 # Full MVP spec (COMMIT)
├── CLAUDE.md                             # This file
└── app/                                  # Next.js app (to be built)
```

---

## Critical Data Files

These three files ARE the backend. All search runs against them. No database, no live ML.

| File | Shape | Purpose |
|------|-------|---------|
| `data/features/sift_embeddings.npy` | 4594 × 512, float32 | Track audio embeddings (laion-clap) |
| `data/features/sift_metadata.csv` | 4594 rows | Track info + top 5 tags with z-scores |
| `data/features/phrase_embeddings.npz` | 116 × 512 | Pre-embedded search phrases |

**Metadata CSV columns:** seq_id, spotify_id, track_name, artist, album, duration_ms, popularity, tag_1, tag_1_score, tag_2, tag_2_score, ... tag_5, tag_5_score

**Phrase NPZ keys:** `phrases` (string array), `embeddings` (116 × 512 float32)

All similarity = cosine similarity (dot product on L2-normalized vectors).

---

## How Search Works

### Text → Tracks
1. User types a prompt
2. Find closest pre-embedded phrase (from the 116 in phrase_embeddings.npz)
3. Use that phrase's embedding as the query vector
4. Cosine similarity against all 4,594 track embeddings
5. Return top 20

**No live CLAP inference.** We cannot run the CLAP model on Vercel. All text
embeddings are pre-computed. Novel queries get matched to the nearest phrase.

### Seed Track → Tracks
1. User selects a track from catalog (autocomplete)
2. Look up its embedding by seq_id from the embeddings matrix
3. Cosine similarity against all other tracks
4. Return top 20

### Combined (Seed + Text)
- Blend: 70% seed embedding + 30% text phrase embedding
- Search against all tracks

### "Find Similar" on Results
- Replaces the seed track, preserves the text prompt
- Re-runs combined search with new 70/30 blend

---

## Tags

34 display tags, classified via zero-shot CLAP with z-score normalization.
Each track has its top 5 stored in metadata. Only piano and guitar are
displayed as instrument tags (others unreliable for lofi).

**Tag categories:**
- Instruments: piano, guitar
- Mood: sad, melancholic, nostalgic, hopeful, peaceful, dark, lonely
- Energy: slow, mellow, sleepy, upbeat, groovy, bossa nova
- Texture: vinyl crackle, ambient, spacey, bass-heavy, minimal
- Environment: rain, ocean, night, cafe, winter, home, nature, space
- Flavor: cozy, warm, dreamy, focus, jazz, chill

---

## Key Technical Decisions

- **No live ML inference** — everything is pre-computed embeddings + cosine sim
- **Static data files in repo** — no database, no external storage for MVP
- **Phrase matching for text search** — 116 pre-embedded phrases cover common queries
- **Z-score normalized tags** — raw CLAP scores are useless within-genre; z-scores give meaningful differentiation
- **Spotify OAuth only for playlist saving** — browsing/search works without login
- **30-second Spotify previews for playback** — no audio hosting

---

## Environment

- **Local dev:** WSL2 Ubuntu 22.04, VSCode
- **Python venv:** `~/projects/sift/venv/` (pipeline work only, not needed for Next.js app)
- **Node version:** Use latest LTS
- **Spotify API:** Development Mode (limited quotas, specific workarounds documented in spec)

---

## .gitignore

```
# Python / Pipeline (not needed in deployed app)
venv/
__pycache__/
*.pyc
.cache
notebooks/

# Large local-only data
data/downloads/
data/features/embeddings/
download_progress.json

# Environment
.env
.env.local
node_modules/
.next/

# OS
.DS_Store
Thumbs.db
```

**DO commit:** sift_embeddings.npy, sift_metadata.csv, phrase_embeddings.npz, tag_combos_review.txt, lofi_discography.csv, sift-mvp-spec.md

---

## Things to Avoid

- Do NOT attempt to run CLAP or any ML model in the Next.js app
- Do NOT modify files in `data/features/` — they are pre-computed pipeline outputs
- Do NOT add a database — static files are the entire backend for MVP
- Do NOT auto-play ambient sound — it must be off by default with a toggle
- Do NOT use Spotify's dark/green color scheme — the app has its own warm desert palette
- Do NOT install heavy dependencies without asking — keep the bundle lean for Vercel

---

## Spotify API Notes

- App is in Development Mode (limited to 25 users)
- `sp.playlist_tracks()` is BLOCKED — use `sp.playlist()` instead
- OAuth scopes needed: `playlist-modify-public` or `playlist-modify-private`
- Redirect URI: `https://sift.love/callback` (production), `http://localhost:3000/callback` (dev)
- 30-second preview URLs may not be available for all tracks (Spotify deprecated some)

---

## Quick Reference: Prompt for Building the Frontend

Point Claude Code at `docs/sift-mvp-spec.md` for the full design spec including:
- Color palette, layout, animations
- API route schemas
- Component breakdown
- Spotify OAuth flow
- All UI states (landing, results, transitions)
