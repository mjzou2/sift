"use client";

import { SearchResult } from "@/lib/types";
import { Play, Pause, ExternalLink } from "lucide-react";

interface TrackCardProps {
  track: SearchResult;
  isPlaying: boolean;
  onPlay: (spotifyId: string) => void;
  onPause: () => void;
  onFindSimilar: (seqId: string) => void;
}

export default function TrackCard({
  track,
  isPlaying,
  onPlay,
  onPause,
  onFindSimilar,
}: TrackCardProps) {
  const spotifyWebUrl = `https://open.spotify.com/track/${track.spotify_id}`;
  const spotifyUri = `spotify:track:${track.spotify_id}`;

  const handleSpotifyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const start = Date.now();
    window.location.href = spotifyUri;
    // If the URI scheme worked, the browser will blur/navigate away quickly.
    // If not, nothing visible happens — fall back to web URL after a short delay.
    setTimeout(() => {
      if (Date.now() - start < 2000) {
        window.open(spotifyWebUrl, '_blank', 'noopener,noreferrer');
      }
    }, 500);
  };

  // Format artist names: replace semicolons with comma+space
  const formattedArtist = track.artist.replace(/;/g, ', ');

  return (
    <div className="glass border border-brown-border/50 rounded-2xl p-3 sm:p-4 md:p-5 flex gap-4 hover:bg-cream/85 transition-all duration-200 shadow-sm">
      {/* Album Art */}
      {track.album_art_url && (
        <div className="flex-shrink-0 flex items-center">
          <img
            src={track.album_art_url}
            alt={`${track.album} album art`}
            className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-xl object-cover pointer-events-none"
          />
        </div>
      )}

      {/* Content (right side) */}
      <div className="flex-1 flex flex-col gap-2.5 min-w-0">
        {/* Track info */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              {isPlaying && (
                <div className="flex items-end gap-[2px] h-3.5 flex-shrink-0" aria-label="Now playing">
                  <span className="w-[3px] bg-accent rounded-full animate-eq-1" style={{ height: '15%' }} />
                  <span className="w-[3px] bg-accent rounded-full animate-eq-2" style={{ height: '15%' }} />
                  <span className="w-[3px] bg-accent rounded-full animate-eq-3" style={{ height: '15%' }} />
                </div>
              )}
              <h3 className="font-semibold text-brown-text text-base md:text-lg truncate">
                {track.track_name}
              </h3>
            </div>
            <p className="text-brown-text/70 text-sm truncate">{formattedArtist}</p>
          </div>

          {/* Spotify link */}
          <a
            href={spotifyWebUrl}
            onClick={handleSpotifyClick}
            className="flex-shrink-0 text-brown-border hover:text-brown-text transition-colors cursor-pointer"
            aria-label="Open in Spotify"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
          </a>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {track.tags.slice(0, 5).map((tag, idx) => (
            <span
              key={idx}
              className="px-2.5 py-0.5 bg-tag-bg text-tag-text rounded-full text-xs font-medium"
            >
              {tag.name}
            </span>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Play/Pause button */}
          <button
            onClick={isPlaying ? onPause : () => onPlay(track.spotify_id)}
            className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-accent/20 hover:bg-accent/30 active:scale-[0.97] text-brown-text rounded-full transition-all text-xs sm:text-sm font-medium"
            aria-label={isPlaying ? "Pause" : "Play preview"}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Preview</span>
              </>
            )}
          </button>

          {/* Find Similar button */}
          <button
            onClick={() => onFindSimilar(track.seq_id)}
            className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-brown-border/10 hover:bg-brown-border/20 active:scale-[0.97] text-brown-text rounded-full transition-all text-xs sm:text-sm font-medium"
          >
            Find Similar
          </button>
        </div>
      </div>
    </div>
  );
}
