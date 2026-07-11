import { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCcw, ZoomIn, ZoomOut, X, Play, Pause } from 'lucide-react';

/**
 * Product360Fallback
 * Amazon-grade 360° spin viewer built against a plain ordered URL array.
 * Used as the fallback when react-360-view isn't a fit or fails to render
 * (see Product360View.jsx for when each is used).
 */
const Product360Fallback = ({ images = [], onClose, productName = 'Product' }) => {
  const frameCount = images.length;
  const [frame, setFrame] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [showHint, setShowHint] = useState(true);
  const [panOrigin, setPanOrigin] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const dragState = useRef({ startX: 0, lastX: 0, lastT: 0, velocity: 0, frameAtStart: 0 });
  const rafRef = useRef(null);
  const autoplayRef = useRef(null);
  const preloaded = useRef([]);

  // Preload every frame before allowing interaction
  useEffect(() => {
    if (frameCount === 0) return;
    let cancelled = false;
    let count = 0;
    preloaded.current = new Array(frameCount);

    images.forEach((src, i) => {
      const img = new Image();
      img.src = src;
      img.onload = img.onerror = () => {
        if (cancelled) return;
        count += 1;
        preloaded.current[i] = img;
        setLoadedCount(count);
        if (count === frameCount) setReady(true);
      };
    });

    return () => { cancelled = true; };
  }, [images, frameCount]);

  // Gentle autoplay until the user first interacts
  useEffect(() => {
    if (!ready || !autoplay || isDragging || frameCount < 2) return;
    autoplayRef.current = setInterval(() => {
      setFrame(f => (f + 1) % frameCount);
    }, 70);
    return () => clearInterval(autoplayRef.current);
  }, [ready, autoplay, isDragging, frameCount]);

  const stopAutoplay = useCallback(() => {
    setAutoplay(false);
    clearInterval(autoplayRef.current);
  }, []);

  // Momentum decay after release
  const applyMomentum = useCallback(() => {
    const decay = () => {
      dragState.current.velocity *= 0.92;
      if (Math.abs(dragState.current.velocity) < 0.15) {
        rafRef.current = null;
        return;
      }
      setFrame(f => {
        const step = Math.round(dragState.current.velocity);
        let next = (f + step) % frameCount;
        if (next < 0) next += frameCount;
        return next;
      });
      rafRef.current = requestAnimationFrame(decay);
    };
    rafRef.current = requestAnimationFrame(decay);
  }, [frameCount]);

  const handlePointerDown = (e) => {
    if (!ready) return;
    stopAutoplay();
    setShowHint(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIsDragging(true);
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    dragState.current = { startX: x, lastX: x, lastT: performance.now(), velocity: 0, frameAtStart: frame };
    if (zoom > 1) setPanOrigin({ x: (e.touches ? e.touches[0].clientX : e.clientX) - panOffset.x, y: (e.touches ? e.touches[0].clientY : e.clientY) - panOffset.y });
  };

  const SENSITIVITY = Math.max(4, Math.round(280 / frameCount)); // px per frame step

  const handlePointerMove = (e) => {
    if (!isDragging || !ready) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;

    if (zoom > 1) {
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      setPanOffset({ x: x - panOrigin.x, y: y - panOrigin.y });
      return;
    }

    const now = performance.now();
    const dt = now - dragState.current.lastT;
    const deltaX = x - dragState.current.lastX;

    if (Math.abs(x - dragState.current.startX) >= SENSITIVITY / 2 || Math.abs(deltaX) >= SENSITIVITY) {
      const steps = Math.trunc(deltaX / SENSITIVITY);
      if (steps !== 0) {
        setFrame(f => {
          let next = (f - steps) % frameCount;
          if (next < 0) next += frameCount;
          return next;
        });
        dragState.current.lastX = x;
      }
    }
    if (dt > 0) dragState.current.velocity = (-deltaX / SENSITIVITY) * (16 / dt);
    dragState.current.lastT = now;
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (zoom === 1 && Math.abs(dragState.current.velocity) > 0.3) applyMomentum();
  };

  const handleWheel = (e) => {
    e.preventDefault();
    stopAutoplay();
    setZoom(z => Math.min(3, Math.max(1, z - e.deltaY * 0.0015)));
  };

  const toggleZoom = () => {
    stopAutoplay();
    setZoom(z => (z > 1 ? 1 : 2));
    setPanOffset({ x: 0, y: 0 });
  };

  const currentSrc = images[frame];
  const progress = frameCount ? Math.round((loadedCount / frameCount) * 100) : 0;

  return (
    <div className="relative w-full h-full bg-neutral-50 select-none overflow-hidden rounded-sm">
      {/* Badge */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-brand-text text-[10px] font-bold px-2.5 py-1 tracking-wider uppercase flex items-center gap-1.5 rounded-full border border-neutral-200 z-20 shadow-sm">
        <RotateCcw size={11} className={ready && !isDragging ? '' : 'animate-spin'} />
        360° View
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white hover:bg-neutral-100 text-brand-text p-1.5 rounded-full shadow border border-neutral-200 z-20"
          aria-label="Close 360 view"
        >
          <X size={14} />
        </button>
      )}

      {/* Loading state */}
      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-neutral-50">
          <div className="w-40 h-1 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-gold transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-brand-grey uppercase tracking-widest font-medium">
            Loading 360° view — {progress}%
          </span>
        </div>
      )}

      {/* Spin stage */}
      <div
        ref={containerRef}
        className={`w-full h-full flex items-center justify-center touch-none ${ready ? (zoom > 1 ? 'cursor-move' : 'cursor-grab active:cursor-grabbing') : 'cursor-wait'}`}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onWheel={handleWheel}
        onDoubleClick={toggleZoom}
      >
        {currentSrc && (
          <img
            src={currentSrc}
            alt={`${productName} — frame ${frame + 1} of ${frameCount}`}
            draggable={false}
            className="w-full h-full object-cover pointer-events-none transition-opacity duration-75"
            style={{
              opacity: ready ? 1 : 0,
              transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
            }}
          />
        )}

        {/* First-interaction hint, Amazon-style */}
        {ready && showHint && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-black/0">
            <div className="bg-white/95 px-4 py-2.5 rounded-full shadow-lg border border-neutral-200 flex items-center gap-2 animate-pulse">
              <RotateCcw size={13} className="text-brand-gold" />
              <span className="text-[11px] font-medium text-brand-text tracking-wide">Drag to rotate</span>
            </div>
          </div>
        )}
      </div>

      {/* Frame progress dots */}
      {ready && frameCount > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-32 h-0.5 bg-neutral-200 rounded-full overflow-hidden z-20">
          <div
            className="h-full bg-brand-gold transition-all duration-75"
            style={{ width: `${((frame + 1) / frameCount) * 100}%` }}
          />
        </div>
      )}

      {/* Controls */}
      {ready && (
        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 z-20">
          <button
            onClick={() => { stopAutoplay(); setZoom(z => Math.max(1, z - 0.5)); setPanOffset({ x: 0, y: 0 }); }}
            className="bg-white hover:bg-neutral-100 text-brand-text p-1.5 rounded-full shadow border border-neutral-200"
            aria-label="Zoom out"
          >
            <ZoomOut size={13} />
          </button>
          <button
            onClick={toggleZoom}
            className="bg-white hover:bg-neutral-100 text-brand-text p-1.5 rounded-full shadow border border-neutral-200"
            aria-label="Zoom in"
          >
            <ZoomIn size={13} />
          </button>
          <button
            onClick={() => setAutoplay(a => !a)}
            className="bg-white hover:bg-neutral-100 text-brand-text p-1.5 rounded-full shadow border border-neutral-200"
            aria-label={autoplay ? 'Pause autoplay' : 'Play autoplay'}
          >
            {autoplay ? <Pause size={13} /> : <Play size={13} />}
          </button>
        </div>
      )}
    </div>
  );
};

export default Product360Fallback;