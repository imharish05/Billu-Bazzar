import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, MapPin, CreditCard, Package, ChevronRight } from 'lucide-react';
import { placeOrder } from '../redux/slices/ordersSlice';
import { clearLocal } from '../redux/slices/cartSlice';
import Footer from '../components/Footer';
import { formatPrice } from '../utils/currency';
import toast from 'react-hot-toast';

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

  const [email, setEmail] = useState(customer?.email || '');
  const [isVerified, setIsVerified] = useState(false);
  const [address, setAddress] = useState({
    firstName: customer?.name ? customer.name.split(' ')[0] : '',
    lastName: customer?.name ? customer.name.split(' ').slice(1).join(' ') : '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    flatHouse: '',
    areaStreet: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });
  const [deliverySameAsBilling, setDeliverySameAsBilling] = useState(true);
  const [billingAddress, setBillingAddress] = useState({
    firstName: customer?.name ? customer.name.split(' ')[0] : '',
    lastName: customer?.name ? customer.name.split(' ').slice(1).join(' ') : '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    flatHouse: '',
    areaStreet: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });
  const [paymentMethod, setPaymentMethod] = useState('Razorpay UPI');

  const handleToggleDeliverySame = (checked) => {
    setDeliverySameAsBilling(checked);
    if (!checked) {
      setAddress({ ...billingAddress });
    }
  };

  const shipping = subtotal >= 1499 ? 0 : 99;
  const tax = subtotal * 0.05;
  const total = subtotal + shipping + tax;

  const sendOtp = () => {
    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setOtpSent(true);
    toast.success(`Verification code sent to ${email}`, {
      iconTheme: { primary: '#C58837', secondary: 'white' },
      style: {
        border: '1px solid #C58837',
        color: '#111111',
        fontFamily: 'Montserrat, sans-serif'
      }
    });
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const referralCode = localStorage.getItem('bb_referral') || undefined;
      await dispatch(placeOrder({
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity, selectedVariant: i.selectedVariant })),
        shippingAddress: deliverySameAsBilling ? billingAddress : address,
        billingAddress: billingAddress,
        paymentMethod, referralCode,
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
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-12">
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

        <div className="grid md:grid-cols-4 gap-8 md:gap-10">
          {/* Form area */}
          <div className="md:col-span-3">
            <AnimatePresence mode="wait">
              {/* Step 1: Delivery */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white shadow-sm p-6"
                >
                  <h2 className="font-playfair text-xl font-semibold mb-5">Billing Address</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { field: 'firstName', label: 'First name', required: true },
                      { field: 'lastName', label: 'Last name', required: true },
                      { field: 'phone', label: 'Phone Number', required: true },
                      { field: 'email', label: 'Email Address', required: true },
                      { field: 'flatHouse', label: 'Flat, House no., Building, Company, Apartment', required: true, full: true },
                      { field: 'areaStreet', label: 'Area, Street, Sector, Village', required: true, full: true },
                      { field: 'landmark', label: 'Landmark', required: false, full: true },
                      { field: 'city', label: 'Town/City', required: true },
                      { field: 'state', label: 'State', required: true },
                      { field: 'pincode', label: 'Pincode', required: true },
                      { field: 'country', label: 'Country', required: true },
                    ].map(({ field, label, required, full }) => (
                      <div key={`billing-${field}`} className={full ? 'sm:col-span-2' : ''}>
                        <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor={`billing-${field}`}>
                          {label} {required && <span className="text-red-400">*</span>}
                        </label>
                        <input
                          id={`billing-${field}`}
                          type={field === 'email' ? 'email' : 'text'}
                          value={billingAddress[field]}
                          onChange={e => {
                            const val = e.target.value;
                            setBillingAddress(prev => ({ ...prev, [field]: val }));
                            if (field === 'email') setEmail(val);
                          }}
                          className="w-full border border-brand-light px-3 py-2.5 text-sm focus:outline-none focus:border-brand-gold"
                          placeholder={label}
                          required={required}
                          aria-required={required}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Delivery address checkbox */}
                  <div className="mt-6 mb-4 flex items-center gap-3">
                    <input
                      id="delivery-same-as-billing"
                      type="checkbox"
                      checked={deliverySameAsBilling}
                      onChange={(e) => handleToggleDeliverySame(e.target.checked)}
                      className="w-4 h-4 accent-brand-gold cursor-pointer"
                    />
                    <label htmlFor="delivery-same-as-billing" className="text-sm font-medium text-brand-text cursor-pointer select-none">
                      Delivery address is same as billing address
                    </label>
                  </div>

                  {/* Delivery Address fields (collapsible via Framer Motion) */}
                  <AnimatePresence initial={false}>
                    {!deliverySameAsBilling && (
                      <motion.div
                        key="delivery-address-section"
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <h2 className="font-playfair text-xl font-semibold mb-5 border-t border-brand-light pt-6">Delivery Address</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {[
                            { field: 'firstName', label: 'First name', required: true },
                            { field: 'lastName', label: 'Last name', required: true },
                            { field: 'phone', label: 'Phone Number', required: true },
                            { field: 'email', label: 'Email Address', required: true },
                            { field: 'flatHouse', label: 'Flat, House no., Building, Company, Apartment', required: true, full: true },
                            { field: 'areaStreet', label: 'Area, Street, Sector, Village', required: true, full: true },
                            { field: 'landmark', label: 'Landmark', required: false, full: true },
                            { field: 'city', label: 'Town/City', required: true },
                            { field: 'state', label: 'State', required: true },
                            { field: 'pincode', label: 'Pincode', required: true },
                            { field: 'country', label: 'Country', required: true },
                          ].map(({ field, label, required, full }) => (
                            <div key={`delivery-${field}`} className={full ? 'sm:col-span-2' : ''}>
                              <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor={`delivery-${field}`}>
                                {label} {required && <span className="text-red-400">*</span>}
                              </label>
                              <input
                                id={`delivery-${field}`}
                                type={field === 'email' ? 'email' : 'text'}
                                value={address[field]}
                                onChange={e => setAddress(prev => ({ ...prev, [field]: e.target.value }))}
                                className="w-full border border-brand-light px-3 py-2.5 text-sm focus:outline-none focus:border-brand-gold"
                                placeholder={label}
                                required={required}
                              />
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Premium Email OTP verification */}
                  <div className="mt-8 p-6 border border-brand-light bg-[#FCFAF7] rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-1.5 h-4 bg-brand-gold rounded-full"></span>
                      <h3 className="font-playfair text-sm font-semibold tracking-wider text-brand-text uppercase">Secure Email Verification</h3>
                    </div>
                    <p className="text-xs text-brand-grey mb-4 leading-relaxed">
                      To safeguard your transaction and authenticate your purchase, please verify your email address.
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-brand-grey uppercase tracking-wider mb-1.5">
                          Verification Email Address <span className="text-red-400">*</span>
                        </label>
                        <div className="flex gap-3 max-w-lg">
                          <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="your.name@example.com"
                            disabled={otpSent}
                            className="flex-1 border border-brand-light px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-gold disabled:bg-neutral-100 disabled:text-neutral-400 font-inter"
                            required
                          />
                          {!otpSent && (
                            <button
                              type="button"
                              onClick={sendOtp}
                              disabled={!email.includes('@')}
                              className="btn-outline text-xs px-4 py-2.5 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-gold hover:text-white"
                              id="send-otp-btn"
                            >
                              Send OTP
                            </button>
                          )}
                        </div>
                      </div>

                      {otpSent && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3 max-w-lg border-t border-brand-light/60 pt-4"
                        >
                          <label className="block text-[10px] font-semibold text-brand-grey uppercase tracking-wider mb-1.5">
                            Enter 6-Digit Code
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={otp}
                              onChange={e => {
                                const val = e.target.value.replace(/\D/g, '');
                                setOtp(val);
                                if (val.length === 6) {
                                  setIsVerified(true);
                                  toast.success('Email authenticated successfully', {
                                    style: {
                                      border: '1px solid #C58837',
                                      color: '#111111',
                                      fontFamily: 'Montserrat, sans-serif'
                                    }
                                  });
                                }
                              }}
                              placeholder="0 0 0 0 0 0"
                              maxLength={6}
                              className="w-44 border border-brand-light px-4 py-2.5 text-center text-sm font-mono tracking-[0.4em] focus:outline-none focus:border-brand-gold bg-white"
                              id="otp-input"
                              aria-label="OTP"
                            />
                            {isVerified ? (
                              <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-3 py-2.5 rounded-sm flex items-center gap-1.5">
                                <Check size={14} /> Verified
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (otp.length === 6) {
                                    setIsVerified(true);
                                    toast.success('Email authenticated successfully', {
                                      style: {
                                        border: '1px solid #C58837',
                                        color: '#111111',
                                        fontFamily: 'Montserrat, sans-serif'
                                      }
                                    });
                                  } else {
                                    toast.error('Please enter a 6-digit code');
                                  }
                                }}
                                className="btn-primary text-xs px-4 py-2.5"
                                id="verify-otp-btn"
                              >
                                Verify
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-brand-grey italic">
                            Mock Mode: Enter any 6 digits to verify.
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      // Validate billing address fields
                      const requiredFields = [
                        { key: 'firstName', label: 'First name' },
                        { key: 'lastName', label: 'Last name' },
                        { key: 'phone', label: 'Phone Number' },
                        { key: 'email', label: 'Email Address' },
                        { key: 'flatHouse', label: 'Flat/House Address' },
                        { key: 'areaStreet', label: 'Area/Street' },
                        { key: 'city', label: 'Town/City' },
                        { key: 'state', label: 'State' },
                        { key: 'pincode', label: 'Pincode' },
                        { key: 'country', label: 'Country' }
                      ];
                      for (const f of requiredFields) {
                        if (!billingAddress[f.key]?.trim()) {
                          toast.error(`Please enter billing ${f.label}`, {
                            style: { border: '1px solid #C58837', color: '#111111', fontFamily: 'Montserrat, sans-serif' }
                          });
                          return;
                        }
                      }

                      // Validate delivery address fields if not same
                      if (!deliverySameAsBilling) {
                        for (const f of requiredFields) {
                          if (!address[f.key]?.trim()) {
                            toast.error(`Please enter delivery ${f.label}`, {
                              style: { border: '1px solid #C58837', color: '#111111', fontFamily: 'Montserrat, sans-serif' }
                            });
                            return;
                          }
                        }
                      }

                      if (!isVerified) {
                        toast.error('Please verify your email address to proceed', {
                          style: {
                            border: '1px solid #C58837',
                            color: '#111111',
                            fontFamily: 'Montserrat, sans-serif'
                          }
                        });
                        return;
                      }
                      setStep(2);
                    }}
                    className="btn-primary mt-6 w-full"
                    id="step1-next"
                  >
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
                    {['Razorpay UPI', 'Cash on Delivery'].map(method => (
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
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-sm mb-2">Billing Address</h3>
                      <p className="text-sm text-brand-grey">{billingAddress.firstName} {billingAddress.lastName} · {billingAddress.phone}</p>
                      {billingAddress.email && <p className="text-xs text-brand-grey mb-1">{billingAddress.email}</p>}
                      <p className="text-sm text-brand-grey">
                        {billingAddress.flatHouse}, {billingAddress.areaStreet}
                        {billingAddress.landmark && `, near ${billingAddress.landmark}`}
                      </p>
                      <p className="text-sm text-brand-grey">
                        {billingAddress.city}, {billingAddress.state} {billingAddress.pincode}, {billingAddress.country}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm mb-2">Delivery to (Shipping)</h3>
                      {deliverySameAsBilling ? (
                        <p className="text-sm text-brand-grey italic">Same as billing address</p>
                      ) : (
                        <>
                          <p className="text-sm text-brand-grey">{address.firstName} {address.lastName} · {address.phone}</p>
                          {address.email && <p className="text-xs text-brand-grey mb-1">{address.email}</p>}
                          <p className="text-sm text-brand-grey">
                            {address.flatHouse}, {address.areaStreet}
                            {address.landmark && `, near ${address.landmark}`}
                          </p>
                          <p className="text-sm text-brand-grey">
                            {address.city}, {address.state} {address.pincode}, {address.country}
                          </p>
                        </>
                      )}
                    </div>
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
