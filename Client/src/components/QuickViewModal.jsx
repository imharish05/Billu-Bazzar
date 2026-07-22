import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { X, Star, Heart, ShoppingBag, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { closeQuickView } from '../redux/slices/uiSlice';
import { addLocal, openCart, setBuyNowItem } from '../redux/slices/cartSlice';
import { formatPrice } from '../utils/currency';

/* Glass surface 2: Quick-view modal — rgba(255,255,255,0.60) + blur(16px) + gold-tinted border glow */
const QuickViewModal = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isQuickViewOpen, quickViewProduct: product } = useSelector(s => s.ui);
  const { code: currencyCode, rate: currencyRate } = useSelector(s => s.currency);
  const { customer } = useSelector(s => s.auth);

  if (!product) return null;

  const fmt = (v) => formatPrice(v, currencyCode, currencyRate);

  const inStock = product.inStock !== false;

  const defaultVariant = (product.variants && product.variants.length > 0) ? product.variants[0] : null;

  const displayPrice = defaultVariant && defaultVariant.price !== null
    ? parseFloat(defaultVariant.price)
    : parseFloat(product.price);

  const displayComparePrice = defaultVariant && defaultVariant.mrp !== null
    ? parseFloat(defaultVariant.mrp)
    : (product.comparePrice ? parseFloat(product.comparePrice) : null);

  const resolvedVariantAttr = defaultVariant
    ? (typeof defaultVariant.attributes === 'string' ? JSON.parse(defaultVariant.attributes || '{}') : (defaultVariant.attributes || {}))
    : {};

  const handleAddToCart = () => {
    const cartItem = {
      productId: product.id,
      name: product.name,
      image: (defaultVariant && defaultVariant.image) || product.images?.[0] || '',
      priceAtAdd: displayPrice,
      quantity: 1,
      variantId: defaultVariant ? defaultVariant.id : null,
      selectedVariant: resolvedVariantAttr
    };
    dispatch(addLocal(cartItem));
    dispatch(closeQuickView());
    dispatch(openCart());
  };

  const handleBuyNow = () => {
    const cartItem = {
      productId: product.id,
      name: product.name,
      image: (defaultVariant && defaultVariant.image) || product.images?.[0] || '',
      priceAtAdd: displayPrice,
      quantity: 1,
      variantId: defaultVariant ? defaultVariant.id : null,
      selectedVariant: resolvedVariantAttr
    };
    dispatch(setBuyNowItem(cartItem));
    dispatch(closeQuickView());
    navigate('/checkout?mode=buynow');
  };

  const handleNotifyMe = () => {
    toast.success(`We will notify you at ${customer?.email || 'your email'} once ${product.name} is back in stock!`, {
      iconTheme: { primary: '#C58837', secondary: 'white' },
      style: {
        border: '1px solid #C58837',
        color: '#111111',
        fontFamily: 'Montserrat, sans-serif'
      }
    });
    dispatch(closeQuickView());
  };

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null;

  return (
    <AnimatePresence>
      {isQuickViewOpen && (
        <>
          {/* Backdrop — Framer Motion modal open/close */}
          <motion.div
            key="qv-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => dispatch(closeQuickView())}
            role="presentation"
          >
            {/* Glass surface 2: Quick-view modal */}
            <motion.div
              key="qv-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="glass-modal rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative"
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-label={`Quick view: ${product.name}`}
              aria-modal="true"
            >
              {/* Absolute Close Button at Top-Right of Modal */}
              <button
                onClick={() => dispatch(closeQuickView())}
                className="absolute top-4 right-4 z-50 p-2 bg-black/40 hover:bg-black/60 text-white hover:text-brand-gold transition-colors rounded-full focus-visible:outline-brand-gold shadow-sm"
                aria-label="Close quick view"
              >
                <X size={16} strokeWidth={2} />
              </button>

              {/* Image */}
              <div className="w-full md:w-1/2 h-48 sm:h-64 md:h-auto flex-shrink-0 relative bg-brand-light overflow-hidden">
                <img
                  src={product.images?.[0] || 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {discount && (
                  <span className="absolute top-4 left-4 bg-brand-gold text-white text-xs font-bold px-3 py-1 rounded-full">
                    {discount}% OFF
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-h-0 flex flex-col p-5 md:p-8 overflow-y-auto">
                {product.category && (
                  <p className="text-xs text-brand-gold font-medium tracking-widest uppercase mb-1.5 md:mb-2">
                    {product.category?.name || 'Collection'}
                  </p>
                )}
                <h3 className="font-playfair text-xl md:text-2xl font-semibold text-brand-text leading-tight mb-2 md:mb-3">
                  {product.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={14} className={s <= Math.round(product.rating) ? 'fill-brand-gold text-brand-gold' : 'text-brand-light'} />
                    ))}
                  </div>
                  <span className="text-xs text-brand-grey">({product.reviewCount} reviews)</span>
                </div>

                {/* Price */}
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3 md:mb-4">
                  <span className="font-playfair text-xl sm:text-2xl md:text-3xl font-bold text-brand-text whitespace-nowrap">{fmt(product.price)}</span>
                  {product.comparePrice && (
                    <span className="text-brand-grey text-sm md:text-base line-through whitespace-nowrap">{fmt(product.comparePrice)}</span>
                  )}
                  {discount > 0 && (
                    <span className="text-brand-gold font-semibold text-[10px] md:text-xs bg-brand-gold/10 px-2 py-0.5 rounded-sm whitespace-nowrap">Save {discount}%</span>
                  )}
                </div>

                <p className="text-sm text-brand-grey leading-relaxed mb-5 md:mb-6 line-clamp-2 md:line-clamp-4">
                  {product.shortDescription || product.description}
                </p>

                {/* Actions */}
                <div className="flex flex-col gap-2.5 mt-auto">
                  {inStock ? (
                    <div className="flex gap-3">
                      <button
                        onClick={handleAddToCart}
                        className="bg-brand-gold hover:bg-[#a8712a] text-white text-xs font-semibold tracking-widest uppercase py-3 flex-1 flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm"
                        id={`quickview-add-cart-${product.id}`}
                      >
                        <ShoppingBag size={14} />
                        Add to Cart
                      </button>
                      <button
                        onClick={handleBuyNow}
                        className="bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold tracking-widest uppercase py-3 flex-1 flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm"
                        id={`quickview-buy-now-${product.id}`}
                      >
                        Buy Now
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleNotifyMe}
                      className="bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold tracking-widest uppercase py-3 w-full flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm"
                      id={`quickview-notify-${product.id}`}
                    >
                      Notify Me
                    </button>
                  )}
                  <Link
                    to={`/products/${product.slug}`}
                    onClick={() => dispatch(closeQuickView())}
                    className="border border-neutral-950 hover:bg-neutral-950 hover:text-white text-neutral-950 text-xs font-semibold tracking-widest uppercase py-3 w-full flex items-center justify-center gap-1.5 transition-all duration-200 mt-1"
                    id={`quickview-view-full-${product.id}`}
                  >
                    <Eye size={14} />
                    View Full Details
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QuickViewModal;
