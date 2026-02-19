import BackgroundDune from "@/components/BackgroundDune";
import Logo from "@/components/Logo";
import PromptBar from "@/components/PromptBar";
import AmbientToggle from "@/components/AmbientToggle";

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center px-4 select-none">
      <BackgroundDune />

      {/* Logo positioned near top */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 z-10">
        <Logo />
      </div>

      {/* Prompt bar centered vertically and horizontally */}
      <div className="flex items-center justify-center min-h-screen w-full z-10">
        <PromptBar />
      </div>

      <AmbientToggle />
    </main>
  );
}
