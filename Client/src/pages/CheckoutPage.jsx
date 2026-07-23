import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, MapPin, CreditCard, Package, ChevronRight, Eye, EyeOff, Tag } from 'lucide-react';
import { placeOrder } from '../redux/slices/ordersSlice';
import { clearLocal, syncCart, clearBuyNowItem } from '../redux/slices/cartSlice';
import { loginCustomer, registerCustomer } from '../redux/slices/authSlice';
import { setCurrency } from '../redux/slices/currencySlice';
import api from '../services/api';
import Footer from '../components/Footer';
import { formatPrice } from '../utils/currency';
import toast from 'react-hot-toast';
import { validatePhoneNumber } from '../utils/validation';

const STEPS = [
  { id: 1, label: 'Delivery', icon: MapPin },
  { id: 2, label: 'Payment', icon: CreditCard },
  { id: 3, label: 'Review', icon: Package },
];

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep',
  'Puducherry',
];

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isBuyNowMode = searchParams.get('mode') === 'buynow';

  const { items: cartItems, subtotal: cartSubtotal, buyNowItem } = useSelector(s => s.cart);
  const { isAuthenticated, customer } = useSelector(s => s.auth);
  const { code: currencyCode, rate: currencyRate } = useSelector(s => s.currency);

  const items = isBuyNowMode && buyNowItem ? [buyNowItem] : cartItems;

  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.priceAtAdd || item.price || item.product?.price || 0);
    return sum + (price * (item.quantity || 1));
  }, 0);

  // Login panel state
  const [showLoginPanel, setShowLoginPanel] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Create account state
  const [createAccount, setCreateAccount] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  // Checkout state
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);

  // Admin-configurable OTP threshold settings (Default: INR 20,000 / AED 800)
  const [otpSettings, setOtpSettings] = useState({
    inrThreshold: 20000,
    aedThreshold: 800,
    requireCodOtp: true,
  });

  useEffect(() => {
    api.get('/settings/otp_threshold')
      .then(res => {
        if (res.data?.success && res.data?.data) {
          setOtpSettings({
            inrThreshold: Number(res.data.data.inrThreshold) || 20000,
            aedThreshold: Number(res.data.data.aedThreshold) || 800,
            requireCodOtp: res.data.data.requireCodOtp !== false,
          });
        }
      })
      .catch(err => {
        console.warn('[Checkout] Using default OTP thresholds (INR 20,000 / AED 800):', err.message);
      });
  }, []);

  const getItemDetails = (item) => {
    const name = item.product?.name || item.productName || item.name || 'Luxury Product';

    // Resolve image URL
    let rawImg = item.image || item.productImage || item.product?.image || (item.product?.images && item.product.images[0]);
    if (!rawImg || rawImg === 'undefined') {
      rawImg = 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=160';
    } else if (typeof rawImg === 'string' && rawImg.startsWith('/') && !rawImg.startsWith('//')) {
      rawImg = `http://localhost:5000${rawImg}`;
    }

    // Variant details
    let variantText = null;
    const rawVar = item.selectedVariant || item.variant;
    if (rawVar) {
      let parsedVar = rawVar;
      if (typeof rawVar === 'string') {
        try { parsedVar = JSON.parse(rawVar); } catch { parsedVar = null; }
      }
      if (parsedVar && typeof parsedVar === 'object') {
        const entries = Object.entries(parsedVar).filter(([k, v]) => v !== undefined && v !== null && v !== '' && k !== 'id');
        if (entries.length > 0) {
          variantText = entries.map(([k, v]) => `${k}: ${v}`).join(' · ');
        }
      } else if (typeof rawVar === 'string' && rawVar !== '{}') {
        variantText = rawVar;
      }
    }

    const price = parseFloat(item.priceAtAdd || item.price || item.unitPrice || item.product?.price || 0);

    return { name, image: rawImg, variantText, price };
  };

  const handleTriggerFraudCheck = async () => {
    const targetEmail = (billingAddress.email || customer?.email || '').trim();
    if (!targetEmail) {
      toast.error('Please provide a valid email address for order verification.');
      return;
    }
    setOtp('');
    setOtpLoading(true);
    try {
      await api.post('/auth/send-checkout-otp', {
        email: targetEmail,
        name: billingAddress.fullName || customer?.name || 'Customer'
      });
      setOtpSent(true);
      toast.success(`Verification OTP sent to ${targetEmail}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send verification email. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyFraudOtp = async (codeValue) => {
    const code = codeValue || otp;
    if (code.length < 6) {
      toast.error('Please enter the full 6-digit code.');
      return;
    }
    const targetEmail = (billingAddress.email || customer?.email || '').trim();
    setVerifyingOtp(true);
    try {
      await api.post('/auth/verify-checkout-otp', {
        email: targetEmail,
        otp: code
      });
      setIsVerified(true);
      setOtpSent(false);
      toast.success('Security verification successful!');
      handlePlaceOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const fmt = (v) => formatPrice(v, currencyCode, currencyRate);

  const getEstimatedDeliveryRange = (pincode) => {
    let minDays = 3, maxDays = 5;
    if (pincode && pincode.trim().length === 6) {
      const fd = pincode.trim()[0];
      if (['1', '4', '5', '6'].includes(fd)) { minDays = 2; maxDays = 3; }
      else { minDays = 4; maxDays = 7; }
    }
    const today = new Date();
    const minDate = new Date(); minDate.setDate(today.getDate() + minDays);
    const maxDate = new Date(); maxDate.setDate(today.getDate() + maxDays);
    const opts = { weekday: 'short', day: 'numeric', month: 'short' };
    return `${minDate.toLocaleDateString('en-US', opts)} — ${maxDate.toLocaleDateString('en-US', opts)}`;
  };

  const emptyAddr = {
    fullName: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    flatHouse: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  };

  const [billingAddress, setBillingAddress] = useState({ ...emptyAddr });
  const [deliverySameAsBilling, setDeliverySameAsBilling] = useState(true);
  const [address, setAddress] = useState({ ...emptyAddr });
  const [paymentMethod, setPaymentMethod] = useState('Credit / Debit Card');

  const handleToggleDeliverySame = (checked) => {
    setDeliverySameAsBilling(checked);
    if (!checked) setAddress({ ...billingAddress });
  };

  // Sync currency state when shipping country changes
  useEffect(() => {
    const activeAddress = deliverySameAsBilling ? billingAddress : address;
    const country = (activeAddress.country || '').trim().toLowerCase();
    const isUaeCountry = ['uae', 'united arab emirates', 'dubai', 'abu dhabi', 'sharjah'].includes(country);
    if (isUaeCountry) {
      if (currencyCode !== 'AED') {
        dispatch(setCurrency('AED'));
      }
    } else {
      if (currencyCode !== 'INR') {
        dispatch(setCurrency('INR'));
      }
    }
  }, [billingAddress.country, address.country, deliverySameAsBilling, currencyCode, dispatch]);

  // Guard: don't let an empty cart (e.g. from a page reload wiping in-memory
  // guest state) sit on checkout and silently reach handlePlaceOrder.
  useEffect(() => {
    if (items.length === 0) {
      toast.error('Your cart is empty. Add something before checking out.');
      navigate('/cart');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = localStorage.getItem('bb_applied_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const couponDiscount = appliedCoupon ? (() => {
    const value = Number(appliedCoupon.value || 0);
    if (subtotal < Number(appliedCoupon.minOrderValue || 0)) return 0;
    if (appliedCoupon.type === 'PERCENT') {
      const maxD = Number(appliedCoupon.maxDiscount || Infinity);
      return Math.min((subtotal * value) / 100, maxD);
    }
    if (appliedCoupon.type === 'FLAT') {
      return Math.min(value, subtotal);
    }
    return 0;
  })() : 0;

  const handleApplyCheckoutCoupon = async () => {
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) return;
    setValidatingCoupon(true);
    try {
      const res = await api.post('/coupons/validate', { code, subtotal });
      if (res.data?.success && res.data?.valid) {
        setAppliedCoupon(res.data.coupon);
        localStorage.setItem('bb_applied_coupon', JSON.stringify(res.data.coupon));
        toast.success(`Coupon ${res.data.coupon.code} applied!`);
        setCouponCodeInput('');
      } else {
        toast.error(res.data?.message || 'Invalid coupon code');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCheckoutCoupon = () => {
    setAppliedCoupon(null);
    localStorage.removeItem('bb_applied_coupon');
    toast.success('Coupon removed.');
  };

  const shipping = subtotal >= 1499 ? 0 : 99;
  const taxableSubtotal = Math.max(0, subtotal - couponDiscount);
  const tax = taxableSubtotal * 0.05;
  const total = taxableSubtotal + shipping + tax;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) { toast.error('Enter your email and password'); return; }
    setLoginLoading(true);
    try {
      await dispatch(loginCustomer({ email: loginEmail, password: loginPassword })).unwrap();
      toast.success('Logged in successfully!');
      setShowLoginPanel(false);
    } catch (err) {
      toast.error(err || 'Login failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!billingAddress.fullName?.trim()) {
      toast.error('Please enter your Full Name in the Billing Address section above.');
      return;
    }
    if (!billingAddress.email?.trim()) {
      toast.error('Please enter your Email Address in the Billing Address section above.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingAddress.email.trim())) {
      toast.error('Please enter a valid email address in the Billing Address section.');
      return;
    }
    if (!billingAddress.phone?.trim()) {
      toast.error('Please enter your Mobile Number in the Billing Address section above.');
      return;
    }
    const phoneValidation = validatePhoneNumber(billingAddress.phone);
    if (!phoneValidation.isValid) {
      toast.error('Billing Phone: ' + phoneValidation.message);
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setRegisterLoading(true);
    try {
      await dispatch(registerCustomer({
        name: billingAddress.fullName.trim(),
        email: billingAddress.email.trim().toLowerCase(),
        password: newPassword,
        phone: billingAddress.phone.trim()
      })).unwrap();
      toast.success('Account created and logged in successfully!');
    } catch (err) {
      toast.error(err || 'Registration failed. Please check your details.');
    } finally {
      setRegisterLoading(false);
    }
  };

  // Helper to dynamically load Razorpay checkout script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to your account to place an order.');
      setStep(1);
      setShowLoginPanel(true);
      return;
    }
    if (items.length === 0) {
      toast.error('Your cart is empty. Add something before checking out.');
      navigate('/cart');
      return;
    }
    setPlacing(true);
    try {
      // 1. Sync the client's current cart list to the server database first (concurrency & tampering protection)
      const itemsToSync = items.map(i => ({
        productId: i.productId,
        variantId: i.variantId || i.selectedVariant?.id || null,
        quantity: i.quantity,
        selectedVariant: i.selectedVariant || {}
      }));
      await dispatch(syncCart(itemsToSync)).unwrap();

      // 2. Proceed with order placement using server-side cart database truth
      const referralCode = localStorage.getItem('bb_referral') || undefined;
      const order = await dispatch(placeOrder({
        shippingAddress: deliverySameAsBilling ? billingAddress : address,
        billingAddress: billingAddress,
        paymentMethod, referralCode,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      })).unwrap();

      const finishOrderClear = () => {
        localStorage.removeItem('bb_referral');
        localStorage.removeItem('bb_applied_coupon');
        if (isBuyNowMode) {
          dispatch(clearBuyNowItem());
        } else {
          dispatch(clearLocal());
        }
      };

      // 3. COD: skip payment gateway entirely, go straight to confirmation
      const isCod = paymentMethod === 'Cash on Delivery (COD)';
      if (isCod) {
        finishOrderClear();
        navigate(`/order-confirmation?gateway=cod&orderId=${order.id}&status=success`);
        return;
      }

      // 4. Initiate payment gateway transaction (Razorpay for INR, Telr for AED)
      const initRes = await api.post('/payments/initiate', { orderId: order.id });
      if (!initRes.data?.success) {
        throw new Error(initRes.data?.message || 'Failed to initialize payment details from gateway.');
      }

      const paymentData = initRes.data;

      if (paymentData.gateway === 'telr') {
        // Telr: redirect to hosted payment page
        finishOrderClear();
        window.location.href = paymentData.redirectUrl;

      } else if (paymentData.gateway === 'razorpay') {
        // Razorpay: load SDK and open checkout overlay
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          toast.error('Failed to load Razorpay SDK. Please check your internet connection.');
          setPlacing(false);
          return;
        }

        const options = {
          key: paymentData.key,
          amount: paymentData.amount,
          currency: paymentData.currency,
          name: paymentData.name,
          description: paymentData.description,
          order_id: paymentData.order_id,
          handler: async function (response) {
            setPlacing(true);
            try {
              const verifyRes = await api.post('/payments/verify', {
                orderId: order.id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              });
              if (verifyRes.data?.success) {
                finishOrderClear();
                navigate(`/order-confirmation?gateway=razorpay&orderId=${order.id}&status=success`);
              } else {
                toast.error(verifyRes.data?.message || 'Payment verification failed. Please contact support.');
              }
            } catch (err) {
              console.error('Payment verification failed:', err);
              toast.error(err.response?.data?.message || 'Failed to verify payment with server.');
            } finally {
              setPlacing(false);
            }
          },
          prefill: {
            name: billingAddress.fullName,
            email: billingAddress.email,
            contact: billingAddress.phone,
          },
          theme: {
            color: '#C9A24B',
          },
          modal: {
            ondismiss: function () {
              toast.error('Payment process was cancelled.');
              setPlacing(false);
            }
          }
        };

        // Stop the main spinner — Razorpay overlay handles UI from here
        setPlacing(false);
        const rzp = new window.Razorpay(options);
        rzp.open();

      } else {
        throw new Error('Unknown payment gateway returned from server.');
      }

    } catch (err) {
      console.error('Order failed:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to place order. Please try again.');
      setPlacing(false);
    }
  };


  const validateStep1 = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to your account to continue to payment.');
      setShowLoginPanel(true);
      setTimeout(() => {
        const loginEl = document.getElementById('toggle-login-panel');
        if (loginEl) {
          loginEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return false;
    }
    const requiredFields = [
      { key: 'fullName', label: 'Full Name' },
      { key: 'phone', label: 'Mobile Number' },
      { key: 'email', label: 'Email Address' },
      { key: 'flatHouse', label: 'Street / House No.' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'pincode', label: 'Pincode' },
    ];
    for (const f of requiredFields) {
      if (!billingAddress[f.key]?.trim()) {
        toast.error(`Please enter ${f.label}`);
        return false;
      }
    }
    const phoneValidation = validatePhoneNumber(billingAddress.phone);
    if (!phoneValidation.isValid) {
      toast.error(phoneValidation.message);
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingAddress.email.trim())) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (billingAddress.pincode.trim().length !== 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return false;
    }
    if (!deliverySameAsBilling) {
      for (const f of requiredFields) {
        if (!address[f.key]?.trim()) {
          toast.error(`Please enter delivery ${f.label}`);
          return false;
        }
      }
      const delPhoneValidation = validatePhoneNumber(address.phone);
      if (!delPhoneValidation.isValid) {
        toast.error('Delivery Phone: ' + delPhoneValidation.message);
        return false;
      }
    }
    if (createAccount && newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const inputCls = 'w-full border border-neutral-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/20 transition-colors placeholder-neutral-400 bg-white';
  const labelCls = 'block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5';

  return (
    <main id="main-content">
      <div className="max-w-site mx-auto px-4 md:px-8 py-8 md:py-12">
        <h1 className="font-playfair text-2xl md:text-3xl font-bold mb-2">Secure Checkout</h1>

        {/* Returning customer panel */}
        {!isAuthenticated && (
          <div className="mb-6">
            <p className="text-sm text-neutral-500 mb-3">
              Returning customer?{' '}
              <button
                onClick={() => setShowLoginPanel(v => !v)}
                className="text-brand-gold font-semibold hover:underline focus:outline-none"
                id="toggle-login-panel"
              >
                Click here to login
              </button>
            </p>

            <AnimatePresence>
              {showLoginPanel && (
                <motion.div
                  key="login-panel"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <form
                    onSubmit={handleLogin}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg p-5 mb-4"
                  >
                    <p className="text-xs text-neutral-500 mb-4">
                      If you have shopped with us before, please enter your login details below.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls} htmlFor="login-email">Email Address</label>
                        <input
                          id="login-email"
                          type="email"
                          value={loginEmail}
                          onChange={e => setLoginEmail(e.target.value)}
                          placeholder="your@email.com"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls} htmlFor="login-password">Password</label>
                        <div className="relative">
                          <input
                            id="login-password"
                            type={showLoginPw ? 'text' : 'password'}
                            value={loginPassword}
                            onChange={e => setLoginPassword(e.target.value)}
                            placeholder="Your password"
                            className={`${inputCls} pr-10`}
                          />
                          <button type="button" onClick={() => setShowLoginPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                            {showLoginPw ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <button type="submit" disabled={loginLoading} className="btn-primary px-6 py-2 text-sm" id="login-btn">
                        {loginLoading ? 'Logging in…' : 'Login'}
                      </button>
                      <Link
                        to={`/account?view=forgot${loginEmail ? `&email=${encodeURIComponent(loginEmail.trim())}` : ''}`}
                        className="text-xs text-brand-gold hover:underline"
                        id="checkout-forgot-password-link"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Checkout steps */}
        <div className="glass-step-pill flex items-center justify-center gap-0 mb-8 p-1 px-2 sm:p-2 sm:px-5 rounded-full w-fit mx-auto" aria-label="Checkout progress">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => step > s.id && setStep(s.id)}
                className={`flex items-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs md:text-sm font-semibold tracking-wider uppercase transition-all ${step === s.id ? 'bg-brand-gold text-white' : step > s.id ? 'text-brand-gold cursor-pointer hover:bg-brand-light' : 'text-brand-grey cursor-default'}`}
                aria-current={step === s.id ? 'step' : undefined}
                id={`step-${s.id}`}
              >
                {step > s.id ? <Check size={10} className="sm:w-3.5 sm:h-3.5" /> : <s.icon size={10} className="sm:w-3.5 sm:h-3.5" />}
                <span>
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && <ChevronRight size={10} className="text-brand-grey mx-0.5 sm:mx-1 sm:w-3.5 sm:h-3.5" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 md:gap-10">
          {/* Form area */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">

              {/* ── Step 1: Delivery ── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <div className="bg-white border border-neutral-200 rounded-lg p-5 md:p-6">
                    <h2 className="font-playfair text-xl font-semibold mb-1">Billing Address</h2>
                    <p className="text-xs text-neutral-400 mb-5">All fields marked * are required</p>



                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls} htmlFor="full-name">Full Name <span className="text-red-400">*</span></label>
                          <input id="full-name" type="text" value={billingAddress.fullName}
                            onChange={e => setBillingAddress(p => ({ ...p, fullName: e.target.value }))}
                            placeholder="Enter your full name" className={inputCls} required />
                        </div>
                        <div>
                          <label className={labelCls} htmlFor="mobile">Mobile Number <span className="text-red-400">*</span></label>
                          <input id="mobile" type="tel" value={billingAddress.phone}
                            onChange={e => setBillingAddress(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                            placeholder="10-digit mobile" maxLength={10} className={inputCls} required />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="sm:col-span-2">
                        <label className={labelCls} htmlFor="email-addr">Email Address <span className="text-red-400">*</span></label>
                        <input id="email-addr" type="email" value={billingAddress.email}
                          onChange={e => setBillingAddress(p => ({ ...p, email: e.target.value }))}
                          placeholder="your@email.com" className={inputCls} required />
                      </div>

                      {/* Street */}
                      <div className="sm:col-span-2">
                        <label className={labelCls} htmlFor="flat-house">Street / House No. <span className="text-red-400">*</span></label>
                        <input id="flat-house" type="text" value={billingAddress.flatHouse}
                          onChange={e => setBillingAddress(p => ({ ...p, flatHouse: e.target.value }))}
                          placeholder="House / flat no., road name" className={inputCls} required />
                      </div>

                      {/* Landmark (optional) */}
                      <div className="sm:col-span-2">
                        <label className={labelCls} htmlFor="landmark">Apartment / Landmark <span className="text-neutral-300">(optional)</span></label>
                        <input id="landmark" type="text" value={billingAddress.landmark}
                          onChange={e => setBillingAddress(p => ({ ...p, landmark: e.target.value }))}
                          placeholder="Building name, floor, landmark" className={inputCls} />
                      </div>

                      {/* City */}
                      <div>
                        <label className={labelCls} htmlFor="city">City <span className="text-red-400">*</span></label>
                        <input id="city" type="text" value={billingAddress.city}
                          onChange={e => setBillingAddress(p => ({ ...p, city: e.target.value }))}
                          placeholder="City" className={inputCls} required />
                      </div>

                      {/* State dropdown */}
                      <div>
                        <label className={labelCls} htmlFor="state">State <span className="text-red-400">*</span></label>
                        <select id="state" value={billingAddress.state}
                          onChange={e => setBillingAddress(p => ({ ...p, state: e.target.value }))}
                          className={`${inputCls} appearance-none cursor-pointer`} required>
                          <option value="">Select State</option>
                          {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      {/* Pincode */}
                      <div>
                        <label className={labelCls} htmlFor="pincode">Pincode <span className="text-red-400">*</span></label>
                        <input id="pincode" type="text" value={billingAddress.pincode}
                          onChange={e => setBillingAddress(p => ({ ...p, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                          placeholder="6-digit pincode" maxLength={6} className={inputCls} required />
                        {billingAddress.pincode.length === 6 && (
                          <p className="text-[11px] text-brand-gold mt-1 font-semibold">
                            🚚 Est. Delivery: {getEstimatedDeliveryRange(billingAddress.pincode)}
                          </p>
                        )}
                      </div>

                      {/* Country */}
                      <div>
                        <label className={labelCls} htmlFor="country">Country</label>
                        <select id="country" value={billingAddress.country}
                          onChange={e => setBillingAddress(p => ({ ...p, country: e.target.value }))}
                          className={`${inputCls} appearance-none cursor-pointer`} required>
                          <option value="India">India</option>
                          <option value="United Arab Emirates">United Arab Emirates</option>
                        </select>
                      </div>
                    </div>

                    {/* Same delivery toggle */}
                    <div className="mt-5 flex items-center gap-3">
                      <input id="same-delivery" type="checkbox" checked={deliverySameAsBilling}
                        onChange={e => handleToggleDeliverySame(e.target.checked)}
                        className="w-4 h-4 accent-brand-gold cursor-pointer" />
                      <label htmlFor="same-delivery" className="text-sm font-medium text-brand-text cursor-pointer select-none">
                        Delivery address is same as billing address
                      </label>
                    </div>

                    {/* Separate delivery address */}
                    <AnimatePresence initial={false}>
                      {!deliverySameAsBilling && (
                        <motion.div
                          key="delivery-section"
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }} className="overflow-hidden"
                        >
                          <h3 className="font-playfair text-lg font-semibold mt-6 mb-4 border-t border-neutral-100 pt-5">Delivery Address</h3>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className={labelCls} htmlFor="d-fullname">Full Name *</label>
                                <input id="d-fullname" type="text" value={address.fullName} onChange={e => setAddress(p => ({...p, fullName: e.target.value}))} placeholder="Full name" className={inputCls} />
                              </div>
                              <div>
                                <label className={labelCls} htmlFor="d-phone">Mobile *</label>
                                <input id="d-phone" type="tel" value={address.phone} onChange={e => setAddress(p => ({...p, phone: e.target.value.replace(/\D/g,'').slice(0,10)}))} placeholder="10-digit mobile" className={inputCls} />
                              </div>
                            </div>
                            <div className="sm:col-span-2">
                              <label className={labelCls} htmlFor="d-email">Email *</label>
                              <input id="d-email" type="email" value={address.email} onChange={e => setAddress(p => ({...p, email: e.target.value}))} placeholder="your@email.com" className={inputCls} />
                            </div>
                            <div className="sm:col-span-2">
                              <label className={labelCls} htmlFor="d-flat">Street / House No. *</label>
                              <input id="d-flat" type="text" value={address.flatHouse} onChange={e => setAddress(p => ({...p, flatHouse: e.target.value}))} placeholder="House / flat no., road name" className={inputCls} />
                            </div>
                            <div className="sm:col-span-2">
                              <label className={labelCls} htmlFor="d-landmark">Apartment / Landmark</label>
                              <input id="d-landmark" type="text" value={address.landmark} onChange={e => setAddress(p => ({...p, landmark: e.target.value}))} placeholder="Building name, floor, landmark" className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls} htmlFor="d-city">City *</label>
                              <input id="d-city" type="text" value={address.city} onChange={e => setAddress(p => ({...p, city: e.target.value}))} placeholder="City" className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls} htmlFor="d-state">State *</label>
                              <select id="d-state" value={address.state} onChange={e => setAddress(p => ({...p, state: e.target.value}))} className={`${inputCls} appearance-none cursor-pointer`}>
                                <option value="">Select State</option>
                                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className={labelCls} htmlFor="d-pincode">Pincode *</label>
                              <input id="d-pincode" type="text" value={address.pincode} onChange={e => setAddress(p => ({...p, pincode: e.target.value.replace(/\D/g,'').slice(0,6)}))} placeholder="6-digit pincode" maxLength={6} className={inputCls} />
                              {address.pincode.length === 6 && (
                                <p className="text-[11px] text-brand-gold mt-1 font-semibold">🚚 Est. Delivery: {getEstimatedDeliveryRange(address.pincode)}</p>
                              )}
                            </div>
                             <div>
                              <label className={labelCls} htmlFor="d-country">Country</label>
                              <select id="d-country" value={address.country}
                                onChange={e => setAddress(p => ({...p, country: e.target.value}))}
                                className={`${inputCls} appearance-none cursor-pointer`}>
                                <option value="India">India</option>
                                <option value="United Arab Emirates">United Arab Emirates</option>
                              </select>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Create account optional */}
                  {!isAuthenticated && (
                    <div className="bg-white border border-neutral-200 rounded-lg p-5 md:p-6">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input type="checkbox" checked={createAccount}
                          onChange={e => setCreateAccount(e.target.checked)}
                          className="w-4 h-4 accent-brand-gold rounded cursor-pointer" id="create-account-chk" />
                        <span className="font-semibold text-sm text-brand-text">Create an account?</span>
                      </label>

                      <AnimatePresence initial={false}>
                        {createAccount && (
                          <motion.div
                            key="create-account"
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }} className="overflow-hidden mt-4"
                          >
                            <div>
                              <label className={labelCls} htmlFor="new-password">Password (min. 6 characters)</label>
                              <div className="flex flex-col sm:flex-row gap-3 max-w-md items-start sm:items-center">
                                <div className="relative flex-1 w-full">
                                  <input
                                    id="new-password"
                                    type={showNewPw ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Create a password"
                                    className={`${inputCls} pr-10`}
                                    minLength={6}
                                  />
                                  <button type="button" onClick={() => setShowNewPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                                    {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleRegister}
                                  disabled={registerLoading}
                                  className="btn-primary py-2.5 px-5 text-sm font-semibold whitespace-nowrap h-[42px] flex items-center justify-center min-w-[120px]"
                                  id="register-btn"
                                >
                                  {registerLoading ? 'Registering...' : 'Register'}
                                </button>
                              </div>
                              <p className="text-xs text-neutral-400 mt-2">
                                Fill in your name, email, and phone under Billing Address, choose a password, and click <strong>Register</strong> to create your account instantly.
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {!createAccount && (
                        <div className="mt-4 bg-yellow-50 border border-yellow-200/70 rounded-md p-3 flex items-start gap-2">
                          <span className="text-base mt-0.5">💡</span>
                          <p className="text-xs text-neutral-600 leading-relaxed">
                            <strong>Note:</strong> Log in or check <strong className="text-brand-gold">"Create an account?"</strong> above to track your order history and receive delivery updates!
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <button onClick={() => { if (validateStep1()) setStep(2); }}
                    className="btn-primary w-full py-3 text-sm font-semibold" id="step1-next">
                    Continue to Payment
                  </button>
                </motion.div>
              )}

              {/* ── Step 2: Payment ── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white border border-neutral-200 rounded-lg p-5 md:p-6"
                >
                  <h2 className="font-playfair text-xl font-semibold mb-1">Payment Method</h2>
                  <p className="text-xs text-neutral-400 mb-5">All transactions are secure and encrypted.</p>
                  <div className="space-y-2.5">
                    {(currencyCode === 'AED'
                      ? [
                          { label: 'Credit / Debit Card', icon: '💳', badge: null },
                          { label: 'Apple Pay', icon: '', badge: 'Recommended' },
                          { label: 'Net Banking', icon: '🏦', badge: null },
                          { label: 'Wallets', icon: '👛', badge: null },
                        ]
                      : [
                          { label: 'Credit / Debit Card', icon: '💳', badge: null },
                          { label: 'Net Banking', icon: '🏦', badge: null },
                          { label: 'UPI', icon: '📱', badge: 'Recommended' },
                          { label: 'Wallets', icon: '👛', badge: null },
                        ]
                    ).map(({ label, icon, badge }) => (
                      <label key={label}
                        className={`flex items-center gap-3 p-4 rounded-md border cursor-pointer transition-all ${
                          paymentMethod === label
                            ? 'border-brand-gold bg-brand-gold/5'
                            : 'border-neutral-200 hover:border-brand-gold/40 bg-white'
                        }`}
                        id={`pay-${label.replace(/[\\/\s()]/g, '-')}`}>
                        <input type="radio" name="paymentMethod" value={label}
                          checked={paymentMethod === label}
                          onChange={() => setPaymentMethod(label)}
                          className="accent-brand-gold" />
                        <span className="text-lg">{icon}</span>
                        <span className="font-medium text-sm text-brand-text flex-1">{label}</span>
                        {badge && <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">{badge}</span>}
                      </label>
                    ))}
                    {/* Cash on Delivery (COD) — temporarily unavailable */}
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
                    <button onClick={() => setStep(1)} className="btn-outline flex-1 py-3 text-sm font-semibold" id="step2-back">Back</button>
                    <button onClick={() => setStep(3)} className="btn-primary flex-1 py-3 text-sm font-semibold" id="step2-next">Review Order</button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 3: Review ── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white border border-neutral-200 rounded-lg p-5 md:p-6 space-y-6"
                >
                  <h2 className="font-playfair text-xl font-semibold">Review Your Order</h2>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="bg-neutral-50 rounded-md p-4">
                      <h3 className="font-semibold text-xs text-neutral-400 uppercase tracking-wider mb-2">Billing Address</h3>
                      <p className="text-sm font-medium text-brand-text">{billingAddress.fullName}</p>
                      <p className="text-xs text-brand-grey">{billingAddress.phone} · {billingAddress.email}</p>
                      <p className="text-xs text-brand-grey mt-1">{billingAddress.flatHouse}{billingAddress.landmark && `, ${billingAddress.landmark}`}</p>
                      <p className="text-xs text-brand-grey">{billingAddress.city}, {billingAddress.state} {billingAddress.pincode}</p>
                    </div>
                    <div className="bg-neutral-50 rounded-md p-4">
                      <h3 className="font-semibold text-xs text-neutral-400 uppercase tracking-wider mb-2">Delivery Address</h3>
                      {deliverySameAsBilling ? (
                        <p className="text-xs text-brand-grey italic">Same as billing address</p>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-brand-text">{address.fullName}</p>
                          <p className="text-xs text-brand-grey">{address.phone}</p>
                          <p className="text-xs text-brand-grey mt-1">{address.flatHouse}{address.landmark && `, ${address.landmark}`}</p>
                          <p className="text-xs text-brand-grey">{address.city}, {address.state} {address.pincode}</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-neutral-50 rounded-md p-4">
                    <h3 className="font-semibold text-xs text-neutral-400 uppercase tracking-wider mb-2">Payment Method</h3>
                    <p className="text-sm text-brand-text font-medium">{paymentMethod}</p>
                  </div>

                  {/* Items in Order Breakdown */}
                  <div className="bg-neutral-50 rounded-md p-4">
                    <h3 className="font-semibold text-xs text-neutral-400 uppercase tracking-wider mb-3">
                      Items in Order ({items.length})
                    </h3>
                    <div className="space-y-3">
                      {items.map((item, idx) => {
                        const details = getItemDetails(item);
                        return (
                          <div key={item.productId || item.id || idx} className="flex gap-3 items-center py-2 border-b border-neutral-200/60 last:border-0">
                            <img
                              src={details.image}
                              alt={details.name}
                              className="w-12 h-14 object-cover rounded border border-neutral-200 bg-white flex-shrink-0"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=160';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-neutral-900 truncate">{details.name}</p>
                              {details.variantText && (
                                <p className="text-[11px] text-brand-gold font-medium mt-0.5">{details.variantText}</p>
                              )}
                              <p className="text-[11px] text-neutral-500 mt-0.5">Qty: {item.quantity} × {fmt(details.price)}</p>
                            </div>
                            <span className="text-xs font-bold text-neutral-900">{fmt(details.price * item.quantity)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Delivery estimate banner */}
                  <div className="flex items-center gap-3 p-4 bg-brand-light/30 border border-brand-gold/20 rounded-md">
                    <span className="text-xl">🚚</span>
                    <div>
                      <p className="text-xs font-semibold text-brand-text">Estimated Delivery Window</p>
                      <p className="text-xs text-brand-grey mt-0.5">{getEstimatedDeliveryRange(billingAddress.pincode)}</p>
                    </div>
                  </div>


                  <div className="flex flex-col-reverse sm:flex-row gap-3">
                    <button onClick={() => setStep(2)} className="btn-outline flex-1 py-3 text-sm font-semibold" id="step3-back">Back</button>
                    <button
                      onClick={() => {
                        const inrLimit = otpSettings.inrThreshold || 20000;
                        const aedLimit = otpSettings.aedThreshold || 800;
                        const isCod = paymentMethod === 'Cash on Delivery (COD)';

                        const isHighValue = currencyCode === 'AED'
                          ? total >= aedLimit
                          : total >= inrLimit;

                        const requiresOtp = isHighValue || (isCod && otpSettings.requireCodOtp !== false);

                        if (requiresOtp && !isVerified) {
                          handleTriggerFraudCheck();
                        } else {
                          handlePlaceOrder();
                        }
                      }}
                      disabled={placing || otpLoading}
                      className="btn-primary flex-1 py-3 text-sm font-semibold" id="place-order-btn"
                    >
                      {placing ? 'Placing Order…' : otpLoading ? 'Sending Security Code…' : `Place Order — ${fmt(total)}`}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Order Summary Sidebar ── */}
          <div className="lg:col-span-1 bg-white border border-neutral-200 rounded-lg p-5 md:p-6 self-start sticky top-24">
            <h2 className="font-playfair text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-brand-grey">Subtotal ({items.length} items)</span><span>{fmt(subtotal)}</span></div>
              {appliedCoupon && couponDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span className="flex items-center gap-1"><Tag size={12} /> Coupon ({appliedCoupon.code})</span>
                  <span>-{fmt(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between"><span className="text-brand-grey">Shipping</span><span>{shipping === 0 ? <span className="text-green-600">Free</span> : fmt(shipping)}</span></div>
              <div className="flex justify-between"><span className="text-brand-grey">GST (5%)</span><span>{fmt(tax)}</span></div>
              <div className="border-t border-neutral-100 pt-3 flex justify-between font-bold text-base">
                <span>Total</span><span className="text-brand-gold">{fmt(total)}</span>
              </div>
            </div>

            {/* Coupon Code Input on Checkout */}
            <div className="mt-4 pt-4 border-t border-neutral-100">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 p-2.5 rounded text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-green-700">
                    <Tag size={14} />
                    <span>Coupon <strong>{appliedCoupon.code}</strong> Applied</span>
                  </div>
                  <button onClick={handleRemoveCheckoutCoupon} className="text-red-500 hover:underline font-semibold text-[11px]">Remove</button>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={couponCodeInput}
                    onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                    placeholder="Coupon code"
                    className="flex-1 border border-neutral-200 rounded px-2.5 py-1.5 text-xs uppercase font-mono focus:outline-none focus:border-brand-gold"
                  />
                  <button
                    type="button"
                    disabled={validatingCoupon || !couponCodeInput.trim()}
                    onClick={handleApplyCheckoutCoupon}
                    className="bg-neutral-900 text-white text-xs px-3 py-1.5 rounded font-medium hover:bg-neutral-700 transition-colors disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Delivery estimate in sidebar */}
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-brand-text mb-1">
                <Package size={13} className="text-brand-gold" />
                Estimated Delivery
              </div>
              <p className="text-xs text-brand-grey font-medium">{getEstimatedDeliveryRange(billingAddress.pincode)}</p>
            </div>

          </div>
        </div>
      </div>

      {/* ── OTP Fraud-Check Modal ── */}
      <AnimatePresence>
        {otpSent && !isVerified && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-6 rounded-xl max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-5 bg-brand-gold rounded-full"></span>
                <h3 className="font-playfair text-lg font-bold text-brand-text">🔒 Security Verification</h3>
              </div>
              <p className="text-xs text-brand-grey leading-relaxed">
                For security reasons, high-value orders (exceeding {currencyCode === 'AED' ? `AED ${otpSettings.aedThreshold}` : `₹${otpSettings.inrThreshold.toLocaleString('en-IN')}`}) and Cash on Delivery (COD) orders require email verification. We've sent a 6-digit code to <strong className="text-brand-text font-semibold">{billingAddress.email || customer?.email}</strong>.
              </p>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider" htmlFor="fraud-otp">
                    Enter 6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={handleTriggerFraudCheck}
                    disabled={otpLoading}
                    className="text-xs text-brand-gold hover:underline font-semibold"
                    id="resend-fraud-otp"
                  >
                    {otpLoading ? 'Resending…' : 'Resend Email'}
                  </button>
                </div>
                <input
                  id="fraud-otp" type="text" value={otp}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtp(val);
                    if (val.length === 6) { handleVerifyFraudOtp(val); }
                  }}
                  placeholder="0  0  0  0  0  0" maxLength={6}
                  disabled={verifyingOtp}
                  className="w-full border border-neutral-200 rounded-md px-4 py-3 text-center text-xl font-mono tracking-[0.5em] focus:outline-none focus:border-brand-gold bg-neutral-50"
                  aria-label="OTP Code"
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button onClick={() => setOtpSent(false)} disabled={verifyingOtp} className="btn-outline flex-1 py-3 text-sm font-semibold">Cancel</button>
                <button
                  onClick={() => handleVerifyFraudOtp()}
                  disabled={verifyingOtp || otp.length < 6}
                  className="btn-primary flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  {verifyingOtp ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Confirm & Place Order'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      <Footer />
    </main>
  );
};

export default CheckoutPage;