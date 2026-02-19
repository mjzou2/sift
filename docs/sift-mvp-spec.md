# Sift MVP 1.0 — Product & Design Spec

**Domain:** sift.love  
**Stack:** Next.js 14+ (App Router), Tailwind CSS, Vercel  
**Data:** Static files bundled in repo (no database, no live ML inference)

---

## Data Files

Located in `data/features/`:
- `sift_embeddings.npy` — 4,594 × 512 float32 matrix (track audio embeddings, laion-clap)
- `sift_metadata.csv` — 4,594 rows with columns: seq_id, spotify_id, track_name, artist, album, duration_ms, popularity, tag_1 through tag_5 with scores
- `phrase_embeddings.npz` — 116 pre-embedded search phrases (32 freeform + 84 tag combos), keys: `phrases` (string array), `embeddings` (116 × 512 float32)

All similarity is cosine similarity (dot product on L2-normalized vectors).

---

## Core Features

### 1. Text Search (Text → Tracks)

**How it works server-side:**
1. User submits a text prompt
2. Find the closest pre-embedded phrase(s) by string similarity or embedding lookup
3. For truly novel queries: use the closest phrase embedding as a proxy (no live CLAP inference on server)
4. Compute cosine similarity between the query embedding and all 4,594 track embeddings
5. Return top 20 results ranked by similarity

**Important:** We cannot run CLAP inference on Vercel. All text embeddings must be pre-computed. For user queries that don't match any pre-embedded phrase, find the most similar pre-embedded phrase and use its embedding. Alternatively, if we want live text embedding, we'd need a small Python microservice — but for MVP, phrase matching is sufficient.

### 2. Seed Track Search (Track → Tracks)

**How it works:**
1. User selects a track from the catalog via autocomplete
2. Look up that track's embedding by seq_id
3. Compute cosine similarity against all other track embeddings
4. Return top 20 results (excluding the seed track itself)

### 3. Combined Search (Seed + Text)

**How it works:**
1. User adds one or more seed tracks via the "+" button AND types a text prompt
2. Blend embeddings: 70% average seed track embedding + 30% text prompt embedding
3. Search against all track embeddings
4. Return top 20

### 4. "Find Similar" on Results

When user clicks "find similar" on a result track:
- That track becomes the new seed track
- The original text prompt is preserved (still 30% weight)
- Results refresh with the new blended query
- Previous seed tracks are replaced (not accumulated)

### 5. Spotify Playlist Saving

- Spotify OAuth login (only required for saving, not browsing)
- "Save to Spotify" button creates a new playlist in user's account with the current results
- Login button should be subtle, not blocking any functionality
- Scopes needed: `playlist-modify-public` or `playlist-modify-private`

### 6. Track Previews

- 30-second preview via Spotify embed or Spotify preview URL
- Play/pause per track in the results list
- Only one track plays at a time (clicking another pauses the current)

---

## UI/UX Design Spec

### Overall Aesthetic
- **Warm, amber/golden/beige tones** — NOT dark mode, NOT neon
- Soft gradients throughout
- Minimal grain texture (subtle, not overwhelming)
- Clean, minimal, single-page app
- Frosted glass effects on cards (backdrop-blur, ~70-80% opacity)
- Thin brown borders on interactive elements (#8B7355 or similar warm brown)
- Distinct from typical music apps — think warm desert, not dark nightclub

### Landing State (Before Search)

**Background:**
- Static sand dune image spanning the full screen
- Dune shape: pyramid-like, rising from bottom of screen, peak near upper-third
- Base of dune covers most horizontal space near bottom
- Sky section above dune: light but somewhat deep blue
- Sun rays cutting in from the right side (sun itself not visible on screen)
- Sun ray animation: very subtle slow movement (CSS animation)
- Floating sand/wind particle animation: lightweight CSS or canvas particles drifting across screen

**Logo:**
- "Sift" in large, elegant serif or display font
- Positioned above the prompt bar, near the peak of the dune
- Semi-transparent (blends into the scene, doesn't dominate)
- Warm brown color matching the prompt bar border

**Prompt Bar:**
- Horizontally centered, vertically centered or slightly below center
- Thin and wide (not tall) — clean, minimal
- Rounded corners (generous radius — think MacBook edge, "boxy curvy")
- Thin brown border
- Background: off-white or light beige (whichever contrasts better for readability)
- Left side: "+" button for adding seed tracks
- Center: text input with placeholder suggestion text
- Right side: submit button (arrow or "Sift" text)
- Placeholder text should hint at what users can do AND communicate the catalog scope, e.g.: "Describe your vibe... or add a seed track from 4,500+ Lofi Girl tracks"

**Seed Track Autocomplete (triggered by "+" button):**
- Dropdown/modal that appears when "+" is clicked
- Search input that autocompletes against the 4,594 track catalog
- Shows: track name, artist for each suggestion
- Selected tracks appear as small pills/chips near the prompt bar
- Make it clear this searches within Lofi Girl/Lofi Records catalog only

**Ambient Wind Sound:**
- Off by default
- Small speaker/wind icon toggle in a corner (bottom-right or top-right)
- Very quiet background wind noise when enabled
- Subtle fade-in on enable

### Results State (After Search)

**Transition Animation:**
- Prompt bar floats up to the top of the page (smooth CSS transition)
- Below it, track results populate with a staggered fade-in animation
- Sand dune background remains visible behind everything
- Logo can shrink or fade to smaller version near top-left

**Results List:**
- Scrollable vertical list of tracks below the prompt bar
- Each track is a card with:
  - Frosted glass effect (backdrop-blur + ~70-80% opacity background)
  - Same thin brown border as prompt bar
  - Track name (bold) + Artist name
  - Top 3-5 tags displayed as small pills with scores (e.g., "jazz 1.22", "groovy 1.13")
  - Play/pause button for 30-second Spotify preview
  - "Find Similar" button
  - Small Spotify icon/link to open track in Spotify
- Cards should feel like they belong in the desert scene — warm, transparent, integrated

**Spotify Save Button:**
- Appears when results are displayed
- "Save to Spotify" — triggers OAuth flow if not logged in
- Creates playlist with all current results
- Could be positioned at the top of results list or floating

**Prompt Bar (in results state):**
- Stays at top, still functional
- Shows current seed track pills if any
- User can modify and re-search at any time
- Clear/reset button to go back to landing state

---

## Technical Architecture

### Next.js API Routes

**POST /api/search**
```json
// Request
{
  "prompt": "sad piano lofi for a rainy night",  // optional
  "seed_track_ids": ["0001", "0042"],             // optional, seq_ids
  "limit": 20
}

// Response
{
  "tracks": [
    {
      "seq_id": "0001",
      "spotify_id": "1JKsqzaEBudVdvGeju3Isj",
      "track_name": "Along The Path",
      "artist": "Kinissue;affogato.wav",
      "album": "The Realization",
      "duration_ms": 133629,
      "similarity": 0.496,
      "tags": [
        {"name": "sad", "score": 1.104},
        {"name": "peaceful", "score": 1.029},
        {"name": "melancholic", "score": 0.583}
      ]
    }
  ]
}
```

**Server-side logic:**
1. Load embeddings matrix, metadata, and phrase embeddings on startup (cache in memory)
2. For text prompts: find nearest pre-embedded phrase, use its embedding
3. For seed tracks: average their embeddings
4. For combined: blend 70/30
5. Cosine similarity against all tracks, return top N

**GET /api/tracks/autocomplete?q=hourglass**
- Search metadata CSV by track_name and artist (case-insensitive substring match)
- Return top 10 matches with seq_id, track_name, artist

**POST /api/spotify/save**
- Requires Spotify OAuth token
- Creates playlist and adds tracks by spotify_id

### Spotify OAuth
- Use Authorization Code Flow
- Redirect URI: https://sift.love/callback
- Store access token client-side (session only, no persistence needed)
- Scopes: `playlist-modify-public` or `playlist-modify-private`

### Static Data Loading
- Embeddings .npy file needs to be loaded in Node.js — use a library like `ndarray` or parse the raw binary (numpy format is well-documented)
- OR convert to JSON during build step for simpler loading
- Metadata CSV: parse with `papaparse` or `csv-parse` at startup
- Cache everything in module-level variables (serverless functions on Vercel will cold-start, so keep data files small or use edge runtime)

**Important Vercel consideration:** The embeddings matrix is ~9MB. This should fit within Vercel's serverless function size limits (50MB compressed). If it doesn't, consider chunking or using Vercel's edge config/blob storage.

---

## File Structure (Suggested)

```
sift/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # Main single-page app
│   ├── callback/
│   │   └── page.tsx          # Spotify OAuth callback
│   └── api/
│       ├── search/
│       │   └── route.ts      # Text + seed track search
│       ├── tracks/
│       │   └── autocomplete/
│       │       └── route.ts  # Track name autocomplete
│       └── spotify/
│           ├── auth/
│           │   └── route.ts  # Initiate OAuth
│           └── save/
│               └── route.ts  # Save playlist
├── components/
│   ├── PromptBar.tsx
│   ├── SeedTrackPill.tsx
│   ├── TrackCard.tsx
│   ├── TrackList.tsx
│   ├── AutocompleteDropdown.tsx
│   ├── AmbientToggle.tsx
│   └── SpotifySaveButton.tsx
├── lib/
│   ├── embeddings.ts         # Load and cache .npy / phrase data
│   ├── search.ts             # Cosine similarity logic
│   ├── spotify.ts            # OAuth + playlist creation helpers
│   └── metadata.ts           # CSV parsing and track lookup
├── public/
│   ├── dune.jpg              # Sand dune hero image (need to source)
│   ├── wind.mp3              # Ambient wind loop (need to source)
│   └── fonts/                # Display font for "Sift" logo
├── data/
│   ├── sift_embeddings.npy   # Or .json converted version
│   ├── sift_metadata.csv
│   └── phrase_embeddings.npz # Or .json converted version
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

---

## Color Palette (Approximate)

| Element | Color | Notes |
|---------|-------|-------|
| Background sky | #87AECC → #C4D4E0 | Blue gradient, light but with depth |
| Sand dune | #D4A76A → #C49555 | Warm golden sand tones |
| Prompt bar bg | #FAF5EE or #F5F0E8 | Off-white/cream |
| Borders | #8B7355 | Warm brown, thin (1px) |
| Logo text | #8B7355 at 40-60% opacity | Semi-transparent, blends in |
| Body text | #3D2B1F | Dark warm brown |
| Tag pills | #E8DCC8 bg, #6B5744 text | Muted, warm |
| Card glass | rgba(250, 245, 238, 0.75) | Frosted, backdrop-blur |
| Accent/CTA | #B8860B or #C49555 | Dark goldenrod for buttons |

These are starting points — adjust by eye during implementation.

---

## Assets Needed

1. **Sand dune hero image** — AI-generated (Midjourney/DALL-E) or CC0 from Unsplash. Requirements: wide aspect ratio, single clean dune shape, warm golden tones, minimal/no objects, high res.
2. **Ambient wind loop** — Short seamless loop, quiet and natural. Freesound.org has CC0 options.
3. **Display font for "Sift"** — Elegant serif or display typeface. Options: Playfair Display, Cormorant Garamond, or similar Google Font.
4. **Body font** — Clean sans-serif. Inter or similar.

---

## MVP Scope Boundaries

**In scope:**
- Single page with landing → results transition
- Text search, seed track search, combined search
- "Find similar" on result tracks (preserves prompt, replaces seed)
- Per-track tags, preview playback, Spotify link
- Spotify OAuth playlist saving
- Ambient wind toggle
- Sand particle + sun ray CSS animations
- Autocomplete seed track selection from catalog

**Out of scope (backlog):**
- Live CLAP inference (requires Python backend)
- PCA dimensionality reduction
- Keyword emphasis / tag embedding blending
- Contradiction filtering (e.g., penalize "upbeat" results for "sleepy" queries)
- Community features, user accounts, saved searches
- Pomodoro timer, ambient sound layering beyond wind
- Taste profile output
- Mobile-optimized layout (responsive is fine, but not mobile-first)
