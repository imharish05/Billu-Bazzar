import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingBag, Heart, Search, Menu, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import { toggleCart } from '../redux/slices/cartSlice';
import { toggleMobileMenu, closeMobileMenu, toggleSearch } from '../redux/slices/uiSlice';
import { logout } from '../redux/slices/authSlice';

/* Glass surface 1: Navbar — rgba(250,250,248,0.72) + blur(12px) + 1px border */
const navLinks = [
  { label: 'New Arrivals', to: '/products?newArrival=true' },
  { label: 'Party Wear', to: '/products?category=party-wear' },
  { label: 'Jewelry', to: '/products?category=jewelry' },
  { label: 'Perfumes', to: '/products?category=perfumes' },
  { label: 'Accessories', to: '/products?category=accessories' },
  { label: 'Sale', to: '/products?sale=true', highlight: true },
];

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items } = useSelector(s => s.cart);
  const { isAuthenticated, customer } = useSelector(s => s.auth);
  const { mobileMenuOpen } = useSelector(s => s.ui);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Elevate nav shadow on scroll
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <>
      {/* Glass surface 1: Navbar — sticky navigation with glassmorphism */}
      <header
        className={`glass-nav fixed top-0 left-0 right-0 z-50 transition-shadow duration-300 ${scrolled ? 'shadow-md' : ''}`}
        role="banner"
      >
        {/* Announcement bar */}
        <div className="bg-brand-text text-brand-white text-center py-2 text-caption font-inter tracking-widest uppercase text-xs">
          Free shipping on orders above ₹1499 · Use code <span className="text-gold font-semibold">WELCOME20</span> for 20% off
        </div>

        <nav className="max-w-site mx-auto px-4 md:px-8" aria-label="Main navigation">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" aria-label="Billu Bazaar — Home">
              <Logo size="md" />
            </Link>

            {/* Desktop nav links */}
            <ul className="hidden lg:flex items-center gap-8" role="list">
              {navLinks.map(link => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={`font-inter text-sm font-medium tracking-wide transition-colors duration-200 hover:text-brand-gold focus-visible:outline-2 focus-visible:outline-brand-gold ${link.highlight ? 'text-brand-gold' : 'text-brand-text'}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <button
                onClick={() => dispatch(toggleSearch())}
                className="p-2 hover:text-brand-gold transition-colors rounded-full focus-visible:outline-2 focus-visible:outline-brand-gold"
                aria-label="Search"
                id="nav-search-btn"
              >
                <Search size={20} strokeWidth={1.5} />
              </button>

              {/* Wishlist */}
              <Link
                to="/account?tab=wishlist"
                className="p-2 hover:text-brand-gold transition-colors rounded-full focus-visible:outline-2 focus-visible:outline-brand-gold"
                aria-label="Wishlist"
                id="nav-wishlist-btn"
              >
                <Heart size={20} strokeWidth={1.5} />
              </Link>

              {/* Account */}
              {isAuthenticated ? (
                <div className="relative group">
                  <button
                    className="p-2 hover:text-brand-gold transition-colors rounded-full focus-visible:outline-2 focus-visible:outline-brand-gold"
                    aria-label="Account menu"
                    id="nav-account-btn"
                  >
                    <User size={20} strokeWidth={1.5} />
                  </button>
                  {/* Dropdown */}
                  <div className="absolute right-0 top-10 w-48 bg-white shadow-lg border border-brand-light opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50">
                    <div className="px-4 py-3 border-b border-brand-light">
                      <p className="font-medium text-sm truncate">{customer?.name}</p>
                    </div>
                    <Link to="/account" className="block px-4 py-2 text-sm hover:bg-brand-light transition-colors">My Account</Link>
                    <Link to="/account?tab=orders" className="block px-4 py-2 text-sm hover:bg-brand-light transition-colors">My Orders</Link>
                    <button
                      onClick={() => { dispatch(logout()); navigate('/'); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-brand-light transition-colors text-red-500"
                    >Sign Out</button>
                  </div>
                </div>
              ) : (
                <Link
                  to="/account"
                  className="p-2 hover:text-brand-gold transition-colors rounded-full focus-visible:outline-2 focus-visible:outline-brand-gold"
                  aria-label="Sign in"
                >
                  <User size={20} strokeWidth={1.5} />
                </Link>
              )}

              {/* Cart */}
              <button
                onClick={() => dispatch(toggleCart())}
                className="relative p-2 hover:text-brand-gold transition-colors rounded-full focus-visible:outline-2 focus-visible:outline-brand-gold"
                aria-label={`Shopping cart — ${cartCount} items`}
                id="nav-cart-btn"
              >
                <ShoppingBag size={20} strokeWidth={1.5} />
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-brand-gold text-white text-xs font-bold rounded-full flex items-center justify-center"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => dispatch(toggleMobileMenu())}
                className="lg:hidden p-2 hover:text-brand-gold transition-colors focus-visible:outline-2 focus-visible:outline-brand-gold"
                aria-label="Toggle mobile menu"
                aria-expanded={mobileMenuOpen}
                id="nav-mobile-menu-btn"
              >
                {mobileMenuOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-0 z-40 bg-brand-bg pt-20 px-6"
            role="dialog" aria-label="Mobile menu" aria-modal="true"
          >
            <button
              onClick={() => dispatch(closeMobileMenu())}
              className="absolute top-4 right-4 p-2 focus-visible:outline-brand-gold"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
            <ul className="flex flex-col gap-6 mt-8">
              {navLinks.map(link => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    onClick={() => dispatch(closeMobileMenu())}
                    className={`font-playfair text-2xl font-semibold ${link.highlight ? 'text-brand-gold' : 'text-brand-text'}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-12 pt-8 border-t border-brand-light">
              <Link to="/account" onClick={() => dispatch(closeMobileMenu())} className="btn-primary w-full text-center block">
                {isAuthenticated ? 'My Account' : 'Sign In'}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for fixed nav height */}
      <div className="h-[104px]" aria-hidden="true" />
    </>
  );
};

export default Navbar;
