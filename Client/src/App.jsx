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

const App = () => {
  const location = useLocation();

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
