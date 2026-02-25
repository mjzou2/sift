"use client";

import { useState, useRef, useEffect } from "react";
import BackgroundDune from "@/components/BackgroundDune";
import Logo from "@/components/Logo";
import PromptBar from "@/components/PromptBar";
import AmbientToggle from "@/components/AmbientToggle";
import ResultsList from "@/components/ResultsList";
import SeedTrackModal from "@/components/SeedTrackModal";
import SaveToSpotifyButton from "@/components/SaveToSpotifyButton";
import type { SearchResult } from "@/lib/types";
import {
  buildAuthUrl,
  savePreAuthState,
  loadPreAuthState,
  getAccessToken,
} from "@/lib/spotify-auth";

type AppState = 'landing' | 'loading' | 'results';

interface SeedTrack {
  seq_id: string;
  track_name: string;
  artist: string;
}

export default function Home() {
  // State management
  const [appState, setAppState] = useState<AppState>('landing');
  const [prompt, setPrompt] = useState('');
  const [seedTracks, setSeedTracks] = useState<SeedTrack[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<{ seqId: string; spotifyId: string; paused?: boolean } | null>(null);
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'error' | 'success';
    link?: { url: string; label: string };
  } | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const previewUrlCache = useRef<Map<string, string | null>>(new Map());
  const resultsRef = useRef<SearchResult[]>(results);
  resultsRef.current = results;
  const currentlyPlayingRef = useRef(currentlyPlaying);
  currentlyPlayingRef.current = currentlyPlaying;
  const handlePlayRef = useRef<(spotifyId: string, seqId: string) => void>(() => {});

  // Search handler
  const handleSearch = async () => {
    if (!prompt && seedTracks.length === 0) return;

    setAppState('loading');
    setToastMessage(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt || undefined,
          seed_track_ids: seedTracks.length > 0 ? seedTracks.map(t => t.seq_id) : undefined,
          limit: 20
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Search failed');
      }

      const data = await response.json();
      setResults(data.tracks);
      setAppState('results');
    } catch (error) {
      console.error('Search error:', error);
      setToastMessage({ text: error instanceof Error ? error.message : 'Search failed', type: 'error' });
      setAppState('landing');
    }
  };

  // Audio playback handlers
  const handlePlay = async (spotifyId: string, seqId: string) => {
    // Resume if same track is paused
    if (currentlyPlaying?.seqId === seqId && currentlyPlaying?.paused && audioRef.current) {
      audioRef.current.play().catch(error => {
        console.error('Audio resume error:', error);
      });
      setCurrentlyPlaying({ seqId, spotifyId });
      return;
    }

    // Stop current if playing a different track
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }

    // Check cache first
    let previewUrl = previewUrlCache.current.get(spotifyId);

    if (previewUrl === undefined) {
      // Fetch from Spotify API
      try {
        const response = await fetch(`/api/spotify/preview?id=${spotifyId}`);
        const data = await response.json();
        const fetchedUrl: string | null = data.preview_url ?? null;
        previewUrl = fetchedUrl;
        previewUrlCache.current.set(spotifyId, fetchedUrl);
      } catch (error) {
        console.error('Failed to fetch preview URL:', error);
        previewUrl = null;
        previewUrlCache.current.set(spotifyId, null);
      }
    }

    if (!previewUrl) {
      // Show "No preview available" message
      setToastMessage({ text: 'Preview not available for this track', type: 'error' });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    // Play audio
    if (audioRef.current) {
      audioRef.current.src = previewUrl;
      audioRef.current.volume = 0.15;
      audioRef.current.play().catch(error => {
        console.error('Audio play error:', error);
        setToastMessage({ text: 'Failed to play audio', type: 'error' });
        setTimeout(() => setToastMessage(null), 3000);
      });
      setCurrentlyPlaying({ seqId, spotifyId });
    }
  };

  handlePlayRef.current = handlePlay;

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (currentlyPlaying) {
      setCurrentlyPlaying({ ...currentlyPlaying, paused: true });
    }
  };

  // Audio element event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      const tracks = resultsRef.current;
      const playing = currentlyPlayingRef.current;
      if (playing && tracks.length > 0) {
        const currentIdx = tracks.findIndex(r => r.seq_id === playing.seqId);
        const nextTrack = currentIdx >= 0 ? tracks[currentIdx + 1] : undefined;
        if (nextTrack) {
          handlePlayRef.current(nextTrack.spotify_id, nextTrack.seq_id);
          return;
        }
      }
      setCurrentlyPlaying(null);
    };
    const handleError = () => {
      setToastMessage({ text: 'Failed to play audio', type: 'error' });
      setTimeout(() => setToastMessage(null), 3000);
      setCurrentlyPlaying(null);
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // Find Similar handler
  const handleFindSimilar = (seqId: string) => {
    // Stop audio
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    setCurrentlyPlaying(null);

    // Find the track in results
    const track = results.find(r => r.seq_id === seqId);
    if (!track) return;

    // Replace seed tracks with this one track
    setSeedTracks([{
      seq_id: track.seq_id,
      track_name: track.track_name,
      artist: track.artist
    }]);

    // Prompt is preserved
    // Re-run search
    handleSearch();
  };

  // Clear handler
  const handleClear = () => {
    // Stop audio
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }

    setAppState('landing');
    setPrompt('');
    setSeedTracks([]);
    setResults([]);
    setCurrentlyPlaying(null);
    setToastMessage(null);
  };

  // Restore Spotify token and search state after OAuth redirect
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setSpotifyToken(token);
    }

    const savedState = loadPreAuthState();
    if (savedState) {
      setPrompt(savedState.prompt);
      setSeedTracks(savedState.seedTracks);
      setResults(savedState.results);
      setAppState(savedState.appState);
    }
  }, []);

  // Spotify OAuth handler
  const handleSpotifyAuth = () => {
    savePreAuthState({ prompt, seedTracks, results, appState });
    window.location.href = buildAuthUrl();
  };

  // Playlist name for Spotify save
  const playlistName = 'Sift';

  return (
    <main className="relative h-screen flex flex-col items-center px-4 select-none overflow-hidden">
      <BackgroundDune />

      {/* Hidden audio element */}
      <audio ref={audioRef} />

      {/* Logo - fades out when searching */}
      <div className={`absolute top-[12%] sm:top-[15%] left-1/2 -translate-x-1/2 z-10 transition-opacity duration-300 ${
        appState === 'landing' ? 'opacity-100 delay-300' : 'opacity-0 pointer-events-none delay-0'
      }`}>
        <Logo />
      </div>

      {/* Footer — landing page only */}
      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-10 transition-opacity duration-300 ${
        appState === 'landing' ? 'opacity-100 delay-300' : 'opacity-0 pointer-events-none delay-0'
      }`}>
        <a
          href="https://github.com/mjzou2"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brown-text/30 hover:text-brown-text/50 transition-colors text-xs"
        >
          Built by Michael
        </a>
      </div>

      {/* Prompt Bar - smoothly transitions from center to top */}
      <div className={`absolute top-0 w-full z-10 transition-all duration-1000 ease-decel ${
        appState === 'landing'
          ? 'translate-y-[calc(50vh-50%)]'
          : 'translate-y-3 sm:translate-y-6'
      }`}>
        <div className={`w-full mx-auto px-4 transition-all duration-1000 ease-decel ${
          appState === 'landing' ? 'max-w-5xl' : 'max-w-4xl'
        }`}>
          <PromptBar
            mode={appState === 'landing' ? 'landing' : 'compact'}
            prompt={prompt}
            onPromptChange={setPrompt}
            onSearch={handleSearch}
            seed={{
              tracks: seedTracks,
              onAdd: () => setIsSeedModalOpen(true),
              onRemove: (seqId) => setSeedTracks(seeds => seeds.filter(s => s.seq_id !== seqId)),
            }}
            onClear={handleClear}
            isSearching={appState === 'loading'}
          />
        </div>
      </div>

      {/* Loading state */}
      {appState === 'loading' && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-brown-text/60 text-lg animate-pulse">Searching...</div>
        </div>
      )}

      {/* Results */}
      {appState === 'results' && (
        <div className="w-full mt-20 sm:mt-24 pb-8 sm:pb-10 flex-1 min-h-0">
          <div className="max-w-4xl mx-auto px-4 h-full">
            <div className="bg-brown-text/5 rounded-2xl p-3 sm:p-4 h-full flex flex-col">
              {/* SaveToSpotifyButton hidden until extended quota approved
              <div className="flex justify-end mb-2">
                <SaveToSpotifyButton
                  tracks={results}
                  playlistName={playlistName}
                  onSuccess={(playlistUrl) => {
                    setToastMessage({
                      text: 'Playlist saved!',
                      type: 'success',
                      link: { url: playlistUrl, label: 'Open in Spotify' },
                    });
                    setTimeout(() => setToastMessage(null), 6000);
                  }}
                  onError={(message) => {
                    setToastMessage({ text: message, type: 'error' });
                    setTimeout(() => setToastMessage(null), 4000);
                  }}
                  onAuthRequired={handleSpotifyAuth}
                  isAuthenticated={!!spotifyToken}
                />
              </div>
              */}
              <ResultsList
                tracks={results}
                currentlyPlaying={currentlyPlaying && !currentlyPlaying.paused ? currentlyPlaying.seqId : null}
                onPlay={(spotifyId, seqId) => handlePlay(spotifyId, seqId)}
                onPause={handlePause}
                onFindSimilar={handleFindSimilar}
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast message */}
      {toastMessage && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 max-w-[calc(100vw-48px)] px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base rounded-full z-50 shadow-lg flex items-center gap-3 animate-fade-in ${
          toastMessage.type === 'success'
            ? 'bg-accent/90 text-cream'
            : 'bg-brown-border/90 text-cream'
        }`}>
          <span>{toastMessage.text}</span>
          {toastMessage.link && (
            <a
              href={toastMessage.link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium hover:opacity-80"
            >
              {toastMessage.link.label}
            </a>
          )}
        </div>
      )}

      {/* Seed track selection modal */}
      <SeedTrackModal
        isOpen={isSeedModalOpen}
        onClose={() => setIsSeedModalOpen(false)}
        onSelect={(track) => {
          const alreadySelected = seedTracks.some(s => s.seq_id === track.seq_id);

          if (alreadySelected) {
            // Deselect (toggle off)
            setSeedTracks(seedTracks.filter(s => s.seq_id !== track.seq_id));
          } else if (seedTracks.length < 5) {
            // Add new seed
            const newSeeds = [...seedTracks, track];
            setSeedTracks(newSeeds);

            // Auto-close if this was the 5th seed (with 200ms delay for visual feedback)
            if (newSeeds.length === 5) {
              setTimeout(() => setIsSeedModalOpen(false), 200);
            }
          }
        }}
        selectedSeeds={seedTracks}
        maxSeeds={5}
      />

      <AmbientToggle />
    </main>
  );
}
