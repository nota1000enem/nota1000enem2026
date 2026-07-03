/**
 * HeroFX — animated backdrop for the hero section.
 * White dot cloud (drifting) + red laser sweep, inspired by v0-escolaonline.
 * Pure CSS + inline SVG, no runtime deps.
 */
export function HeroFX() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Radial vignette so content stays legible */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_45%,hsl(var(--background)/0.85)_100%)]" />

      {/* Drifting dot cloud — two layers for parallax */}
      <div className="hero-dots hero-dots-a" />
      <div className="hero-dots hero-dots-b" />

      {/* Organic blob outline (red) that slowly rotates */}
      <svg
        className="hero-blob"
        viewBox="0 0 600 600"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="blobGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.65 0.28 25)" stopOpacity="0.35" />
            <stop offset="70%" stopColor="oklch(0.55 0.30 25)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <path
          fill="url(#blobGrad)"
          d="M300,80 C420,80 520,180 520,300 C520,430 410,520 300,520 C170,520 80,410 80,300 C80,180 190,80 300,80 Z"
        />
      </svg>

      {/* Horizontal red laser sweep */}
      <div className="hero-laser" />

      {/* Subtle grid overlay */}
      <div className="hero-grid-overlay" />
    </div>
  );
}
