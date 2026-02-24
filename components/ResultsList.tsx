"use client";

import { SearchResult } from "@/lib/types";
import TrackCard from "./TrackCard";

interface ResultsListProps {
  tracks: SearchResult[];
  currentlyPlaying: string | null;
  onPlay: (spotifyId: string, seqId: string) => void;
  onPause: () => void;
  onFindSimilar: (seqId: string) => void;
}

export default function ResultsList({
  tracks,
  currentlyPlaying,
  onPlay,
  onPause,
  onFindSimilar,
}: ResultsListProps) {
  if (tracks.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-brown-text/60 text-lg">
          No tracks found. Try different search terms.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto flex-1 min-h-0">
      <div className="space-y-4">
        {tracks.map((track, index) => (
          <div
            key={track.seq_id}
            className="animate-fade-in opacity-0"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <TrackCard
              track={track}
              isPlaying={currentlyPlaying === track.seq_id}
              onPlay={(spotifyId) => onPlay(spotifyId, track.seq_id)}
              onPause={onPause}
              onFindSimilar={onFindSimilar}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
