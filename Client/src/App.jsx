import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import QuickViewModal from './components/QuickViewModal';
import HomePage from './pages/HomePage';
import ProductListingPage from './pages/ProductListingPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import AccountPage from './pages/AccountPage';
import NotFoundPage from './pages/NotFoundPage';
import api from './services/api';

const App = () => {
  const location = useLocation();

  useEffect(() => {
    let scrollTimeout;
    const handleScroll = () => {
      if (!document.body.classList.contains('disable-hover')) {
        document.body.classList.add('disable-hover');
      }
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        document.body.classList.remove('disable-hover');
      }, 150); // 150ms debounce
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refCode = params.get('referral') || params.get('ref');
    if (refCode) {
      const sanitized = refCode.trim();
      localStorage.setItem('bb_referral', sanitized);
      // Track click on the backend
      api.get(`/affiliates/track?ref=${encodeURIComponent(sanitized)}`)
        .then(res => {
          console.log('[Referral] Tracked click successfully:', res.data);
        })
        .catch(err => {
          console.warn('[Referral] Failed to track click:', err.response?.data?.message || err.message);
        });
    }
  }, [location.search]);

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <CartDrawer />
      <QuickViewModal />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontFamily: 'Inter, sans-serif', fontSize: 14, borderRadius: 0, border: '1px solid #F0EEE8' },
          success: { iconTheme: { primary: '#C9A24B', secondary: 'white' } },
        }}
      />
      {/* Page fade transitions — Framer Motion */}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductListingPage />} />
          <Route path="/category/:slug" element={<ProductListingPage />} />
          <Route path="/category/:slug/:sub" element={<ProductListingPage />} />
          <Route path="/category/:slug/:sub/:subsub" element={<ProductListingPage />} />
          <Route path="/products/:slug" element={<ProductDetailsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
    </>
  );
};

export default App;
