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

      {/* Floating sand particles — light amber dots drifting like sunlit dust */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-1 h-1 rounded-full bg-amber-200/60 top-[18%] left-[10%] animate-float-1" style={{ animationDelay: '0s' }} />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-200/45 top-[42%] left-[55%] animate-float-2" style={{ animationDelay: '-7s' }} />
        <div className="absolute w-1 h-1 rounded-full bg-amber-200/55 top-[68%] left-[25%] animate-float-3" style={{ animationDelay: '-3s' }} />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-200/40 top-[30%] left-[75%] animate-float-1" style={{ animationDelay: '-14s' }} />
        <div className="absolute w-1 h-1 rounded-full bg-amber-200/50 top-[55%] left-[40%] animate-float-3" style={{ animationDelay: '-10s' }} />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-200/60 top-[22%] left-[85%] animate-float-2" style={{ animationDelay: '-20s' }} />
        <div className="absolute w-1 h-1 rounded-full bg-amber-200/45 top-[75%] left-[60%] animate-float-1" style={{ animationDelay: '-22s' }} />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-200/50 top-[48%] left-[15%] animate-float-2" style={{ animationDelay: '-16s' }} />
        <div className="absolute w-1 h-1 rounded-full bg-amber-200/55 top-[85%] left-[45%] animate-float-3" style={{ animationDelay: '-5s' }} />
        <div className="absolute w-1 h-1 rounded-full bg-amber-200/40 top-[12%] left-[35%] animate-float-2" style={{ animationDelay: '-4s' }} />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-200/50 top-[60%] left-[70%] animate-float-1" style={{ animationDelay: '-11s' }} />
        <div className="absolute w-1 h-1 rounded-full bg-amber-200/55 top-[38%] left-[90%] animate-float-3" style={{ animationDelay: '-18s' }} />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-200/45 top-[50%] left-[5%] animate-float-2" style={{ animationDelay: '-26s' }} />
        <div className="absolute w-1 h-1 rounded-full bg-amber-200/60 top-[80%] left-[80%] animate-float-1" style={{ animationDelay: '-9s' }} />
        <div className="absolute w-1 h-1 rounded-full bg-amber-200/50 top-[8%] left-[50%] animate-float-3" style={{ animationDelay: '-13s' }} />
        <div className="absolute w-1 h-1 rounded-full bg-amber-200/55 top-[5%] left-[20%] animate-float-1" style={{ animationDelay: '-2s' }} />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-200/40 top-[35%] left-[65%] animate-float-3" style={{ animationDelay: '-24s' }} />
        <div className="absolute w-1 h-1 rounded-full bg-amber-200/50 top-[72%] left-[48%] animate-float-2" style={{ animationDelay: '-8s' }} />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-200/55 top-[15%] left-[58%] animate-float-1" style={{ animationDelay: '-19s' }} />
        <div className="absolute w-1 h-1 rounded-full bg-amber-200/45 top-[90%] left-[30%] animate-float-3" style={{ animationDelay: '-15s' }} />
        <div className="absolute w-1 h-1 rounded-full bg-amber-200/60 top-[25%] left-[42%] animate-float-2" style={{ animationDelay: '-1s' }} />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-200/40 top-[65%] left-[88%] animate-float-1" style={{ animationDelay: '-27s' }} />
        <div className="absolute w-1 h-1 rounded-full bg-amber-200/50 top-[45%] left-[22%] animate-float-3" style={{ animationDelay: '-6s' }} />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-200/55 top-[58%] left-[12%] animate-float-2" style={{ animationDelay: '-21s' }} />
        <div className="absolute w-1 h-1 rounded-full bg-amber-200/45 top-[3%] left-[72%] animate-float-1" style={{ animationDelay: '-12s' }} />
        <div className="absolute w-1 h-1 rounded-full bg-amber-200/60 top-[78%] left-[95%] animate-float-3" style={{ animationDelay: '-17s' }} />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-200/40 top-[33%] left-[2%] animate-float-2" style={{ animationDelay: '-23s' }} />
        <div className="absolute w-1 h-1 rounded-full bg-amber-200/50 top-[52%] left-[82%] animate-float-1" style={{ animationDelay: '-30s' }} />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-200/55 top-[88%] left-[62%] animate-float-3" style={{ animationDelay: '-25s' }} />
        <div className="absolute w-1 h-1 rounded-full bg-amber-200/45 top-[40%] left-[32%] animate-float-2" style={{ animationDelay: '-28s' }} />
      </div>
    </div>
  );
}
