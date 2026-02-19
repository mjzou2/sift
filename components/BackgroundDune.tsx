export default function BackgroundDune() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/dune.png"
        alt="Sand dune background"
        className="w-full h-full object-cover object-center"
      />
      {/* Sun rays overlay - subtle animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/20 to-transparent animate-sun-rays pointer-events-none" />
    </div>
  );
}
