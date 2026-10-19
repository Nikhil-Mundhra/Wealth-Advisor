import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { IconButton } from '../../../components/ui/icon-button.tsx';
import logoImg from '../../../assets/logo.png';
import portrait1 from '../../../assets/auth-portrait-1.jpg';
import portrait2 from '../../../assets/auth-portrait-2.jpg';
import portrait3 from '../../../assets/auth-portrait-3.jpg';
import portrait4 from '../../../assets/auth-portrait-4.jpg';
import portrait5 from '../../../assets/auth-portrait-5.jpg';
import { HIGHLIGHTS } from '../data/highlights.ts';

const BASE_SLIDES = [
  { image: portrait1, highlight: HIGHLIGHTS[0], alt: 'Advisor working on portfolio analysis with city skyline view' },
  { image: portrait2, highlight: HIGHLIGHTS[1], alt: 'Professional analyzing balance sheets and ledger accounts' },
  { image: portrait3, highlight: HIGHLIGHTS[2], alt: 'Quantitative analyst reviewing mathematical models and spreadsheets' },
  { image: portrait4, highlight: HIGHLIGHTS[3], alt: 'Financial planner reviewing asset allocations and reports' },
  { image: portrait5, highlight: HIGHLIGHTS[4], alt: 'Advisory team conducting deep quantitative portfolio strategy' },
];

// Fisher-Yates shuffle
function shuffleSlides<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function HighlightPanel() {
  const [slides] = useState(() => shuffleSlides(BASE_SLIDES));
  const [index, setIndex] = useState(() => Math.floor(Math.random() * BASE_SLIDES.length));

  // 20-second automatic rotation loop
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 20000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const step = (delta: number) => {
    setIndex((current) => (current + delta + slides.length) % slides.length);
  };

  const currentSlide = slides[index];

  return (
    <div className="relative flex h-full min-h-[640px] flex-col justify-between overflow-hidden bg-stone-950 p-8 lg:p-12 text-stone-100">
      {/* Background Images: Smooth crossfade without jump or scaling glitch */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {slides.map((slide, i) => (
          <img
            key={slide.image}
            src={slide.image}
            alt={slide.alt}
            className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ease-out will-change-[opacity] ${
              i === index ? 'opacity-90' : 'opacity-0 pointer-events-none'
            }`}
          />
        ))}
        {/* Warm, natural institutional gradient scrims aligned with stone/surface palette */}
        <div className="absolute inset-0 bg-linear-to-t from-stone-950 via-stone-950/40 to-stone-950/65" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Brand Header */}
      <div className="relative z-10">
        <Link
          to="/home"
          className="inline-flex items-center gap-3 transition-opacity hover:opacity-85"
          title="Return to Syntropy AI Home"
        >
          <img
            src={logoImg}
            alt="Syntropy AI Logo"
            className="size-10 object-contain drop-shadow-md"
          />
          <span className="font-display text-xl font-bold tracking-tight text-white drop-shadow-xs">
            Syntropy AI
          </span>
        </Link>
      </div>

      {/* Information / Philosophical Principle Card with Warm Glassy Semi-Opaque Treatment */}
      <div className="relative z-10">
        <figure className="rounded-card border border-white/15 bg-black/35 p-6 sm:p-8 backdrop-blur-xl shadow-2xl ring-1 ring-white/10 transition-all duration-500">
          <div className="transition-opacity duration-500 ease-out">
            <p
              key={currentSlide.highlight.statement}
              aria-live="polite"
              className="font-display text-xl sm:text-2xl leading-snug font-medium text-white text-pretty drop-shadow-xs transition-all duration-500"
            >
              "{currentSlide.highlight.statement}"
            </p>

            <figcaption className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-white/15 pt-4">
              <div>
                <p className="font-semibold text-white text-sm sm:text-base drop-shadow-xs">
                  {currentSlide.highlight.title}
                </p>
                <p className="text-xs text-stone-300">
                  {currentSlide.highlight.detail}
                </p>
              </div>

              {/* Slide Navigation & Indicator Dots */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 mr-2">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`Go to slide ${i + 1}`}
                      className={`h-1.5 transition-all cursor-pointer rounded-control ${
                        i === index ? 'w-5 bg-white shadow-xs' : 'w-1.5 bg-white/40 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>

                <IconButton
                  label="Previous quote"
                  variant="inverse"
                  onClick={() => step(-1)}
                >
                  <ArrowLeft className="size-4" />
                </IconButton>
                <IconButton
                  label="Next quote"
                  variant="inverse"
                  onClick={() => step(1)}
                >
                  <ArrowRight className="size-4" />
                </IconButton>
              </div>
            </figcaption>
          </div>
        </figure>
      </div>
    </div>
  );
}
