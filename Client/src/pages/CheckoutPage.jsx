import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, MapPin, CreditCard, Package, ChevronRight } from 'lucide-react';
import { placeOrder } from '../redux/slices/ordersSlice';
import { clearLocal } from '../redux/slices/cartSlice';
import Footer from '../components/Footer';
import { formatPrice } from '../utils/currency';

const STEPS = [
  { id: 1, label: 'Delivery', icon: MapPin },
  { id: 2, label: 'Payment', icon: CreditCard },
  { id: 3, label: 'Review', icon: Package },
];

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, subtotal } = useSelector(s => s.cart);
  const { isAuthenticated, customer } = useSelector(s => s.auth);
  const { code: currencyCode, rate: currencyRate } = useSelector(s => s.currency);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [placing, setPlacing] = useState(false);

  const fmt = (v) => formatPrice(v, currencyCode, currencyRate);

  const [address, setAddress] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    line1: '', city: '', state: '', pincode: '', country: 'India',
  });
  const [paymentMethod, setPaymentMethod] = useState('Razorpay UPI');

  const shipping = subtotal >= 1499 ? 0 : 99;
  const tax = subtotal * 0.05;
  const total = subtotal + shipping + tax;

  const sendOtp = () => {
    // Mock OTP — TwilioService mock prints to server console
    setOtpSent(true);
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const referralCode = localStorage.getItem('bb_referral') || undefined;
      await dispatch(placeOrder({
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity, selectedVariant: i.selectedVariant })),
        shippingAddress: address, paymentMethod, referralCode,
      })).unwrap();
      localStorage.removeItem('bb_referral');
      dispatch(clearLocal());
      navigate('/order-confirmation');
    } catch (err) {
      console.error('Order failed:', err);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <main id="main-content">
      <div className="max-w-4xl mx-auto px-6 md:px-8 py-12">
        <h1 className="font-playfair text-3xl font-bold mb-8 text-center">Checkout</h1>

        {/* Glass surface 6: Checkout step-indicator pill */}
        <div className="glass-step-pill flex items-center justify-center gap-0 mb-10 p-2 rounded-full max-w-md mx-auto" aria-label="Checkout progress">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => step > s.id && setStep(s.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${step === s.id ? 'bg-brand-gold text-white' : step > s.id ? 'text-brand-gold cursor-pointer hover:bg-brand-light' : 'text-brand-grey cursor-default'}`}
                aria-current={step === s.id ? 'step' : undefined}
                id={`step-${s.id}`}
              >
                {step > s.id ? <Check size={14} /> : <s.icon size={14} />}
                {s.label}
              </button>
              {i < STEPS.length - 1 && <ChevronRight size={14} className="text-brand-grey mx-1" />}
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Form area */}
          <div className="md:col-span-2">
            <AnimatePresence mode="wait">
              {/* Step 1: Delivery */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white shadow-sm p-6"
                >
                  <h2 className="font-playfair text-xl font-semibold mb-5">Delivery Address</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { field: 'name', label: 'Full Name', required: true },
                      { field: 'phone', label: 'Phone Number', required: true },
                      { field: 'line1', label: 'Address Line 1', required: true, full: true },
                      { field: 'city', label: 'City', required: true },
                      { field: 'state', label: 'State', required: true },
                      { field: 'pincode', label: 'Pincode', required: true },
                    ].map(({ field, label, required, full }) => (
                      <div key={field} className={full ? 'sm:col-span-2' : ''}>
                        <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor={`checkout-${field}`}>
                          {label} {required && <span className="text-red-400">*</span>}
                        </label>
                        <input
                          id={`checkout-${field}`}
                          type="text"
                          value={address[field]}
                          onChange={e => setAddress(prev => ({ ...prev, [field]: e.target.value }))}
                          className="w-full border border-brand-light px-3 py-2.5 text-sm focus:outline-none focus:border-brand-gold"
                          placeholder={label}
                          required={required}
                          aria-required={required}
                        />
                      </div>
                    ))}
                  </div>

                  {/* OTP verification */}
                  <div className="mt-6 p-4 bg-brand-light">
                    <p className="text-sm font-medium mb-3">Verify your phone number</p>
                    {!otpSent ? (
                      <button onClick={sendOtp} className="btn-outline text-sm" id="send-otp-btn">
                        Send OTP to {address.phone || 'your phone'}
                      </button>
                    ) : (
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={otp}
                          onChange={e => setOtp(e.target.value)}
                          placeholder="Enter 6-digit OTP"
                          maxLength={6}
                          className="w-40 border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
                          id="otp-input"
                          aria-label="OTP"
                        />
                        <button className="btn-primary text-sm" id="verify-otp-btn">Verify</button>
                        <p className="text-xs text-brand-grey self-center">(Mock: any 6 digits works)</p>
                      </div>
                    )}
                  </div>

                  <button onClick={() => setStep(2)} className="btn-primary mt-6 w-full" id="step1-next">
                    Continue to Payment
                  </button>
                </motion.div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white shadow-sm p-6"
                >
                  <h2 className="font-playfair text-xl font-semibold mb-5">Payment Method</h2>
                  <div className="space-y-3">
                    {['Razorpay UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash on Delivery'].map(method => (
                      <label key={method} className="flex items-center gap-3 p-3 border border-brand-light cursor-pointer hover:border-brand-gold transition-colors" id={`pay-${method.replace(/\s/g,'-')}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method}
                          checked={paymentMethod === method}
                          onChange={() => setPaymentMethod(method)}
                          className="accent-brand-gold"
                        />
                        <span className="font-medium text-sm">{method}</span>
                        {method.includes('Razorpay') && <span className="ml-auto text-xs bg-brand-light px-2 py-0.5 text-brand-grey">Recommended</span>}
                      </label>
                    ))}
                  </div>

                  {(paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card') && (
                    <div className="mt-4 p-4 bg-brand-light space-y-3">
                      <input className="w-full border border-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" placeholder="Card Number" id="card-number" aria-label="Card number" />
                      <div className="grid grid-cols-2 gap-3">
                        <input className="border border-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" placeholder="MM/YY" id="card-expiry" aria-label="Expiry" />
                        <input className="border border-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" placeholder="CVV" id="card-cvv" aria-label="CVV" />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setStep(1)} className="btn-outline flex-1" id="step2-back">Back</button>
                    <button onClick={() => setStep(3)} className="btn-primary flex-1" id="step2-next">Review Order</button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white shadow-sm p-6 space-y-6"
                >
                  <h2 className="font-playfair text-xl font-semibold">Review Your Order</h2>
                  <div>
                    <h3 className="font-medium text-sm mb-2">Delivery to</h3>
                    <p className="text-sm text-brand-grey">{address.name} · {address.phone}</p>
                    <p className="text-sm text-brand-grey">{address.line1}, {address.city}, {address.state} {address.pincode}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm mb-2">Payment via</h3>
                    <p className="text-sm text-brand-grey">{paymentMethod}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm mb-3">Items ({items.length})</h3>
                    <div className="space-y-3">
                      {items.map(item => (
                        <div key={item.productId} className="flex gap-3">
                          <img src={item.image || 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=100'} alt={item.name} className="w-14 h-16 object-cover flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-brand-grey">Qty: {item.quantity}</p>
                            <p className="text-sm text-brand-gold font-semibold">{fmt(item.priceAtAdd * item.quantity)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setStep(2)} className="btn-outline flex-1" id="step3-back">Back</button>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={placing}
                      className="btn-primary flex-1"
                      id="place-order-btn"
                    >
                      {placing ? 'Placing Order...' : `Place Order — ${fmt(total)}`}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order summary sidebar */}
          <div className="bg-white shadow-sm p-6 self-start sticky top-24">
            <h2 className="font-playfair text-lg font-semibold mb-4">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-brand-grey">Subtotal ({items.length} items)</span><span>{fmt(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-brand-grey">Shipping</span><span>{shipping === 0 ? <span className="text-green-600">Free</span> : fmt(shipping)}</span></div>
              <div className="flex justify-between"><span className="text-brand-grey">GST (5%)</span><span>{fmt(tax)}</span></div>
              <div className="border-t border-brand-light pt-3 flex justify-between font-bold">
                <span>Total</span><span className="text-brand-gold text-lg">{fmt(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default CheckoutPage;
