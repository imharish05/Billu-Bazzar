import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { closeCart, removeLocal, addLocal } from '../redux/slices/cartSlice';
import { formatPrice } from '../utils/currency';

const FREE_SHIPPING_THRESHOLD = 1499;

/* Glass surface 3: Cart drawer — rgba(255,255,255,0.60) + blur(16px) + gold-tinted border */
const CartDrawer = () => {
  const dispatch = useDispatch();
  const { isOpen, items, subtotal } = useSelector(s => s.cart);
  const { code: currencyCode, rate: currencyRate } = useSelector(s => s.currency);

  const progressPct = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  const fmt = (v) => formatPrice(v, currencyCode, currencyRate);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — Framer Motion fade */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => dispatch(closeCart())}
            aria-hidden="true"
          />

          {/* Glass surface 3: Cart drawer — slide in from right */}
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="glass-cart fixed right-0 top-0 bottom-0 w-full max-w-[420px] z-50 flex flex-col"
            role="dialog" aria-label="Shopping cart" aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-brand-light">
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} className="text-brand-gold" strokeWidth={1.5} />
                <h2 className="font-playfair text-xl font-semibold">Your Cart</h2>
                <span className="ml-1 text-sm text-brand-grey">({items.length} {items.length === 1 ? 'item' : 'items'})</span>
              </div>
              <button
                onClick={() => dispatch(closeCart())}
                className="p-2 hover:text-brand-gold transition-colors rounded-full focus-visible:outline-2 focus-visible:outline-brand-gold"
                aria-label="Close cart"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>



            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
                  <ShoppingBag size={48} className="text-brand-light" strokeWidth={1} />
                  <p className="font-playfair text-xl text-brand-grey">Your cart is empty</p>
                  <p className="text-sm text-brand-grey">Discover our curated collections</p>
                  <Link to="/products" onClick={() => dispatch(closeCart())} className="btn-primary mt-2">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <motion.div
                      key={item.productId || item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 100, scale: 0.9 }} /* shrink-fade exit */
                      transition={{ duration: 0.25 }}
                      className="flex gap-4 py-3 border-b border-brand-light/60 last:border-0"
                    >
                      {/* Product image */}
                      <div className="w-20 h-24 flex-shrink-0 bg-brand-light overflow-hidden">
                        <img
                          src={item.product?.images?.[0] || item.image || 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=160'}
                          alt={item.product?.name || item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-tight line-clamp-2">
                          {item.product?.name || item.name}
                        </p>
                        {item.selectedVariant && Object.keys(item.selectedVariant).length > 0 && (
                          <p className="text-xs text-brand-grey mt-1">
                            {Object.entries(item.selectedVariant).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                          </p>
                        )}
                        <p className="text-brand-gold font-semibold text-sm mt-1">
                          {fmt(item.priceAtAdd || item.product?.price)}
                        </p>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => dispatch(removeLocal(item.productId))}
                            className="w-7 h-7 border border-brand-light flex items-center justify-center hover:border-brand-gold hover:text-brand-gold transition-colors focus-visible:outline-brand-gold"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => dispatch(addLocal({ ...item, quantity: 1 }))}
                            className="w-7 h-7 border border-brand-light flex items-center justify-center hover:border-brand-gold hover:text-brand-gold transition-colors focus-visible:outline-brand-gold"
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            onClick={() => dispatch(removeLocal(item.productId))}
                            className="ml-auto text-brand-grey hover:text-red-400 transition-colors p-1 focus-visible:outline-brand-gold"
                            aria-label="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-brand-light bg-white/60">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-brand-grey text-sm">Subtotal</span>
                  <span className="font-semibold text-brand-text">{fmt(subtotal)}</span>
                </div>
                <p className="text-xs text-brand-grey mb-4">Shipping & taxes calculated at checkout</p>
                <Link
                  to="/checkout"
                  onClick={() => dispatch(closeCart())}
                  className="btn-primary w-full text-center block mb-3"
                  id="cart-checkout-btn"
                >
                  Proceed to Checkout
                </Link>
                <Link
                  to="/cart"
                  onClick={() => dispatch(closeCart())}
                  className="btn-outline w-full text-center block"
                  id="cart-view-btn"
                >
                  View Cart
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
