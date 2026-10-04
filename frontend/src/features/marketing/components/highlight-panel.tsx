import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { IconButton } from '../../../components/ui/icon-button.tsx';
import heroImage from '../../../assets/auth-hero.jpg';
import { HIGHLIGHTS } from '../data/highlights.ts';

// Photo by Rodeo Project Management Software on Unsplash (Unsplash License: free commercial use, credit optional).
// A CSS background, not <img>: it is decorative, and the panel is hidden below lg, where browsers skip the download.

// Brand panel with a quote card. Never auto-advances (reduced motion, no text moving while being read);
// the arrows change the card and aria-live announces the new quote.
export function HighlightPanel() {
  const [index, setIndex] = useState(0);
  const highlight = HIGHLIGHTS[index];
  const step = (delta: number) => setIndex((current) => (current + delta + HIGHLIGHTS.length) % HIGHLIGHTS.length);

  return (
    <div
      className="relative flex h-full flex-col justify-between overflow-hidden bg-slate-900 bg-cover bg-[position:70%_30%] p-10 text-white"
      style={{ backgroundImage: `url(${heroImage})` }}
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-brand-900/50 via-brand-900/10 to-slate-950/80" aria-hidden="true" />

      <p className="relative text-lg font-semibold tracking-tight">Wealth Advisor</p>

      <figure className="relative rounded-2xl bg-white/10 p-8 ring-1 ring-white/15 backdrop-blur-md">
        <blockquote aria-live="polite" className="text-2xl leading-snug font-medium">
          “{highlight.quote}”
        </blockquote>
        <figcaption className="mt-8 flex items-end justify-between gap-6">
          <div>
            <p className="font-semibold">{highlight.title}</p>
            <p className="text-sm text-white/70">{highlight.detail}</p>
          </div>
          <div className="flex gap-3">
            <IconButton label="Previous highlight" variant="inverse" onClick={() => step(-1)}>
              <ArrowLeft className="size-4" />
            </IconButton>
            <IconButton label="Next highlight" variant="inverse" onClick={() => step(1)}>
              <ArrowRight className="size-4" />
            </IconButton>
          </div>
        </figcaption>
      </figure>
    </div>
  );
}
