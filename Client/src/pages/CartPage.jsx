import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingBag, ChevronRight, Tag } from 'lucide-react';
import { removeLocal, addLocal, clearLocal, openCart } from '../redux/slices/cartSlice';
import Footer from '../components/Footer';
import { formatPrice } from '../utils/currency';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const FREE_SHIP = 1499;

const CartPage = () => {
  const dispatch = useDispatch();
  const { items, subtotal } = useSelector(s => s.cart);
  const { code: currencyCode, rate: currencyRate } = useSelector(s => s.currency);
  const { isAuthenticated, customer } = useSelector(s => s.auth || {});

  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [giftService, setGiftService] = useState(null);

  const fmt = (v) => formatPrice(v, currencyCode, currencyRate);

  const getCouponDiscount = (coupon, totalVal) => {
    if (!coupon) return 0;
    if (totalVal < Number(coupon.minOrderValue || 0)) return 0;
    
    // Check usage limits and dates on frontend
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return 0;
    const now = new Date();
    if (coupon.validFrom && new Date(coupon.validFrom) > now) return 0;
    if (coupon.validUntil && new Date(coupon.validUntil) < now) return 0;

    const value = Number(coupon.value || 0);
    if (coupon.type === 'PERCENT') {
      const maxD = Number(coupon.maxDiscount || Infinity);
      return Math.min((totalVal * value) / 100, maxD);
    }
    if (coupon.type === 'FLAT') {
      return Math.min(value, totalVal);
    }
    return 0;
  };

  const isGiftServiceActive = giftService ? giftService.isActive !== false : true;
  const giftWrapAmount = giftService ? Number(giftService.amount || 0) : 99;
  const giftWrapVal = (giftWrap && isGiftServiceActive) ? giftWrapAmount : 0;

  const shipping = subtotal >= FREE_SHIP ? 0 : 99;
  const couponDiscountVal = couponApplied ? getCouponDiscount(couponApplied, subtotal) : 0;
  const loyaltyDiscountVal = redeemPoints && customer ? Math.min(Number(customer.loyaltyPoints) * 0.1, subtotal * 0.2) : 0;
  
  const total = subtotal - couponDiscountVal - loyaltyDiscountVal + giftWrapVal + shipping;

  useEffect(() => { 
    document.title = 'Your Cart — Billu Bazaar'; 
  }, []);

  // Fetch gift service config
  useEffect(() => {
    api.get('/gift-service')
      .then(res => {
        if (res.data?.success) {
          setGiftService(res.data.giftService);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch active coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await api.get('/coupons');
        if (res.data?.success) {
          const active = (res.data.coupons || []).filter(c => c.isActive);
          setAvailableCoupons(active);
        }
      } catch (err) {
        console.error('Failed to load coupons:', err);
      }
    };
    fetchCoupons();
  }, []);

  // Auto-apply best available coupon when subtotal or available coupons change
  useEffect(() => {
    if (availableCoupons.length === 0 || subtotal <= 0) return;

    let bestCoupon = null;
    let maxDiscountVal = 0;

    availableCoupons.forEach(coupon => {
      const disc = getCouponDiscount(coupon, subtotal);
      if (disc > maxDiscountVal) {
        maxDiscountVal = disc;
        bestCoupon = coupon;
      }
    });

    if (bestCoupon) {
      setCouponApplied(bestCoupon);
      setCouponCode(bestCoupon.code);
      localStorage.setItem('bb_applied_coupon', JSON.stringify(bestCoupon));
    } else {
      const saved = localStorage.getItem('bb_applied_coupon');
      if (saved) {
        try { setCouponApplied(JSON.parse(saved)); } catch {}
      }
    }
  }, [availableCoupons, subtotal]);

  useEffect(() => {
    if (items && items.length > 0) {
      const missingDetails = items.some(i => !i.name && !i.product?.name);
      if (missingDetails) {
        dispatch(syncCart(items));
      }
    }
  }, [items, dispatch]);

  const applyCoupon = async (codeToApply = couponCode) => {

    const code = codeToApply.trim().toUpperCase();
    if (!code) return;
    
    try {
      const matched = availableCoupons.find(c => c.code === code);
      if (matched) {
        const disc = getCouponDiscount(matched, subtotal);
        if (disc > 0) {
          setCouponApplied(matched);
          setCouponCode(matched.code);
          localStorage.setItem('bb_applied_coupon', JSON.stringify(matched));
          toast.success(`Coupon ${matched.code} applied successfully!`);
        } else {
          if (subtotal < Number(matched.minOrderValue || 0)) {
            toast.error(`Minimum order value of ₹${matched.minOrderValue} required for this coupon.`);
          } else {
            toast.error(`This coupon is not applicable.`);
          }
        }
      } else {
        const res = await api.post('/coupons/validate', { code, subtotal });
        if (res.data?.success && res.data?.valid) {
          setCouponApplied(res.data.coupon);
          setCouponCode(res.data.coupon.code);
          localStorage.setItem('bb_applied_coupon', JSON.stringify(res.data.coupon));
          toast.success(`Coupon ${res.data.coupon.code} applied successfully!`);
        } else {
          toast.error(res.data?.message || 'Invalid coupon code');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
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



        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item, idx) => {
                const rawName = item.product?.name || item.productName || item.name;
                const name = (rawName && String(rawName).trim()) ? String(rawName).trim() : `Product #${item.productId || item.id || idx + 1}`;

                let img = item.image || item.productImage || item.product?.image || (item.product?.images && item.product.images[0]);
                if (!img || img === 'undefined') {
                  img = 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200';
                } else if (typeof img === 'string' && img.startsWith('/') && !img.startsWith('//')) {
                  img = `http://localhost:5000${img}`;
                }

                let variantText = null;
                const rawVar = item.selectedVariant || item.variant?.attributes || item.variant;
                if (rawVar) {
                  let parsed = rawVar;
                  if (typeof rawVar === 'string') {
                    try { parsed = JSON.parse(rawVar); } catch {
                      if (rawVar !== '{}' && rawVar !== 'null') variantText = rawVar;
                    }
                  }
                  if (parsed && typeof parsed === 'object') {
                    const entries = Object.entries(parsed).filter(([k, v]) => v !== undefined && v !== null && v !== '' && k !== 'id');
                    if (entries.length > 0) {
                      variantText = entries.map(([k, v]) => `${k}: ${v}`).join(' · ');
                    }
                  }
                }

                return (
                  <motion.div
                    key={`${item.productId || item.id}_${item.variantId || JSON.stringify(item.selectedVariant || {})}_${idx}`}
                    layout
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: 100, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white shadow-sm flex gap-4 p-4 rounded-lg border border-neutral-100"
                  >
                    <img
                      src={img}
                      alt={name}
                      className="w-24 h-28 object-cover flex-shrink-0 rounded border border-neutral-200"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200';
                      }}
                    />
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between gap-2">
                        <div>
                          <p className="font-semibold text-neutral-900">{name}</p>
                          {variantText && (
                            <p className="text-xs text-brand-gold font-medium mt-1">{variantText}</p>
                          )}
                        </div>
                        <button
                          onClick={() => dispatch(removeLocal({ productId: item.productId || item.id, variantId: item.variantId, selectedVariant: item.selectedVariant }))}
                          className="text-brand-grey hover:text-red-400 transition-colors p-1 focus-visible:outline-brand-gold flex-shrink-0"
                          aria-label={`Remove ${name} from cart`}
                          id={`remove-${item.productId || item.id}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-3">
                        <div className="flex items-center border border-brand-light">
                          <button
                            onClick={() => item.quantity <= 1 ? dispatch(removeLocal({ productId: item.productId || item.id, variantId: item.variantId, selectedVariant: item.selectedVariant })) : dispatch(addLocal({ ...item, quantity: -1 }))}
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
                        <p className="font-semibold text-brand-text">{fmt((item.priceAtAdd || item.price || 0) * item.quantity)}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <button
              onClick={() => dispatch(clearLocal())}
              className="text-sm text-brand-grey hover:text-red-400 transition-colors flex items-center gap-2 focus-visible:outline-brand-gold mt-4"
              id="clear-cart-btn"
            >
              <Trash2 size={14} /> Clear Cart
            </button>

            {/* Gift wrapping option block */}
            {isGiftServiceActive && (
              <div className="bg-white border border-brand-light p-6 shadow-sm space-y-4 mt-6">
                <h3 className="font-playfair text-base font-semibold flex items-center gap-2 text-brand-text">
                  🎁 Premium Gift Services
                </h3>
                
                <div className="flex flex-col gap-3">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={giftWrap}
                      onChange={(e) => {
                        setGiftWrap(e.target.checked);
                        if (!e.target.checked) setGiftMessage('');
                      }}
                      className="w-4 h-4 mt-0.5 accent-brand-gold rounded border-brand-light"
                    />
                    <div className="text-xs">
                      <p className="font-medium text-brand-text">
                        {giftService?.label || 'Add Premium Gift Wrapping'} (+{fmt(giftWrapAmount)})
                      </p>
                      <p className="text-brand-grey mt-0.5">
                        {giftService?.description || 'Meticulously wrapped in our signature gold foil box with a silk ribbon casing.'}
                      </p>
                    </div>
                  </label>

                  {giftWrap && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2 pt-2"
                    >
                      <label className="block text-xs font-semibold text-brand-grey" htmlFor="gift-msg">
                        Personalized Message (Complimentary)
                      </label>
                      <textarea
                        id="gift-msg"
                        rows={3}
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder="Write your special message here... (e.g. Happy Anniversary! With love, Priya)"
                        className="w-full border border-brand-light p-3 text-xs focus:outline-none focus:border-brand-gold bg-transparent resize-none rounded-sm placeholder-brand-grey/40"
                        maxLength={200}
                      />
                      <div className="text-right text-[10px] text-brand-grey">
                        {200 - giftMessage.length} characters remaining
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <div className="bg-white shadow-sm p-6 border border-brand-light">
              <h2 className="font-playfair text-xl font-semibold mb-5">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-brand-grey">Subtotal</span><span>{fmt(subtotal)}</span></div>
                {couponDiscountVal > 0 && <div className="flex justify-between text-green-600"><span>Coupon Discount ({couponApplied?.code})</span><span>−{fmt(couponDiscountVal)}</span></div>}
                {loyaltyDiscountVal > 0 && <div className="flex justify-between text-green-600"><span>Loyalty Discount</span><span>−{fmt(loyaltyDiscountVal)}</span></div>}
                {giftWrap && isGiftServiceActive && <div className="flex justify-between text-brand-text"><span>Gift Wrapping</span><span>{fmt(giftWrapAmount)}</span></div>}
                <div className="flex justify-between"><span className="text-brand-grey">Shipping</span><span>{shipping === 0 ? <span className="text-green-600">Free</span> : fmt(shipping)}</span></div>
                <div className="border-t border-brand-light pt-3 flex justify-between font-semibold text-base">
                  <span>Total</span><span className="text-brand-gold">{fmt(total)}</span>
                </div>
              </div>

              <Link to="/checkout" state={{ giftWrap: giftWrap && isGiftServiceActive, giftMessage, giftWrapPrice: giftWrapAmount, redeemPoints }} className="btn-primary w-full text-center block mt-6" id="cart-checkout">
                Proceed to Checkout
              </Link>
              <Link to="/products" className="btn-outline w-full text-center block mt-3" id="cart-continue">
                Continue Shopping
              </Link>
            </div>

            {/* Loyalty points block */}
            {isAuthenticated && customer && (
              <div className="bg-white shadow-sm p-6 border border-brand-light">
                <h3 className="font-playfair text-base font-semibold flex items-center gap-2 mb-3">
                  👑 Loyalty Reward Points
                </h3>
                <div className="text-xs text-brand-grey space-y-2">
                  <p>You have <strong className="text-brand-text font-bold">{customer.loyaltyPoints || 0}</strong> points available.</p>
                  {customer.loyaltyPoints > 0 ? (
                    <div className="pt-2">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={redeemPoints}
                          onChange={(e) => setRedeemPoints(e.target.checked)}
                          className="w-4 h-4 accent-brand-gold rounded border-brand-light"
                        />
                        <span className="text-xs text-brand-text font-medium">
                          Redeem points for discount of <strong>{fmt(Math.min(customer.loyaltyPoints * 0.1, subtotal * 0.2))}</strong>
                        </span>
                      </label>
                      <p className="text-[10px] text-brand-grey/80 mt-1">* 10 points = ₹1. Max redemption caps at 20% of subtotal.</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-brand-grey/80">Shop more to accumulate loyalty points and unlock exclusive rewards!</p>
                  )}
                </div>
              </div>
            )}
            {!isAuthenticated && (
              <div className="bg-white shadow-sm p-6 border border-brand-light text-center rounded-sm">
                <p className="text-xs text-brand-grey">
                  <Link to="/account" className="text-brand-gold font-medium underline hover:text-[#a8712a]">Sign in</Link> to view and redeem your Loyalty Points for extra discounts.
                </p>
              </div>
            )}

            {/* Coupon */}
            <div className="bg-white shadow-sm p-6 border border-brand-light">
              <h3 className="font-playfair text-base font-semibold flex items-center gap-2 mb-4">
                <Tag size={16} className="text-brand-gold" /> Available Coupons
              </h3>
              
              {/* List of Coupons */}
              {availableCoupons.length > 0 ? (
                <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1 mb-4">
                  {availableCoupons.map(coupon => {
                    const discountAmt = getCouponDiscount(coupon, subtotal);
                    const isApplicable = discountAmt > 0;
                    const isSelected = couponApplied?.code === coupon.code;
                    
                    return (
                      <div 
                        key={coupon.id} 
                        onClick={() => isApplicable && applyCoupon(coupon.code)}
                        className={`p-3 border rounded-sm transition-all flex flex-col justify-between relative overflow-hidden ${
                          isSelected 
                            ? 'border-brand-gold bg-brand-light/20 cursor-default' 
                            : isApplicable 
                              ? 'border-brand-light hover:border-brand-gold/50 cursor-pointer bg-white' 
                              : 'border-neutral-100 bg-neutral-50/50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-xs font-bold text-[#0F2942] bg-brand-light px-2.5 py-0.5 rounded-sm">
                            {coupon.code}
                          </span>
                          <span className="text-[10px] text-brand-gold font-semibold uppercase">
                            {coupon.type === 'PERCENT' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                          </span>
                        </div>
                        <p className="text-[10px] text-brand-grey mt-1.5 leading-relaxed">
                          Min Order: ₹{coupon.minOrderValue || 0}
                          {coupon.maxDiscount ? ` · Max Disc: ₹${coupon.maxDiscount}` : ''}
                        </p>
                        {isSelected && (
                          <div className="absolute top-0 right-0 bg-brand-gold text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-sm">
                            Applied
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-brand-grey mb-4">No coupons available at the moment.</p>
              )}

              {/* Coupon input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1 border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold uppercase font-mono"
                  aria-label="Coupon code"
                  id="coupon-input"
                />
                <button onClick={() => applyCoupon()} className="bg-neutral-950 text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800 transition-colors focus-visible:outline-brand-gold" id="apply-coupon">
                  Apply
                </button>
              </div>
              {couponApplied && (
                <div className="mt-3 flex items-center justify-between bg-green-50/70 border border-green-200/60 p-2.5 rounded-sm">
                  <p className="text-green-700 text-xs font-medium">✓ Coupon {couponApplied.code} applied!</p>
                  <button onClick={() => { setCouponApplied(null); setCouponCode(''); localStorage.removeItem('bb_applied_coupon'); }} className="text-green-700 hover:text-red-500 text-xs font-semibold underline">Remove</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default CartPage;
