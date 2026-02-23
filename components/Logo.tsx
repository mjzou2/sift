interface LogoProps {
  className?: string;
}

export default function Logo({ className = '' }: LogoProps) {
  return (
    <h1 className={`font-display text-7xl md:text-8xl lg:text-9xl text-sand/70 font-bold tracking-wide italic select-none scale-110 ${className}`}>
      Sift
    </h1>
  );
}
