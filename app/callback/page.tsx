"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAccessToken, getOAuthState, clearOAuthState, getRedirectUri } from "@/lib/spotify-auth";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const spotifyError = searchParams.get("error");

    if (spotifyError) {
      setError(
        spotifyError === "access_denied"
          ? "Access denied. You can still browse without saving."
          : `Spotify error: ${spotifyError}`
      );
      return;
    }

    if (!code) {
      setError("No authorization code received.");
      return;
    }

    // Verify CSRF state
    const savedState = getOAuthState();
    clearOAuthState();

    if (!savedState || savedState !== state) {
      setError("Invalid state parameter. Please try again.");
      return;
    }

    // Exchange code for access token
    async function exchangeCode() {
      try {
        const response = await fetch("/api/spotify/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            redirect_uri: getRedirectUri(),
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Token exchange failed");
        }

        const data = await response.json();
        setAccessToken(data.access_token);
        router.replace("/");
      } catch (err) {
        console.error("Callback error:", err);
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    }

    exchangeCode();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center space-y-4">
          <p className="text-brown-text text-lg">{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-2 bg-accent/20 hover:bg-accent/30 text-brown-text rounded-full transition-colors text-sm font-medium"
          >
            Back to Sift
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <p className="text-brown-text/60 text-lg animate-pulse">
        Connecting to Spotify...
      </p>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-cream">
          <p className="text-brown-text/60 text-lg animate-pulse">Loading...</p>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
