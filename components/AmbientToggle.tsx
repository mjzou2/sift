"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export default function AmbientToggle() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadingRef = useRef<number | null>(null);

  const fadeVolume = useCallback(
    (audio: HTMLAudioElement, from: number, to: number, durationMs: number, onComplete?: () => void) => {
      // Cancel any existing fade
      if (fadingRef.current !== null) {
        cancelAnimationFrame(fadingRef.current);
        fadingRef.current = null;
      }

      const startTime = performance.now();
      audio.volume = from;

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);

        audio.volume = Math.min(1, Math.max(0, from + (to - from) * progress));

        if (progress < 1) {
          fadingRef.current = requestAnimationFrame(step);
        } else {
          fadingRef.current = null;
          onComplete?.();
        }
      };

      fadingRef.current = requestAnimationFrame(step);
    },
    []
  );

  const toggleAmbient = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isPlaying) {
      // Turn ON: start silent, fade in
      audio.volume = 0;
      audio.play().catch(() => {
        // Browser may block if no user gesture — silently fail
      });
      fadeVolume(audio, 0, 0.15, 1000);
      setIsPlaying(true);
    } else {
      // Turn OFF: fade out, then pause
      setIsPlaying(false);
      fadeVolume(audio, audio.volume, 0, 1000, () => {
        audio.pause();
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fadingRef.current !== null) {
        cancelAnimationFrame(fadingRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <>
      <audio ref={audioRef} src="/wind.wav" loop preload="none" />
      <button
        onClick={toggleAmbient}
        className="fixed bottom-6 right-6 p-2 transition-opacity hover:opacity-70 cursor-pointer z-20"
        aria-label={isPlaying ? "Mute ambient wind" : "Play ambient wind"}
      >
        {/* Wind/speaker icon (simplified SVG) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={`w-6 h-6 transition-colors cursor-pointer ${
            isPlaying ? "text-brown-border" : "text-brown-border/50"
          }`}
        >
          {isPlaying ? (
            // Speaker icon (on state)
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
            />
          ) : (
            // Speaker muted icon (off state)
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
            />
          )}
        </svg>
      </button>
    </>
  );
}
