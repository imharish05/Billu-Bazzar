import { useState, useCallback, useEffect, memo } from 'react';

/**
 * Smooth dual-handle price range slider.
 * Defined at module level (never re-created on parent re-renders).
 * Internal state drives the visual; filter fires only on pointer/touch release.
 */
const PriceRangeSlider = memo(({ priceMin = 0, priceMax = 50000, initialMin, initialMax, fmt, onApply }) => {
  const [min, setMin] = useState(initialMin ?? priceMin);
  const [max, setMax] = useState(initialMax ?? priceMax);

  // Sync when priceMax loads from server
  useEffect(() => {
    setMin(prev => (prev === 0 ? priceMin : prev));
    setMax(prev => (prev === 50000 ? priceMax : prev));
  }, [priceMin, priceMax]);

  const fillLeft  = ((min - priceMin) / (priceMax - priceMin)) * 100;
  const fillRight = 100 - ((max - priceMin) / (priceMax - priceMin)) * 100;

  const handleMinChange = useCallback((e) => {
    const step = Math.ceil((priceMax - priceMin) / 100) || 1;
    const val = Math.min(Number(e.target.value), max - step);
    setMin(val);
  }, [max, priceMin, priceMax]);

  const handleMaxChange = useCallback((e) => {
    const step = Math.ceil((priceMax - priceMin) / 100) || 1;
    const val = Math.max(Number(e.target.value), min + step);
    setMax(val);
  }, [min, priceMin, priceMax]);

  const commit = useCallback(() => {
    onApply(min, max);
  }, [min, max, onApply]);

  const clear = useCallback(() => {
    setMin(priceMin);
    setMax(priceMax);
    onApply(priceMin, priceMax);
  }, [priceMin, priceMax, onApply]);

  const isFiltered = min > priceMin || max < priceMax;
  const step = Math.max(1, Math.floor((priceMax - priceMin) / 200));

  return (
    <div className="pt-1 pb-2 select-none">
      {/* Live price labels in 2-column card grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-amber-50/40 border border-amber-200/60 rounded-lg p-2 text-center">
          <span className="block text-[8px] font-semibold uppercase tracking-wider text-brand-grey mb-0.5">Min Price</span>
          <span className="text-[11px] sm:text-xs font-bold text-brand-gold whitespace-nowrap">{fmt(min)}</span>
        </div>
        <div className="bg-amber-50/40 border border-amber-200/60 rounded-lg p-2 text-center">
          <span className="block text-[8px] font-semibold uppercase tracking-wider text-brand-grey mb-0.5">Max Price</span>
          <span className="text-[11px] sm:text-xs font-bold text-brand-gold whitespace-nowrap">{max >= priceMax ? `${fmt(priceMax)}+` : fmt(max)}</span>
        </div>
      </div>

      {/* Track + handles */}
      <div className="relative h-5 flex items-center">
        {/* Grey track background */}
        <div className="absolute w-full h-1 bg-brand-light rounded-full" />
        {/* Gold fill between handles */}
        <div
          className="absolute h-1 bg-brand-gold rounded-full pointer-events-none"
          style={{ left: `${fillLeft}%`, right: `${fillRight}%` }}
        />
        {/* Min range input */}
        <input
          type="range"
          min={priceMin}
          max={priceMax}
          step={step}
          value={min}
          onChange={handleMinChange}
          onMouseUp={commit}
          onTouchEnd={commit}
          className="price-range-input absolute w-full appearance-none bg-transparent"
          style={{ zIndex: min > priceMax - (priceMax - priceMin) * 0.1 ? 5 : 3 }}
          aria-label="Minimum price"
        />
        {/* Max range input */}
        <input
          type="range"
          min={priceMin}
          max={priceMax}
          step={step}
          value={max}
          onChange={handleMaxChange}
          onMouseUp={commit}
          onTouchEnd={commit}
          className="price-range-input absolute w-full appearance-none bg-transparent"
          style={{ zIndex: 4 }}
          aria-label="Maximum price"
        />
      </div>

      {/* Edge labels */}
      <div className="flex justify-between mt-1.5 text-[9px] text-brand-grey/50">
        <span>{fmt(priceMin)}</span>
        <span>{fmt(priceMax)}+</span>
      </div>

      {/* Clear */}
      {isFiltered && (
        <button
          onClick={clear}
          className="mt-2 text-[10px] text-brand-grey hover:text-brand-gold underline transition-colors"
        >
          Clear price filter
        </button>
      )}
    </div>
  );
});

PriceRangeSlider.displayName = 'PriceRangeSlider';

export default PriceRangeSlider;
