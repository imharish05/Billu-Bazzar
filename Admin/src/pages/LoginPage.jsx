import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { loginAdmin, clearError } from '../redux/slices/authSlice';
import Logo from '../components/Logo';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(s => s.auth);
  const [form, setForm] = useState({ email: 'admin@billubazaar.com', password: 'Admin@123' });
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(loginAdmin(form));
    if (loginAdmin.fulfilled.match(result)) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: brand image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1000"
          alt="Billu Bazaar luxury fashion"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70 flex flex-col items-center justify-center p-12">
          <Logo size="lg" className="text-white mb-6" />
          <p className="text-white/70 text-center text-lg font-light max-w-sm leading-relaxed">
            "Where heritage meets modernity — India's finest luxury fashion curated with love."
          </p>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex-1 flex items-center justify-center bg-white px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden mb-8 text-center">
            <Logo size="lg" />
          </div>

          <div className="mb-8">
            <h1 className="font-playfair text-3xl font-bold text-brand-text mb-1">Welcome back</h1>
            <p className="text-brand-grey text-sm">Sign in to the admin panel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="admin-email">Email Address</label>
              <input
                id="admin-email"
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full border border-brand-light px-3 py-3 text-sm focus:outline-none focus:border-brand-gold transition-colors"
                placeholder="admin@billubazaar.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="admin-password">Password</label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full border border-brand-light px-3 py-3 pr-10 text-sm focus:outline-none focus:border-brand-gold transition-colors"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-grey hover:text-brand-gold transition-colors focus-visible:outline-brand-gold"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-red-500 text-xs bg-red-50 px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
              id="admin-login-submit"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Lock size={15} /> Sign In to Admin</>
              )}
            </button>
          </form>

          <div className="mt-6 p-3 bg-brand-light text-xs text-brand-grey">
            <p className="font-medium text-brand-text mb-1">Demo Credentials</p>
            <p>Email: admin@billubazaar.com</p>
            <p>Password: Admin@123</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
