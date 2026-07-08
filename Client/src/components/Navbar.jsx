import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingBag, Heart, Search, Menu, X, User, ArrowRight, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import { toggleCart } from '../redux/slices/cartSlice';
import { toggleMobileMenu, closeMobileMenu } from '../redux/slices/uiSlice';
import { logout } from '../redux/slices/authSlice';
import { setCurrency } from '../redux/slices/currencySlice';
import api from '../services/api';

/* Glass surface 1: Navbar — rgba(250,250,248,0.72) + blur(12px) + 1px border */
const navLinks = [
  { label: 'New Arrivals', to: '/products?newArrival=true' },
  { label: 'Party Wear', to: '/products?category=party-wear' },
  { label: 'Jewelry', to: '/products?category=jewelry' },
  { label: 'Perfumes', to: '/products?category=perfumes' },
  { label: 'Accessories', to: '/products?category=accessories' },
  { label: 'Sale', to: '/products?sale=true', highlight: true },
];

const TRENDING_KEYWORDS = ['bridal lehenga', 'party wear', 'gold jewelry', 'designer saree', 'perfume gift set'];

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items } = useSelector(s => s.cart);
  const { isAuthenticated, customer } = useSelector(s => s.auth);
  const { mobileMenuOpen } = useSelector(s => s.ui);
  const { code: currencyCode } = useSelector(s => s.currency);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (q) => {
    if (!q || q.trim().length < 1) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }
    setSearchLoading(true);
    try {
      // TODO: Replace with Typesense-backed search when wired
      const res = await api.get('/products/search', { params: { q: q.trim() } });
      setSuggestions(res.data.products || []);
      setSuggestionsOpen(true);
    } catch {
      setSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchSuggestions(val), 250);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSuggestionsOpen(false);
    navigate(`/products?search=${encodeURIComponent(q)}`);
  };

  const handleSuggestionClick = (product) => {
    setSuggestionsOpen(false);
    setSearchQuery('');
    navigate(`/products/${product.slug}`);
  };

  const cartCount = items.reduce((s, i) => s + i.quantity, 0);
  const isEmpty = searchQuery.trim().length === 0;

  return (
    <>
      <header
        className={`glass-nav fixed top-0 left-0 right-0 z-50 transition-shadow duration-300 ${scrolled ? 'shadow-md' : ''}`}
        role="banner"
      >
        {/* Announcement bar */}
        <div className="bg-brand-text text-brand-white text-center py-2 text-caption font-inter tracking-widest uppercase text-xs">
          Free shipping on orders above ₹1499 · Use code <span className="text-gold font-semibold">WELCOME20</span> for 20% off
        </div>

        <nav className="max-w-site mx-auto px-4 md:px-8" aria-label="Main navigation">
          {/* Desktop layout */}
          <div className="hidden lg:flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" aria-label="Billu Bazaar — Home" className="flex-shrink-0">
              <Logo size="md" />
            </Link>

            {/* Search bar — centered */}
            <div ref={searchRef} className="relative flex-1 max-w-md mx-8">
              <form onSubmit={handleSearchSubmit} role="search" className="relative">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={handleSearchInput}
                  onFocus={() => { if (suggestions.length || searchQuery.trim()) setSuggestionsOpen(true); }}
                  placeholder="Search luxury..."
                  className="w-full border border-brand-light bg-brand-bg px-4 py-2 pr-20 text-sm focus:outline-none focus:border-brand-gold transition-colors font-inter"
                  aria-label="Search products"
                  id="nav-search-input-desktop"
                  autoComplete="off"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {searchLoading && (
                    <div className="w-4 h-4 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
                  )}
                  <button
                    type="submit"
                    disabled={isEmpty}
                    className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                      isEmpty
                        ? 'bg-brand-light text-brand-grey cursor-not-allowed'
                        : 'bg-brand-text text-white hover:bg-brand-gold'
                    }`}
                    id="nav-search-btn-desktop"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Predictive suggestions dropdown */}
              <AnimatePresence>
                {suggestionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-0 right-0 bg-white border border-brand-light shadow-lg mt-1 z-50 max-h-80 overflow-y-auto"
                  >
                    {/* Trending keywords */}
                    {suggestions.length === 0 && !searchLoading && (
                      <div className="p-3">
                        <p className="text-[10px] font-bold text-brand-grey uppercase tracking-wider mb-2 flex items-center gap-1">
                          <TrendingUp size={12} /> Trending
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {TRENDING_KEYWORDS.map(kw => (
                            <button
                              key={kw}
                              type="button"
                              onClick={() => { setSearchQuery(kw); setSuggestionsOpen(false); navigate(`/products?search=${encodeURIComponent(kw)}`); }}
                              className="text-xs text-brand-grey hover:text-brand-gold border border-brand-light px-2.5 py-1 transition-colors"
                            >
                              {kw}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Product suggestions */}
                    {suggestions.length > 0 && (
                      <div>
                        <p className="px-3 pt-3 pb-1 text-[10px] font-bold text-brand-grey uppercase tracking-wider">Products</p>
                        {suggestions.map(product => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleSuggestionClick(product)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-brand-light transition-colors text-left"
                          >
                            <div className="w-10 h-12 bg-brand-light flex-shrink-0 overflow-hidden">
                              {product.images?.[0] && (
                                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-brand-text truncate">{product.name}</p>
                              <p className="text-xs text-brand-gold font-semibold">
                                ₹{Number(product.price).toLocaleString('en-IN')}
                                {product.discountPercent > 0 && (
                                  <span className="text-red-400 ml-1">-{product.discountPercent}%</span>
                                )}
                              </p>
                            </div>
                            <ArrowRight size={14} className="text-brand-grey flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* View all results */}
                    {searchQuery.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={() => { setSuggestionsOpen(false); navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`); }}
                        className="w-full text-center py-2 text-xs font-medium text-brand-gold border-t border-brand-light hover:bg-brand-light transition-colors"
                      >
                        View all results for "{searchQuery.trim()}"
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <div className="mr-3 flex items-center">
                <button
                  type="button"
                  onClick={() => dispatch(setCurrency(currencyCode === 'INR' ? 'AED' : 'INR'))}
                  className="flex items-center bg-brand-light/70 border border-brand-light rounded-full p-[3px] relative cursor-pointer focus-visible:outline-brand-gold h-[26px] w-[76px]"
                  aria-label={`Switch currency from ${currencyCode}`}
                  id="nav-currency-toggle-desktop"
                >
                  <motion.div
                    className="absolute bg-brand-gold rounded-full"
                    animate={{
                      left: currencyCode === 'INR' ? '3px' : '39px',
                    }}
                    style={{
                      width: '34px',
                      height: '18px',
                      top: '3px',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                  <span className={`relative z-10 text-[9px] font-bold tracking-wider w-[34px] text-center uppercase transition-colors duration-200 ${currencyCode === 'INR' ? 'text-white font-extrabold' : 'text-brand-grey hover:text-brand-text'}`}>
                    INR
                  </span>
                  <span className={`relative z-10 text-[9px] font-bold tracking-wider w-[34px] text-center uppercase transition-colors duration-200 ${currencyCode === 'AED' ? 'text-white font-extrabold' : 'text-brand-grey hover:text-brand-text'}`}>
                    AED
                  </span>
                </button>
              </div>
              <Link to="/account?tab=wishlist" className="p-2 hover:text-brand-gold transition-colors rounded-full focus-visible:outline-2 focus-visible:outline-brand-gold" aria-label="Wishlist" id="nav-wishlist-btn">
                <Heart size={20} strokeWidth={1.5} />
              </Link>
              {isAuthenticated ? (
                <div className="relative group">
                  <button className="p-2 hover:text-brand-gold transition-colors rounded-full focus-visible:outline-2 focus-visible:outline-brand-gold" aria-label="Account menu" id="nav-account-btn">
                    <User size={20} strokeWidth={1.5} />
                  </button>
                  <div className="absolute right-0 top-10 w-48 bg-white shadow-lg border border-brand-light opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50">
                    <div className="px-4 py-3 border-b border-brand-light">
                      <p className="font-medium text-sm truncate">{customer?.name}</p>
                    </div>
                    <Link to="/account" className="block px-4 py-2 text-sm hover:bg-brand-light transition-colors">My Account</Link>
                    <Link to="/account?tab=orders" className="block px-4 py-2 text-sm hover:bg-brand-light transition-colors">My Orders</Link>
                    <button onClick={() => { dispatch(logout()); navigate('/'); }} className="w-full text-left px-4 py-2 text-sm hover:bg-brand-light transition-colors text-red-500">Sign Out</button>
                  </div>
                </div>
              ) : (
                <Link to="/account" className="p-2 hover:text-brand-gold transition-colors rounded-full focus-visible:outline-2 focus-visible:outline-brand-gold" aria-label="Sign in">
                  <User size={20} strokeWidth={1.5} />
                </Link>
              )}
              <button onClick={() => dispatch(toggleCart())} className="relative p-2 hover:text-brand-gold transition-colors rounded-full focus-visible:outline-2 focus-visible:outline-brand-gold" aria-label={`Shopping cart — ${cartCount} items`} id="nav-cart-btn">
                <ShoppingBag size={20} strokeWidth={1.5} />
                {cartCount > 0 && (
                  <motion.span key={cartCount} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-brand-gold text-white text-xs font-bold rounded-full flex items-center justify-center"
                  >{cartCount}</motion.span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile / Tablet layout */}
          <div className="lg:hidden">
            {/* Top row: logo + actions */}
            <div className="flex items-center justify-between h-14">
              <Link to="/" aria-label="Billu Bazaar — Home">
                <Logo size="sm" />
              </Link>
              <div className="flex items-center gap-1">
                <div className="mr-1 flex items-center">
                  <button
                    type="button"
                    onClick={() => dispatch(setCurrency(currencyCode === 'INR' ? 'AED' : 'INR'))}
                    className="flex items-center bg-brand-light/70 border border-brand-light rounded-full p-[2px] relative cursor-pointer focus-visible:outline-brand-gold h-[22px] w-[64px]"
                    aria-label={`Switch currency from ${currencyCode}`}
                    id="nav-currency-toggle-mobile"
                  >
                    <motion.div
                      className="absolute bg-brand-gold rounded-full"
                      animate={{
                        left: currencyCode === 'INR' ? '2px' : '32px',
                      }}
                      style={{
                        width: '28px',
                        height: '16px',
                        top: '2px',
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                    <span className={`relative z-10 text-[8px] font-bold tracking-wider w-[28px] text-center uppercase transition-colors duration-200 ${currencyCode === 'INR' ? 'text-white font-extrabold' : 'text-brand-grey hover:text-brand-text'}`}>
                      INR
                    </span>
                    <span className={`relative z-10 text-[8px] font-bold tracking-wider w-[28px] text-center uppercase transition-colors duration-200 ${currencyCode === 'AED' ? 'text-white font-extrabold' : 'text-brand-grey hover:text-brand-text'}`}>
                      AED
                    </span>
                  </button>
                </div>
                <Link to="/account?tab=wishlist" className="p-2 hover:text-brand-gold transition-colors" aria-label="Wishlist">
                  <Heart size={18} strokeWidth={1.5} />
                </Link>
                <button onClick={() => dispatch(toggleCart())} className="relative p-2 hover:text-brand-gold transition-colors" aria-label={`Shopping cart — ${cartCount} items`}>
                  <ShoppingBag size={18} strokeWidth={1.5} />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-gold text-white text-[10px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>
                  )}
                </button>
                <button onClick={() => dispatch(toggleMobileMenu())} className="p-2 hover:text-brand-gold transition-colors" aria-label="Toggle mobile menu" aria-expanded={mobileMenuOpen} id="nav-mobile-menu-btn">
                  {mobileMenuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
                </button>
              </div>
            </div>
            {/* Search row — always visible under the top row on mobile */}
            <div ref={searchRef} className="relative pb-3 px-0">
              <form onSubmit={handleSearchSubmit} role="search" className="relative">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={handleSearchInput}
                  onFocus={() => { if (suggestions.length || searchQuery.trim()) setSuggestionsOpen(true); }}
                  placeholder="Search luxury..."
                  className="w-full border border-brand-light bg-brand-bg px-3 py-2 pr-16 text-xs focus:outline-none focus:border-brand-gold transition-colors font-inter"
                  aria-label="Search products"
                  id="nav-search-input-mobile"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={isEmpty}
                  className={`absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                    isEmpty
                      ? 'bg-brand-light text-brand-grey cursor-not-allowed'
                      : 'bg-brand-text text-white hover:bg-brand-gold'
                  }`}
                  id="nav-search-btn-mobile"
                >
                  Go
                </button>
              </form>

              {/* Mobile predictive dropdown */}
              <AnimatePresence>
                {suggestionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-0 right-0 bg-white border border-brand-light shadow-lg mt-0 z-50 max-h-72 overflow-y-auto"
                  >
                    {suggestions.length === 0 && !searchLoading && (
                      <div className="p-3">
                        <p className="text-[10px] font-bold text-brand-grey uppercase tracking-wider mb-2 flex items-center gap-1"><TrendingUp size={12} /> Trending</p>
                        <div className="flex flex-wrap gap-2">
                          {TRENDING_KEYWORDS.map(kw => (
                            <button key={kw} type="button" onClick={() => { setSearchQuery(kw); setSuggestionsOpen(false); navigate(`/products?search=${encodeURIComponent(kw)}`); }}
                              className="text-xs text-brand-grey hover:text-brand-gold border border-brand-light px-2 py-0.5 transition-colors">{kw}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    {suggestions.length > 0 && (
                      <div>
                        {suggestions.map(product => (
                          <button key={product.id} type="button" onClick={() => handleSuggestionClick(product)}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-brand-light transition-colors text-left">
                            <div className="w-8 h-10 bg-brand-light flex-shrink-0 overflow-hidden">
                              {product.images?.[0] && <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-brand-text truncate">{product.name}</p>
                              <p className="text-[10px] text-brand-gold font-semibold">₹{Number(product.price).toLocaleString('en-IN')}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </nav>

        {/* Desktop nav links — below header row */}
        <div className="hidden lg:block border-t border-brand-light/50">
          <div className="max-w-site mx-auto px-8">
            <ul className="flex items-center justify-center gap-10 h-10" role="list">
              {navLinks.map(link => (
                <li key={link.to}>
                  <Link to={link.to}
                    className={`font-inter text-[11px] font-medium tracking-widest uppercase transition-colors duration-200 hover:text-brand-gold focus-visible:outline-2 focus-visible:outline-brand-gold ${link.highlight ? 'text-brand-gold' : 'text-brand-text'}`}
                  >{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
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
            <button onClick={() => dispatch(closeMobileMenu())} className="absolute top-4 right-4 p-2 focus-visible:outline-brand-gold" aria-label="Close menu"><X size={24} /></button>
            <ul className="flex flex-col gap-6 mt-8">
              {navLinks.map(link => (
                <li key={link.to}>
                  <Link to={link.to} onClick={() => dispatch(closeMobileMenu())}
                    className={`font-playfair text-2xl font-semibold ${link.highlight ? 'text-brand-gold' : 'text-brand-text'}`}
                  >{link.label}</Link>
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
      <div className="h-[132px] lg:h-[136px]" aria-hidden="true" />
    </>
  );
};

export default Navbar;
