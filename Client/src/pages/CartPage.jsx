import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingBag, ChevronRight, Tag } from 'lucide-react';
import { removeLocal, addLocal, clearLocal, openCart } from '../redux/slices/cartSlice';
import Footer from '../components/Footer';
import { formatPrice } from '../utils/currency';

const FREE_SHIP = 1499;

const CartPage = () => {
  const dispatch = useDispatch();
  const { items, subtotal } = useSelector(s => s.cart);
  const { code: currencyCode, rate: currencyRate } = useSelector(s => s.currency);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);

  const fmt = (v) => formatPrice(v, currencyCode, currencyRate);

  const shipping = subtotal >= FREE_SHIP ? 0 : 99;
  const discount = couponApplied ? subtotal * 0.2 : 0;
  const total = subtotal - discount + shipping;
  const progressPct = Math.min((subtotal / FREE_SHIP) * 100, 100);

  useEffect(() => { document.title = 'Your Cart — Billu Bazaar'; }, []);

  const applyCoupon = () => {
    if (couponCode.trim().toLowerCase() === 'welcome20') {
      setCouponApplied('WELCOME20');
    }
  };

  if (items.length === 0) {
    return (
      <main id="main-content">
        <div className="max-w-site mx-auto px-6 md:px-8 py-24 flex flex-col items-center text-center">
          <ShoppingBag size={64} className="text-brand-light mb-6" strokeWidth={1} />
          <h1 className="font-playfair text-3xl font-bold mb-3">Your Cart is Empty</h1>
          <p className="text-brand-grey mb-8">Looks like you haven't added anything yet. Explore our curated collections.</p>
          <Link to="/products" className="btn-primary" id="empty-cart-shop">Start Shopping</Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main id="main-content">
      <div className="max-w-site mx-auto px-6 md:px-8 py-12">
        <h1 className="font-playfair text-h2 font-bold mb-2">Shopping Cart</h1>
        <p className="text-brand-grey mb-8">{items.length} {items.length === 1 ? 'item' : 'items'}</p>

        {/* Free shipping progress */}
        <div className="bg-brand-light p-4 mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-brand-grey">
              {subtotal >= FREE_SHIP ? '🎉 You qualify for free shipping!' : `Add ${fmt(FREE_SHIP - subtotal)} more for free shipping`}
            </span>
            <span className="text-brand-gold font-medium">{Math.round(progressPct)}%</span>
          </div>
          <div className="h-2 bg-white rounded-full overflow-hidden" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
            <motion.div className="h-full bg-brand-gold rounded-full" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.6 }} />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map(item => (
                <motion.div
                  key={item.productId}
                  layout
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: 100, height: 0 }} /* shrink-fade exit */
                  transition={{ duration: 0.3 }}
                  className="bg-white shadow-sm flex gap-4 p-4"
                >
                  <img
                    src={item.image || item.product?.images?.[0] || 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200'}
                    alt={item.name}
                    className="w-24 h-28 object-cover flex-shrink-0"
                  />
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="font-medium text-brand-text">{item.name}</p>
                        {item.selectedVariant && Object.keys(item.selectedVariant).length > 0 && (
                          <p className="text-xs text-brand-grey mt-1">{Object.entries(item.selectedVariant).map(([k,v]) => `${k}: ${v}`).join(' · ')}</p>
                        )}
                      </div>
                      <button
                        onClick={() => dispatch(removeLocal(item.productId))}
                        className="text-brand-grey hover:text-red-400 transition-colors p-1 focus-visible:outline-brand-gold flex-shrink-0"
                        aria-label={`Remove ${item.name} from cart`}
                        id={`remove-${item.productId}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center border border-brand-light">
                        <button
                          onClick={() => item.quantity <= 1 ? dispatch(removeLocal(item.productId)) : dispatch(addLocal({ ...item, quantity: -1 }))}
                          className="w-9 h-9 flex items-center justify-center hover:bg-brand-light transition-colors focus-visible:outline-brand-gold"
                          aria-label="Decrease"
                        >−</button>
                        <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => dispatch(addLocal({ ...item, quantity: 1 }))}
                          className="w-9 h-9 flex items-center justify-center hover:bg-brand-light transition-colors focus-visible:outline-brand-gold"
                          aria-label="Increase"
                        >+</button>
                      </div>
                      <p className="font-semibold text-brand-text">{fmt(item.priceAtAdd * item.quantity)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <button
              onClick={() => dispatch(clearLocal())}
              className="text-sm text-brand-grey hover:text-red-400 transition-colors flex items-center gap-2 focus-visible:outline-brand-gold"
              id="clear-cart-btn"
            >
              <Trash2 size={14} /> Clear Cart
            </button>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <div className="bg-white shadow-sm p-6">
              <h2 className="font-playfair text-xl font-semibold mb-5">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-brand-grey">Subtotal</span><span>{fmt(subtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between text-green-600"><span>Coupon Discount</span><span>−{fmt(discount)}</span></div>}
                <div className="flex justify-between"><span className="text-brand-grey">Shipping</span><span>{shipping === 0 ? <span className="text-green-600">Free</span> : fmt(shipping)}</span></div>
                <div className="border-t border-brand-light pt-3 flex justify-between font-semibold text-base">
                  <span>Total</span><span className="text-brand-gold">{fmt(total)}</span>
                </div>
              </div>

              <Link to="/checkout" className="btn-primary w-full text-center block mt-6" id="cart-checkout">
                Proceed to Checkout
              </Link>
              <Link to="/products" className="btn-outline w-full text-center block mt-3" id="cart-continue">
                Continue Shopping
              </Link>
            </div>

            {/* Coupon */}
            <div className="bg-white shadow-sm p-6">
              <h3 className="font-medium text-sm flex items-center gap-2 mb-4"><Tag size={16} className="text-brand-gold" /> Apply Coupon</h3>
              <div className="flex gap-0">
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1 border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
                  aria-label="Coupon code"
                  id="coupon-input"
                />
                <button onClick={applyCoupon} className="bg-brand-text text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors focus-visible:outline-brand-gold" id="apply-coupon">
                  Apply
                </button>
              </div>
              {couponApplied && <p className="text-green-600 text-xs mt-2">✓ Coupon {couponApplied} applied — 20% off!</p>}
              <div className="mt-3 space-y-1">
                {['WELCOME20', 'LUXE15', 'BILLU10'].map(c => (
                  <button key={c} onClick={() => setCouponCode(c)} className="text-xs text-brand-gold hover:underline mr-3 focus-visible:outline-brand-gold">{c}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default CartPage;
