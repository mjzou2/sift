"use client";

import { RotateCcw, X } from "lucide-react";

interface SeedTrack {
  seq_id: string;
  track_name: string;
  artist: string;
}

interface PromptBarProps {
  mode: 'landing' | 'compact';
  prompt: string;
  onPromptChange: (value: string) => void;
  onSearch: () => void;
  seed: {
    tracks: SeedTrack[];
    onAdd: () => void;
    onRemove: (seqId: string) => void;
    maxSeeds?: number;
  };
  onClear?: () => void;
  isSearching?: boolean;
}

export default function PromptBar({
  mode,
  prompt,
  onPromptChange,
  onSearch,
  seed,
  onClear,
  isSearching = false,
}: PromptBarProps) {
  const isLanding = mode === 'landing';
  const isCompact = mode === 'compact';
  const maxSeeds = seed.maxSeeds ?? 5;
  const seedCount = seed.tracks.length;
  const isSeedLimitReached = seedCount >= maxSeeds;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`prompt-bar w-full px-2 flex items-center gap-2 transition-all duration-1000 ease-decel ${
        isLanding ? 'py-2 shadow-lg' : 'py-1 shadow-md'
      }`}
    >
      {/* Seed track pills — compact mode only */}
      {isCompact && seedCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap max-w-md">
          {seed.tracks.map((track) => (
            <div
              key={track.seq_id}
              className="flex items-center gap-1 px-2 py-1 bg-brown-border/10 border border-brown-border/30 rounded-full text-xs text-brown-text select-text"
            >
              <span className="truncate max-w-[150px]">{track.track_name}</span>
              <button
                type="button"
                onClick={() => seed.onRemove(track.seq_id)}
                className="flex-shrink-0 hover:text-brown-border transition-colors"
                aria-label={`Remove ${track.track_name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add seed track button */}
      <button
        type="button"
        onClick={seed.onAdd}
        disabled={isCompact && isSeedLimitReached}
        className={`relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl font-semibold transition-colors ${
          isCompact && isSeedLimitReached
            ? 'bg-brown-border/5 text-brown-border/30 cursor-not-allowed'
            : 'bg-brown-border/10 hover:bg-brown-border/20 text-brown-border'
        }`}
        aria-label="Add seed track"
        title={isCompact && isSeedLimitReached ? `Maximum ${maxSeeds} seeds` : 'Add seed track'}
      >
        +
        {/* Seed count badge — landing mode only */}
        {isLanding && seedCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full text-cream text-xs flex items-center justify-center font-semibold">
            {seedCount}
          </span>
        )}
      </button>

      {/* Text input */}
      <input
        type="text"
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder={isLanding ? "Describe your vibe... or add a seed track" : "Describe your vibe..."}
        className={`flex-1 bg-transparent border-none outline-none text-brown-text placeholder:text-brown-text/40 text-sm md:text-base select-text ${
          isCompact ? 'min-w-0' : ''
        }`}
      />

      {/* Clear button — compact mode only */}
      {isCompact && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="flex-shrink-0 p-2 hover:bg-brown-border/10 rounded-full transition-colors text-brown-border"
          aria-label="Clear search"
          title="Clear and return to landing"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isCompact && isSearching}
        className={`flex-shrink-0 px-6 py-2 rounded-full font-medium text-sm transition-colors ${
          isCompact && isSearching
            ? 'bg-accent/50 text-cream/70 cursor-not-allowed'
            : 'bg-accent hover:bg-accent/90 text-cream'
        }`}
      >
        {isCompact && isSearching ? 'Searching...' : 'Sift'}
      </button>
    </form>
  );
}
