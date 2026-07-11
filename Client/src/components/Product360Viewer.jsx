import ThreeSixty from 'react-360-view';
import { RotateCcw, X } from 'lucide-react';
import ThreeSixtyErrorBoundary from './ThreeSixtyErrorBoundary';
import Product360Fallback from './Product360Fallback';

/**
 * Product360View
 * Renders the real `react-360-view` <ThreeSixty> component against the
 * sequential frame set the backend materializes for each product
 * (see Server/services/spinSequenceService.js). That package needs a
 * single folder + fileName pattern ("frame_{index}.ext"), which is
 * exactly what spinImagePath/spinImageCount/spinImageExt describe.
 *
 * If materialized frames aren't ready yet (legacy product, still
 * processing) or the package throws, falls back to Product360Fallback,
 * which drives the same UX directly off the raw spin_images URL array.
 */
const Product360Viewer = ({ product, onClose }) => {
  const spinImages = Array.isArray(product?.spin_images) ? product.spin_images : [];
  const count = product?.spinImageCount || 0;
  const path = product?.spinImagePath;
  const ext = product?.spinImageExt || 'jpg';

  const hasMaterializedSequence = count >= 2 && !!path;

  if (!hasMaterializedSequence) {
    if (spinImages.length > 1) {
      return <Product360Fallback images={spinImages} productName={product?.name} onClose={onClose} />;
    }
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 relative bg-neutral-50">
        <div className="absolute top-4 left-4 bg-brand-gold/10 text-brand-gold text-[10px] font-bold px-2.5 py-1 tracking-wider uppercase flex items-center gap-1.5 rounded-full border border-brand-gold/20 z-10">
          <RotateCcw size={10} /> 360° Unavailable
        </div>
        <svg className="w-16 h-16 text-brand-gold/60" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
          <polygon points="12,2 22,8.5 12,22 2,8.5" />
        </svg>
        <p className="text-[10px] text-brand-grey uppercase tracking-widest mt-4 font-medium text-center">
          No 360° frame set uploaded for this product yet
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute bottom-4 right-4 bg-white hover:bg-neutral-50 text-brand-text text-xs px-3 py-1.5 rounded-full shadow border border-neutral-200 font-medium flex items-center gap-1 z-10"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <ThreeSixtyErrorBoundary
      fallback={<Product360Fallback images={spinImages.length ? spinImages : buildFrameUrls(path, count, ext)} productName={product?.name} onClose={onClose} />}
    >
      <div className="relative w-full h-full bg-neutral-50 overflow-hidden rounded-sm bb-360-host">
        <style>{`
          .bb-360-host, .bb-360-host > div, .bb-360-host .v360-viewer-container, .bb-360-host .v360-viewport {
            width: 100%;
            height: 100%;
          }
          .bb-360-host .v360-image-container { cursor: grab; }
          .bb-360-host #v360-menu-btns { position: absolute; bottom: 0; left: 0; border-radius: 0 0 4px 4px; }
        `}</style>
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-brand-text text-[10px] font-bold px-2.5 py-1 tracking-wider uppercase flex items-center gap-1.5 rounded-full border border-neutral-200 z-20 shadow-sm">
          <RotateCcw size={11} /> 360° View
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
        <ThreeSixty
          amount={count}
          imagePath={path}
          fileName={`frame_{index}.${ext}`}
          autoplay={24}
          loop={1}
          boxShadow
          buttonClass="dark"
          paddingIndex={false}
        />
      </div>
    </ThreeSixtyErrorBoundary>
  );
};

// Only used if the package fails after frames were confirmed materialized —
// rebuilds the plain URL list the fallback viewer expects.
const buildFrameUrls = (path, count, ext) =>
  Array.from({ length: count }, (_, i) => `${path}frame_${i + 1}.${ext}`);

export default Product360Viewer;