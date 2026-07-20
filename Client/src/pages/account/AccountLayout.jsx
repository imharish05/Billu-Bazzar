import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { User, Package, Heart, Star, Gift, Headphones, LogOut, Lock, Mail, Eye, EyeOff, Phone } from 'lucide-react';
import Footer from '../../components/Footer';
import { mockCustomer } from '../../data/mockAccountData';
import { loginCustomer, registerCustomer, logout, clearError } from '../../redux/slices/authSlice';
import toast from 'react-hot-toast';
import { validatePhoneNumber, validateEmail, validatePassword } from '../../utils/validation';

const NAV_ITEMS = [
  { to: '/account', label: 'Profile', icon: User, end: true },
  { to: '/account/orders', label: 'My Orders', icon: Package },
  { to: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/account/loyalty', label: 'Loyalty & Cashback', icon: Star },
  { to: '/account/personal-shopper', label: 'Personal Shopper', icon: Gift },
  { to: '/account/support', label: 'Support', icon: Headphones },
];

const AccountLayout = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, customer: authCustomer, loading, error } = useSelector(s => s.auth);

  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({});

  // Clear errors when toggling forms
  useEffect(() => {
    dispatch(clearError());
    setErrors({});
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
  }, [isRegister, dispatch]);

  const handleEmailChange = (val) => {
    setEmail(val);
    if (errors.email) {
      const v = validateEmail(val);
      setErrors(prev => ({ ...prev, email: v.isValid ? '' : v.message }));
    }
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    if (errors.password) {
      if (isRegister) {
        const v = validatePassword(val);
        setErrors(prev => ({ ...prev, password: v.isValid ? '' : v.message }));
      } else {
        setErrors(prev => ({ ...prev, password: val ? '' : 'Password is required.' }));
      }
    }
  };

  const handleNameChange = (val) => {
    setName(val);
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: val.trim() ? '' : 'Full name is required.' }));
    }
  };

  const handlePhoneChange = (val) => {
    setPhone(val);
    if (errors.phone) {
      const v = validatePhoneNumber(val);
      setErrors(prev => ({ ...prev, phone: v.isValid ? '' : v.message }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (isRegister) {
      if (!name.trim()) {
        newErrors.name = 'Full name is required.';
      }
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        newErrors.email = emailValidation.message;
      }
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.message;
      }
      const phoneValidation = validatePhoneNumber(phone);
      if (!phoneValidation.isValid) {
        newErrors.phone = phoneValidation.message;
      }
    } else {
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        newErrors.email = emailValidation.message;
      }
      if (!password) {
        newErrors.password = 'Password is required.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    if (isRegister) {
      const result = await dispatch(registerCustomer({ name, email, password, phone }));
      if (registerCustomer.fulfilled.match(result)) {
        toast.success(`Welcome to Billu Bazaar, ${result.payload.customer.name}!`);
      } else {
        toast.error(result.payload || 'Registration failed.');
      }
    } else {
      const result = await dispatch(loginCustomer({ email, password }));
      if (loginCustomer.fulfilled.match(result)) {
        toast.success(`Welcome back, ${result.payload.customer.name}!`);
      } else {
        toast.error(result.payload || 'Invalid email or password.');
      }
    }
  };

  const handleSignOut = () => {
    dispatch(logout());
    toast.success('Signed out successfully.');
  };

  const customer = authCustomer || mockCustomer;

  if (!isAuthenticated) {
    return (
      <main id="main-content" className="bg-[#FDFDFB] min-h-[85vh] flex items-center justify-center py-20 px-6">
        <div className="w-full max-w-md bg-white border border-neutral-100 p-8 md:p-10 shadow-sm rounded-xl">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-neutral-950 flex items-center justify-center mx-auto mb-4 text-brand-gold">
              <User size={24} strokeWidth={1.5} />
            </div>
            <h1 className="font-playfair text-2xl font-bold text-neutral-900">
              {isRegister ? 'Create an Account' : 'Welcome Back'}
            </h1>
            <p className="text-xs text-neutral-500 mt-2">
              {isRegister 
                ? 'Sign up to unlock rewards, wishlists, and personalized styling.' 
                : 'Access your orders, custom wishlist, and member cashbacks.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5" htmlFor="auth-name">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-neutral-400"><User size={16} /></span>
                    <input
                      id="auth-name"
                      type="text"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Enter your name"
                      className={`w-full border ${errors.name ? 'border-red-400 focus:border-red-500' : 'border-neutral-200/80 focus:border-brand-gold'} rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none bg-neutral-50/30 transition-colors`}
                    />
                  </div>
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5" htmlFor="auth-phone">Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-neutral-400"><Phone size={16} /></span>
                    <input
                      id="auth-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="e.g. +91 98765 43210 or +971 50 123 4567"
                      className={`w-full border ${errors.phone ? 'border-red-400 focus:border-red-500' : 'border-neutral-200/80 focus:border-brand-gold'} rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none bg-neutral-50/30 transition-colors`}
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5" htmlFor="auth-email">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-neutral-400"><Mail size={16} /></span>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="yourname@domain.com"
                  className={`w-full border ${errors.email ? 'border-red-400 focus:border-red-500' : 'border-neutral-200/80 focus:border-brand-gold'} rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none bg-neutral-50/30 transition-colors`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5" htmlFor="auth-password">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-neutral-400"><Lock size={16} /></span>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full border ${errors.password ? 'border-red-400 focus:border-red-500' : 'border-neutral-200/80 focus:border-brand-gold'} rounded-lg pl-10 pr-10 py-3 text-sm focus:outline-none bg-neutral-50/30 transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-neutral-400 hover:text-neutral-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-100">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 rounded-lg flex items-center justify-center font-semibold text-sm transition-transform active:scale-[0.98] mt-6"
              id="auth-submit-btn"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isRegister ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="text-center mt-6 pt-6 border-t border-neutral-100">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-brand-gold hover:underline font-semibold"
              id="auth-toggle-btn"
            >
              {isRegister ? 'Already have an account? Sign In' : 'New to Billu Bazaar? Create an Account'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content">
      <div className="max-w-site mx-auto px-6 md:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-60 flex-shrink-0">
            <div className="bg-white shadow-sm p-5 text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-brand-gold flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold text-xl">{customer.avatarInitial || customer.name?.[0]?.toUpperCase() || 'B'}</span>
              </div>
              <p className="font-medium">{customer.name}</p>
              <p className="text-xs text-brand-grey truncate">{customer.email}</p>
              <div className="mt-3 flex items-center justify-center gap-1">
                <Star size={12} className="fill-brand-gold text-brand-gold" />
                <span className="text-xs font-medium text-brand-gold">{customer.loyaltyPoints || 0} pts · {customer.loyaltyTier || 'BRONZE'}</span>
              </div>
            </div>

            <nav className="bg-white shadow-sm overflow-hidden">
              {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-4 py-3 text-sm text-left border-l-2 transition-all hover:bg-brand-light ${
                      isActive ? 'border-brand-gold text-brand-gold bg-brand-light/50' : 'border-transparent text-brand-grey'
                    }`
                  }
                  id={`account-nav-${label.toLowerCase().replace(/\s.*/, '')}`}
                >
                  <Icon size={16} strokeWidth={1.5} />
                  {label}
                </NavLink>
              ))}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left border-l-2 border-transparent text-red-400 hover:bg-red-50 transition-all"
                id="account-logout"
              >
                <LogOut size={16} strokeWidth={1.5} /> Sign Out
              </button>
            </nav>
          </aside>

          {/* Routed page content */}
          <div className="flex-1">
            <Outlet />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default AccountLayout;