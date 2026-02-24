"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface SeedTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (track: { seq_id: string; track_name: string; artist: string }) => void;
  selectedSeeds: Array<{ seq_id: string; track_name: string; artist: string }>;
  maxSeeds: number;
}

interface AutocompleteResult {
  seq_id: string;
  track_name: string;
  artist: string;
}

export default function SeedTrackModal({
  isOpen,
  onClose,
  onSelect,
  selectedSeeds,
  maxSeeds,
}: SeedTrackModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AutocompleteResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced autocomplete
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/tracks/autocomplete?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data.results || []);
      } catch (error) {
        console.error('Autocomplete error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isMaxReached = selectedSeeds.length >= maxSeeds;

  return (
    <div
      className="fixed inset-0 bg-brown-text/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
    >
      <div
        className="bg-cream border border-brown-border rounded-t-2xl sm:rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-brown-border/30">
          <div>
            <h2 className="text-lg font-semibold text-brown-text">Add Seed Track</h2>
            <p className="text-sm text-brown-text/60">
              {selectedSeeds.length}/{maxSeeds} seeds selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-brown-border/10 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-brown-text" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-4 border-b border-brown-border/30">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a track from the catalog..."
            className="w-full px-4 py-2 bg-cream-dark border border-brown-border rounded-full text-brown-text placeholder:text-brown-text/40 outline-none focus:ring-2 focus:ring-accent/30"
            autoFocus
            disabled={isMaxReached}
          />
          {isMaxReached && (
            <p className="mt-2 text-sm text-brown-text/60">
              Maximum of {maxSeeds} seed tracks reached. Remove a seed to add another.
            </p>
          )}

          {/* Selected seed pills */}
          {selectedSeeds.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
              {selectedSeeds.map((track) => (
                <div
                  key={track.seq_id}
                  className="flex items-center gap-1 px-2 py-1 bg-accent/20 border border-accent/30 rounded-full text-xs text-brown-text"
                >
                  <span className="truncate max-w-[150px]">{track.track_name}</span>
                  <button
                    type="button"
                    onClick={() => onSelect(track)}
                    className="flex-shrink-0 hover:text-accent transition-colors"
                    aria-label={`Remove ${track.track_name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-96 p-2">
          {isLoading ? (
            <div className="text-center py-8 text-brown-text/60">Searching...</div>
          ) : results.length === 0 && query.trim() ? (
            <div className="text-center py-8 text-brown-text/60">No tracks found</div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-brown-text/40">
              Start typing to search for tracks
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((track) => {
                const isSelected = selectedSeeds.some(s => s.seq_id === track.seq_id);
                const isDisabled = isMaxReached && !isSelected;

                // Format artist names: replace semicolons with comma+space
                const formattedArtist = track.artist.replace(/;/g, ', ');

                return (
                  <button
                    key={track.seq_id}
                    onClick={() => !isDisabled && onSelect(track)}
                    disabled={isDisabled}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-accent/20 text-brown-text cursor-pointer hover:bg-accent/10'
                        : isDisabled
                        ? 'bg-brown-border/5 text-brown-text/40 cursor-not-allowed'
                        : 'hover:bg-brown-border/10 text-brown-text'
                    }`}
                  >
                    <div className="font-medium truncate">{track.track_name}</div>
                    <div className="text-sm text-brown-text/60 truncate">{formattedArtist}</div>
                    {isSelected && (
                      <div className="text-xs text-accent/80 mt-1">Already selected · Click to remove</div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
