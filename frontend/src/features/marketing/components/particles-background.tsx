import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  colorType: 'brand' | 'gold' | 'neutral';
  alpha: number;
}

interface Palette {
  brand: string;
  gold: string;
  neutral: string;
  lineAlpha: number;
}

const LIGHT_PALETTE: Palette = {
  brand: '11, 107, 74',     // #0b6b4a emerald
  gold: '138, 109, 27',     // #8a6d1b warm gold
  neutral: '111, 105, 99',  // #6f6963 subtle slate
  lineAlpha: 0.16,
};

const DARK_PALETTE: Palette = {
  brand: '16, 185, 129',    // #10b981 vibrant emerald
  gold: '212, 175, 55',     // #d4af37 champagne gold
  neutral: '168, 176, 160', // #a8b0a0 subtle slate
  lineAlpha: 0.22,
};

function getActivePalette(): Palette {
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return DARK_PALETTE;
  }
  return LIGHT_PALETTE;
}

export function ParticlesBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number | null = null;
    let isVisible = true;
    let palette = getActivePalette();

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Mouse tracking for particles.js interactivity (hover connect + gentle repulse)
    const mouse = {
      x: -9999,
      y: -9999,
      active: false,
      radius: 130,
    };

    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles: Particle[] = [];

    const handleResize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Adaptive count: ~1 particle per 15,000 px², clamped 35..85
      const targetCount = Math.max(35, Math.min(85, Math.floor((width * height) / 15000)));

      if (particles.length === 0) {
        particles = Array.from({ length: targetCount }, () => createParticle(width, height));
      } else if (particles.length < targetCount) {
        while (particles.length < targetCount) {
          particles.push(createParticle(width, height));
        }
      } else if (particles.length > targetCount) {
        particles.length = targetCount;
      }
    };

    function createParticle(w: number, h: number): Particle {
      const typeRand = Math.random();
      const colorType: Particle['colorType'] =
        typeRand < 0.5 ? 'brand' : typeRand < 0.8 ? 'gold' : 'neutral';

      return {
        x: Math.random() * (w || 800),
        y: Math.random() * (h || 600),
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.5 + 1.2,
        colorType,
        alpha: Math.random() * 0.35 + 0.35,
      };
    }

    const render = () => {
      if (!ctx || width === 0 || height === 0) return;

      ctx.clearRect(0, 0, width, height);

      const maxDist = 125;
      const maxDistSq = maxDist * maxDist;
      const count = particles.length;

      // Draw connecting lines between close particles (particles.js network effect)
      for (let i = 0; i < count; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < count; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistSq) {
            const dist = Math.sqrt(distSq);
            const lineOpacity = (1 - dist / maxDist) * palette.lineAlpha;
            const rgb = palette[p1.colorType];

            ctx.strokeStyle = `rgba(${rgb}, ${lineOpacity.toFixed(3)})`;
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Mouse hover interaction: interactive connecting line + subtle push
        if (mouse.active) {
          const mdx = p1.x - mouse.x;
          const mdy = p1.y - mouse.y;
          const mDist = Math.hypot(mdx, mdy);

          if (mDist < mouse.radius) {
            // Interactive connection line to cursor
            const mouseLineAlpha = (1 - mDist / mouse.radius) * (palette.lineAlpha * 1.5);
            ctx.strokeStyle = `rgba(${palette.brand}, ${mouseLineAlpha.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();

            // Gentle repulse within 65px
            if (mDist < 65 && mDist > 0) {
              const force = (65 - mDist) / 65;
              p1.x += (mdx / mDist) * force * 0.8;
              p1.y += (mdy / mDist) * force * 0.8;
            }
          }
        }
      }

      // Update & draw particle nodes
      for (let i = 0; i < count; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;

          // Wrap edges smoothly
          if (p.x < -10) p.x = width + 10;
          else if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          else if (p.y > height + 10) p.y = -10;
        }

        const rgb = palette[p.colorType];
        ctx.fillStyle = `rgba(${rgb}, ${p.alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!prefersReducedMotion && isVisible) {
        animId = requestAnimationFrame(render);
      }
    };

    // Observers & Listeners
    handleResize();

    // Theme toggle observer: switches palette dynamically when .dark changes
    const themeObserver = new MutationObserver(() => {
      palette = getActivePalette();
      if (prefersReducedMotion) {
        render();
      }
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Viewport intersection observer: pauses loop when off-screen
    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !prefersReducedMotion && animId === null) {
          animId = requestAnimationFrame(render);
        } else if (!isVisible && animId !== null) {
          cancelAnimationFrame(animId);
          animId = null;
        }
      },
      { threshold: 0.05 }
    );
    io.observe(container);

    // Tab visibility handling: pauses when user switches tabs
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animId !== null) {
          cancelAnimationFrame(animId);
          animId = null;
        }
      } else if (isVisible && !prefersReducedMotion && animId === null) {
        animId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Mouse movement listener
    const handleMouseMove = (e: MouseEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active =
        mouse.x >= 0 && mouse.x <= rect.width && mouse.y >= 0 && mouse.y <= rect.height;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    // Initial render
    render();

    return () => {
      if (animId !== null) cancelAnimationFrame(animId);
      themeObserver.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-testid="particles-background"
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-[680px] sm:h-[780px] lg:h-[860px] overflow-hidden z-0 select-none [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)]"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
