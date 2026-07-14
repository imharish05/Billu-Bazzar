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
import AccountLayout from './pages/account/AccountLayout';
import ProfilePage from './pages/account/ProfilePage';
import OrdersPage from './pages/account/OrdersPage';
import OrderDetailPage from './pages/account/OrderDetailPage';
import WishlistPage from './pages/account/WishlistPage';
import LoyaltyPage from './pages/account/LoyaltyPage';
import PersonalShopperPage from './pages/account/PersonalShopperPage';
import SupportPage from './pages/account/SupportPage';
import NotFoundPage from './pages/NotFoundPage';
import LoaderPreviewPage from './pages/LoaderPreviewPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import ShippingPage from './pages/ShippingPage';
import CancellationPage from './pages/CancellationPage';
import ReturnsPage from './pages/ReturnsPage';
import api from './services/api';

const App = () => {
  const location = useLocation();

  useEffect(() => {
    let scrollTimeout;
    let ticking = false;
    // rAF-throttled to match Navbar's scroll listener — this used to run its
    // classList work on every single 'scroll' event (which can fire dozens
    // of times per frame), doubling up on layout work alongside Navbar's own
    // handler and contributing to the scroll "lag".
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        if (!document.body.classList.contains('disable-hover')) {
          document.body.classList.add('disable-hover');
        }
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          document.body.classList.remove('disable-hover');
        }, 150); // 150ms debounce
        ticking = false;
      });
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
          <Route path="/loader-preview" element={<LoaderPreviewPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/shipping" element={<ShippingPage />} />
          <Route path="/cancellation" element={<CancellationPage />} />
          <Route path="/returns" element={<ReturnsPage />} />
          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<ProfilePage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="loyalty" element={<LoyaltyPage />} />
            <Route path="personal-shopper" element={<PersonalShopperPage />} />
            <Route path="support" element={<SupportPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
    </>
  );
};

export default App;