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
import {
  fetchAutocomplete,
  fetchTrending,
  trackSearch,
  setQuery,
  setDropdownOpen,
  clearSearch
} from '../redux/slices/searchSlice';
import { formatPrice } from '../utils/currency';
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
  const { code: currencyCode, rate: currencyRate } = useSelector(s => s.currency);
  const {
    query: searchQueryState,
    suggestions: autocompleteSuggestions,
    products: autocompleteProducts,
    trending: trendingSearches,
    loading: searchLoadingState,
    isDropdownOpen: searchDropdownOpenState
  } = useSelector(s => s.search);

  const [scrolled, setScrolled] = useState(false);
  const [localQuery, setLocalQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
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
        dispatch(setDropdownOpen(false));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dispatch]);

  const fetchSuggestions = useCallback((q) => {
    if (!q || q.trim().length < 1) {
      dispatch(clearSearch());
      return;
    }
    dispatch(fetchAutocomplete(q.trim()));
  }, [dispatch]);

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setLocalQuery(val);
    dispatch(setQuery(val));
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 300);
  };

  const handleSearchFocus = () => {
    dispatch(setDropdownOpen(true));
    if (localQuery.trim().length === 0) {
      dispatch(fetchTrending());
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const q = localQuery.trim();
    if (!q) return;
    dispatch(setDropdownOpen(false));
    dispatch(trackSearch(q));
    navigate(`/products?search=${encodeURIComponent(q)}`);
  };

  const handleKeywordClick = (kw) => {
    setLocalQuery(kw);
    dispatch(setQuery(kw));
    dispatch(setDropdownOpen(false));
    dispatch(trackSearch(kw));
    navigate(`/products?search=${encodeURIComponent(kw)}`);
  };

  const handleSuggestionClick = (product) => {
    dispatch(setDropdownOpen(false));
    setLocalQuery('');
    dispatch(clearSearch());
    navigate(`/products/${product.slug}`);
  };

  const handleKeyDown = (e) => {
    if (!searchDropdownOpenState) return;

    const list = localQuery.trim().length === 0 ? trendingSearches : autocompleteSuggestions;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1 < list.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 >= 0 ? prev - 1 : list.length - 1));
    } else if (e.key === 'Escape') {
      dispatch(setDropdownOpen(false));
      setActiveIndex(-1);
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < list.length) {
        e.preventDefault();
        handleKeywordClick(list[activeIndex]);
        setActiveIndex(-1);
      }
    }
  };

  const highlightMatch = (text, highlight) => {
    if (!highlight) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <strong key={i} className="font-extrabold text-brand-text">{part}</strong>
          ) : (
            <span key={i} className="text-brand-grey">{part}</span>
          )
        )}
      </span>
    );
  };

  const renderDropdown = () => {
    const list = localQuery.trim().length === 0 ? (trendingSearches.length ? trendingSearches : TRENDING_KEYWORDS) : autocompleteSuggestions;
    return (
      <AnimatePresence>
        {searchDropdownOpenState && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 right-0 bg-white border border-brand-light shadow-lg mt-1 z-50 max-h-96 overflow-y-auto rounded-lg"
            role="listbox"
            aria-label="Search suggestions"
          >
            {/* Trending searches */}
            {localQuery.trim().length === 0 && (
              <div className="p-4">
                <p className="text-[10px] font-bold text-brand-grey uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <TrendingUp size={12} className="text-brand-gold" /> Trending Searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {list.map((kw, i) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => handleKeywordClick(kw)}
                      className={`text-xs px-3 py-1.5 transition-all border rounded-full ${
                        activeIndex === i
                          ? 'bg-brand-gold border-brand-gold text-white font-semibold shadow-sm'
                          : 'bg-brand-light/50 text-brand-grey hover:text-brand-gold border-brand-light hover:border-brand-gold'
                      }`}
                      id={`trending-kw-${i}`}
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Keyword Suggestions */}
            {localQuery.trim().length > 0 && autocompleteSuggestions.length > 0 && (
              <div className="border-b border-brand-light/50 py-2">
                <p className="px-4 py-1.5 text-[10px] font-bold text-brand-grey uppercase tracking-wider">Suggested Keywords</p>
                {autocompleteSuggestions.map((kw, i) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => handleKeywordClick(kw)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                      activeIndex === i
                        ? 'bg-brand-light text-brand-gold font-medium'
                        : 'hover:bg-brand-light/50 text-brand-text'
                    }`}
                    id={`suggest-kw-${i}`}
                  >
                    <span>{highlightMatch(kw, localQuery)}</span>
                    <ArrowRight size={12} className="text-brand-grey/50" />
                  </button>
                ))}
              </div>
            )}

            {/* Product Previews */}
            {localQuery.trim().length > 0 && autocompleteProducts.length > 0 && (
              <div className="py-2">
                <p className="px-4 py-1.5 text-[10px] font-bold text-brand-grey uppercase tracking-wider">Product Matches</p>
                {autocompleteProducts.map(product => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSuggestionClick(product)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-brand-light/50 transition-colors text-left"
                  >
                    <div className="w-10 h-12 bg-brand-light flex-shrink-0 overflow-hidden border border-brand-light rounded">
                      {product.image && (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-brand-text truncate">{product.name}</p>
                      <p className="text-xs text-brand-gold font-semibold mt-0.5">
                        {formatPrice(product.price, currencyCode, currencyRate)}
                        {product.comparePrice > product.price && (
                          <span className="text-brand-grey text-[10px] line-through ml-2 font-normal">
                            {formatPrice(product.comparePrice, currencyCode, currencyRate)}
                          </span>
                        )}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-brand-grey flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* No matches */}
            {localQuery.trim().length > 0 && autocompleteSuggestions.length === 0 && autocompleteProducts.length === 0 && !searchLoadingState && (
              <div className="p-6 text-center text-brand-grey text-sm">
                No matches found for "{localQuery}"
              </div>
            )}

            {/* Submit full search */}
            {localQuery.trim().length > 0 && (
              <button
                type="button"
                onClick={() => handleSearchSubmit()}
                className="w-full text-center py-3 text-xs font-semibold text-brand-gold border-t border-brand-light hover:bg-brand-light/50 transition-colors uppercase tracking-wider"
              >
                View all results for "{localQuery.trim()}"
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const cartCount = items.reduce((s, i) => s + i.quantity, 0);
  const isEmpty = localQuery.trim().length === 0;

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
                  value={localQuery}
                  onChange={handleSearchInput}
                  onFocus={handleSearchFocus}
                  onKeyDown={handleKeyDown}
                  placeholder="Search luxury..."
                  className="w-full border border-brand-light bg-brand-bg px-4 py-2 pr-20 text-sm focus:outline-none focus:border-brand-gold transition-colors font-inter"
                  aria-label="Search products"
                  id="nav-search-input-desktop"
                  autoComplete="off"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {searchLoadingState && (
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

              {renderDropdown()}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <div className="mr-3 flex items-center">
                <button
                  type="button"
                  onClick={() => dispatch(setCurrency(currencyCode === 'INR' ? 'AED' : 'INR'))}
                  className="flex items-center bg-neutral-100/90 hover:bg-neutral-200/60 border border-neutral-200/80 rounded-full p-[3px] relative cursor-pointer focus-visible:outline-brand-gold transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] h-[32px] w-[86px]"
                  aria-label={`Switch currency from ${currencyCode}`}
                  id="nav-currency-toggle-desktop"
                >
                  <motion.div
                    className="absolute bg-gradient-to-r from-amber-500 via-brand-gold to-amber-600 rounded-full shadow-[0_2px_5px_rgba(217,119,6,0.3)]"
                    animate={{
                      left: currencyCode === 'INR' ? '3px' : '43px',
                    }}
                    style={{
                      width: '40px',
                      height: '26px',
                      top: '3px',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                  <span className={`relative z-10 text-[10px] font-bold tracking-widest w-[40px] text-center uppercase transition-all duration-300 ${currencyCode === 'INR' ? 'text-white scale-105' : 'text-brand-grey hover:text-brand-text scale-95 opacity-80'}`}>
                    INR
                  </span>
                  <span className={`relative z-10 text-[10px] font-bold tracking-widest w-[40px] text-center uppercase transition-all duration-300 ${currencyCode === 'AED' ? 'text-white scale-105' : 'text-brand-grey hover:text-brand-text scale-95 opacity-80'}`}>
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
                    className="flex items-center bg-neutral-100/90 border border-neutral-200/80 rounded-full p-[2px] relative cursor-pointer focus-visible:outline-brand-gold shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] h-[26px] w-[68px]"
                    aria-label={`Switch currency from ${currencyCode}`}
                    id="nav-currency-toggle-mobile"
                  >
                    <motion.div
                      className="absolute bg-gradient-to-r from-amber-500 via-brand-gold to-amber-600 rounded-full shadow-[0_2px_4px_rgba(217,119,6,0.25)]"
                      animate={{
                        left: currencyCode === 'INR' ? '2px' : '34px',
                      }}
                      style={{
                        width: '32px',
                        height: '20px',
                        top: '2px',
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                    <span className={`relative z-10 text-[9px] font-bold tracking-widest w-[32px] text-center uppercase transition-all duration-300 ${currencyCode === 'INR' ? 'text-white scale-105' : 'text-brand-grey hover:text-brand-text scale-95 opacity-80'}`}>
                      INR
                    </span>
                    <span className={`relative z-10 text-[9px] font-bold tracking-widest w-[32px] text-center uppercase transition-all duration-300 ${currencyCode === 'AED' ? 'text-white scale-105' : 'text-brand-grey hover:text-brand-text scale-95 opacity-80'}`}>
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
                  value={localQuery}
                  onChange={handleSearchInput}
                  onFocus={handleSearchFocus}
                  onKeyDown={handleKeyDown}
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

              {renderDropdown()}

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
