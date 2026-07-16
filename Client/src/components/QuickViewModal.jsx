import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { X, Star, Heart, ShoppingBag, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { closeQuickView } from '../redux/slices/uiSlice';
import { addLocal, openCart } from '../redux/slices/cartSlice';
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

  const handleAddToCart = () => {
    dispatch(addLocal({ productId: product.id, name: product.name, image: product.images?.[0], priceAtAdd: product.price, quantity: 1 }));
    dispatch(closeQuickView());
    dispatch(openCart());
  };

  const handleBuyNow = () => {
    dispatch(addLocal({ productId: product.id, name: product.name, image: product.images?.[0], priceAtAdd: product.price, quantity: 1 }));
    dispatch(closeQuickView());
    navigate('/checkout');
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
              className="glass-modal rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-label={`Quick view: ${product.name}`}
              aria-modal="true"
            >
              {/* Image */}
              <div className="md:w-1/2 relative bg-brand-light overflow-hidden" style={{ minHeight: 300 }}>
                <img
                  src={product.images?.[0] || 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  style={{ minHeight: 300 }}
                />
                {discount && (
                  <span className="absolute top-4 left-4 bg-brand-gold text-white text-xs font-bold px-3 py-1 rounded-full">
                    {discount}% OFF
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="md:w-1/2 flex flex-col p-6 md:p-8 overflow-y-auto">
                <button
                  onClick={() => dispatch(closeQuickView())}
                  className="self-end p-2 -mr-2 -mt-2 hover:text-brand-gold transition-colors rounded-full focus-visible:outline-brand-gold"
                  aria-label="Close quick view"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>

                {product.category && (
                  <p className="text-xs text-brand-gold font-medium tracking-widest uppercase mb-2">
                    {product.category?.name || 'Collection'}
                  </p>
                )}
                <h3 className="font-playfair text-2xl font-semibold text-brand-text leading-tight mb-3">
                  {product.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={14} className={s <= Math.round(product.rating) ? 'fill-brand-gold text-brand-gold' : 'text-brand-light'} />
                    ))}
                  </div>
                  <span className="text-xs text-brand-grey">({product.reviewCount} reviews)</span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="font-playfair text-3xl font-bold text-brand-text">{fmt(product.price)}</span>
                  {product.comparePrice && (
                    <span className="text-brand-grey text-lg line-through">{fmt(product.comparePrice)}</span>
                  )}
                </div>

                <p className="text-sm text-brand-grey leading-relaxed mb-6 line-clamp-4">
                  {product.shortDescription || product.description}
                </p>

                {/* Actions */}
                <div className="flex flex-col gap-2 mt-auto">
                  {inStock ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddToCart}
                        className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-xs py-3"
                        id={`quickview-add-cart-${product.id}`}
                      >
                        <ShoppingBag size={14} />
                        Add to Cart
                      </button>
                      <button
                        onClick={handleBuyNow}
                        className="bg-neutral-950 hover:bg-neutral-900 text-white text-xs font-semibold tracking-wider uppercase py-3 flex-1 flex items-center justify-center gap-1.5 transition-colors border border-transparent rounded-sm"
                        id={`quickview-buy-now-${product.id}`}
                      >
                        Buy Now
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleNotifyMe}
                      className="bg-neutral-950 hover:bg-neutral-900 text-white text-xs font-semibold tracking-wider uppercase py-3 w-full flex items-center justify-center gap-1.5 transition-colors border border-transparent rounded-sm"
                      id={`quickview-notify-${product.id}`}
                    >
                      Notify Me
                    </button>
                  )}
                  <Link
                    to={`/products/${product.slug}`}
                    onClick={() => dispatch(closeQuickView())}
                    className="btn-outline w-full flex items-center justify-center gap-1.5 text-xs py-3 mt-1"
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
