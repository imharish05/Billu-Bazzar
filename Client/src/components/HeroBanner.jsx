import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AUTOPLAY_INTERVAL = 6500;

const HeroBanner = () => {
  const { items: allBanners, loading } = useSelector(s => s.banners);
  const banners = allBanners.filter(b => b.type === 'HERO');
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const goTo = useCallback((index) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  }, [current]);

  const next = useCallback(() => {
    if (banners.length < 2) return;
    setDirection(1);
    setCurrent(prev => (prev + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    if (banners.length < 2) return;
    setDirection(-1);
    setCurrent(prev => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(next, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [banners.length, next, current]);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e) => { touchEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  if (loading) {
    return (
      <section className="relative min-h-screen flex items-center overflow-hidden bg-brand-light" aria-label="Hero banner loading">
        <div className="w-full h-full skeleton" />
      </section>
    );
  }

  if (banners.length === 0) {
    return (
      <section className="relative min-h-screen flex items-center overflow-hidden bg-brand-text" aria-label="Hero banner">
        <div className="relative z-10 max-w-site mx-auto px-6 md:px-16 w-full">
          <div className="glass-hero-panel max-w-xl p-8 md:p-12">
            <p className="text-brand-gold text-xs tracking-[0.25em] uppercase mb-4">Billu Bazaar</p>
            <h1 className="font-playfair text-4xl md:text-6xl font-bold text-white leading-tight mb-6">Luxury Redefined</h1>
            <p className="text-white/80 text-base md:text-lg mb-8 max-w-sm">Discover handcrafted elegance from India's finest artisans.</p>
            <Link to="/products" className="btn-primary" id="hero-cta-fallback">Explore Collection</Link>
          </div>
        </div>
      </section>
    );
  }

  const banner = banners[current];

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      aria-label="Hero banner carousel"
      role="region"
      aria-roledescription="carousel"
    >
      {/* Background images */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={banner.id || current}
          custom={direction}
          initial={{ opacity: 0, x: direction > 0 ? 200 : -200 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction > 0 ? -200 : 200 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={banner.image}
            alt={banner.title}
            className="w-full h-full object-cover"
            fetchpriority="high"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 max-w-site mx-auto px-6 md:px-16 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={banner.id || current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="glass-hero-panel max-w-xl p-8 md:p-12"
          >
            {banner.badgeText && (
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-brand-gold text-white text-[10px] font-bold px-3 py-1 inline-block mb-4 tracking-wider uppercase"
              >
                {banner.badgeText}
              </motion.span>
            )}
            <motion.h1
              className="font-playfair text-4xl md:text-6xl font-bold text-white leading-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {banner.title.split(' ').map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.08 }}
                  className="inline-block mr-3"
                >
                  {word}
                </motion.span>
              ))}
            </motion.h1>
            {banner.subtitle && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-white/80 text-base md:text-lg mb-8 max-w-sm"
              >
                {banner.subtitle}
              </motion.p>
            )}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Link to={banner.ctaLink || '/products'} className="btn-primary-hero" id={`hero-cta-${current}`}>
                {banner.ctaText || 'Explore Collection'}
              </Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows — desktop only */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white transition-all duration-200 focus-visible:outline-white"
            aria-label="Previous banner"
            id="hero-arrow-prev"
          >
            <ChevronLeft size={22} strokeWidth={1.5} />
          </button>
          <button
            onClick={next}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white transition-all duration-200 focus-visible:outline-white"
            aria-label="Next banner"
            id="hero-arrow-next"
          >
            <ChevronRight size={22} strokeWidth={1.5} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2" role="tablist" aria-label="Banner slides">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              role="tab"
              aria-selected={current === i}
              aria-label={`Go to slide ${i + 1}`}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 focus-visible:outline-white ${
                current === i ? 'bg-brand-gold w-6' : 'bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-20 md:bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        aria-hidden="true"
      >
        <div className="w-px h-10 bg-white/40" />
        <span className="text-white/50 text-[10px] uppercase tracking-widest">Scroll</span>
      </motion.div>
    </section>
  );
};

export default HeroBanner;
