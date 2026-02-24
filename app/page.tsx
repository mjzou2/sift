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
  const [currentlyPlaying, setCurrentlyPlaying] = useState<{ seqId: string; spotifyId: string } | null>(null);
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'error' | 'success';
    link?: { url: string; label: string };
  } | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const previewUrlCache = useRef<Map<string, string | null>>(new Map());

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
    // Stop current if playing
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
      audioRef.current.play().catch(error => {
        console.error('Audio play error:', error);
        setToastMessage({ text: 'Failed to play audio', type: 'error' });
        setTimeout(() => setToastMessage(null), 3000);
      });
      setCurrentlyPlaying({ seqId, spotifyId });
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCurrentlyPlaying(null);
  };

  // Audio element event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setCurrentlyPlaying(null);
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
  const playlistName = prompt
    ? `Sift: ${prompt.slice(0, 50)}`
    : seedTracks.length > 0
      ? `Sift: ${seedTracks[0].track_name}`
      : 'Sift Discovery';

  return (
    <main className="relative min-h-screen flex flex-col items-center px-4 select-none">
      <BackgroundDune />

      {/* Hidden audio element */}
      <audio ref={audioRef} />

      {/* Logo - fades out when searching */}
      <div className={`absolute top-[15%] left-1/2 -translate-x-1/2 z-10 transition-opacity duration-300 ${
        appState === 'landing' ? 'opacity-100 delay-300' : 'opacity-0 delay-0'
      }`}>
        <Logo />
      </div>

      {/* Prompt Bar - smoothly transitions from center to top */}
      <div className={`absolute top-0 w-full z-10 transition-all duration-1000 ease-decel ${
        appState === 'landing'
          ? 'translate-y-[calc(50vh-50%)]'
          : 'translate-y-6'
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
        <div className="w-full mt-32 pb-20">
          <div className="max-w-4xl mx-auto px-4 mb-4 flex justify-end">
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
          <ResultsList
            tracks={results}
            currentlyPlaying={currentlyPlaying?.seqId || null}
            onPlay={(spotifyId, seqId) => handlePlay(spotifyId, seqId)}
            onPause={handlePause}
            onFindSimilar={handleFindSimilar}
          />
        </div>
      )}

      {/* Toast message */}
      {toastMessage && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full z-50 shadow-lg flex items-center gap-3 ${
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
