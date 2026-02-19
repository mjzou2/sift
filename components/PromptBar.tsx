"use client";

import { useState } from "react";

export default function PromptBar() {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Search functionality (Phase 2)
    console.log("Search:", prompt);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="prompt-bar w-full max-w-5xl px-2 py-2 flex items-center gap-2 shadow-lg"
    >
      {/* Add seed track button */}
      <button
        type="button"
        className="flex-shrink-0 w-10 h-10 rounded-full bg-brown-border/10 hover:bg-brown-border/20 transition-colors flex items-center justify-center text-brown-border text-xl font-semibold"
        aria-label="Add seed track"
        onClick={() => {
          // TODO: Open autocomplete modal (Phase 2)
          console.log("Add seed track");
        }}
      >
        +
      </button>

      {/* Text input */}
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your vibe... or add a seed track"
        className="flex-1 bg-transparent border-none outline-none text-brown-text placeholder:text-brown-text/40 text-sm md:text-base select-text"
      />

      {/* Submit button */}
      <button
        type="submit"
        className="flex-shrink-0 px-6 py-2 bg-accent hover:bg-accent/90 transition-colors rounded-full text-cream font-medium text-sm"
      >
        Sift
      </button>
    </form>
  );
}
