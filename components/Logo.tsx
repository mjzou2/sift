interface LogoProps {
  className?: string;
}

export default function Logo({ className = '' }: LogoProps) {
  return (
    <h1 className={`font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-[#E0CCAF] font-bold tracking-wide italic select-none scale-125 ${className}`}>
      Sift
    </h1>
  );
}
