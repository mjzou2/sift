"use client";

import { useState } from "react";
import { ListMusic, Loader2 } from "lucide-react";
import type { SearchResult } from "@/lib/types";
import { getAccessToken, clearAccessToken } from "@/lib/spotify-auth";

interface SaveToSpotifyButtonProps {
  tracks: SearchResult[];
  playlistName: string;
  onSuccess: (playlistUrl: string) => void;
  onError: (message: string) => void;
  onAuthRequired: () => void;
  isAuthenticated: boolean;
}

export default function SaveToSpotifyButton({
  tracks,
  playlistName,
  onSuccess,
  onError,
  onAuthRequired,
  isAuthenticated,
}: SaveToSpotifyButtonProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleClick = async () => {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }

    const token = getAccessToken();
    if (!token) {
      onAuthRequired();
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/spotify/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          spotify_ids: tracks.map((t) => t.spotify_id),
          playlist_name: playlistName,
        }),
      });

      if (response.status === 401) {
        clearAccessToken();
        onError("Session expired. Please reconnect to Spotify.");
        setTimeout(() => onAuthRequired(), 2000);
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save playlist");
      }

      const data = await response.json();
      onSuccess(data.playlist_url);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save playlist");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isSaving}
      className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-tag-bg hover:bg-tag-bg/80 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed text-tag-text rounded-full transition-all text-sm font-medium"
    >
      {isSaving ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Saving...</span>
        </>
      ) : (
        <>
          <ListMusic className="w-4 h-4" />
          <span>Save to Spotify</span>
        </>
      )}
    </button>
  );
}
