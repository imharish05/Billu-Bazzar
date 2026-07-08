import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Download, MessageCircle, MapPin } from 'lucide-react';
import Footer from '../components/Footer';
import currencyJs from 'currency.js';

const fmt = (v) => currencyJs(v, { symbol: '₹', precision: 0 }).format();

/* Mock tracking steps */
const trackingSteps = [
  { status: 'Order Placed', done: true, date: 'Today' },
  { status: 'Payment Confirmed', done: true, date: 'Today' },
  { status: 'Processing', done: false, date: 'Expected tomorrow' },
  { status: 'Shipped', done: false, date: 'In 2-3 days' },
  { status: 'Delivered', done: false, date: 'In 5-7 days' },
];

const OrderConfirmationPage = () => {
  const { current: order } = useSelector(s => s.orders);

  return (
    <main id="main-content">
      <div className="max-w-3xl mx-auto px-6 md:px-8 py-12">
        {/* Success header */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-green-500" strokeWidth={1.5} />
          </div>
          <h1 className="font-playfair text-4xl font-bold text-brand-text mb-2">Order Confirmed!</h1>
          <p className="text-brand-grey">Thank you for shopping at Billu Bazaar.</p>
          {order && (
            <p className="text-brand-gold font-semibold mt-2">Order #{order.orderNumber}</p>
          )}
        </motion.div>

        {/* Order details grid */}
        {order && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white shadow-sm p-5">
              <h2 className="font-medium mb-3 flex items-center gap-2"><Package size={16} className="text-brand-gold" /> Order Details</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-brand-grey">Order Total</span><span className="font-semibold text-brand-gold">{fmt(order.totalAmount)}</span></div>
                <div className="flex justify-between"><span className="text-brand-grey">Payment</span><span>{order.paymentMethod}</span></div>
                <div className="flex justify-between"><span className="text-brand-grey">Items</span><span>{order.items?.length || 0}</span></div>
              </div>
            </div>
            <div className="bg-white shadow-sm p-5">
              <h2 className="font-medium mb-3 flex items-center gap-2"><MapPin size={16} className="text-brand-gold" /> Shipping To</h2>
              <p className="text-sm text-brand-grey">{order.shippingAddress?.line1}</p>
              <p className="text-sm text-brand-grey">{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
              <p className="text-sm text-brand-grey">{order.shippingAddress?.pincode}</p>
            </div>
          </div>
        )}

        {/* Order Tracking */}
        <div className="bg-white shadow-sm p-6 mb-6">
          <h2 className="font-playfair text-lg font-semibold mb-6">Order Tracking</h2>
          <div className="relative">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-brand-light" aria-hidden="true" />
            <div className="space-y-6">
              {trackingSteps.map((step, i) => (
                <motion.div
                  key={step.status}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="flex items-start gap-4 relative"
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-brand-gold border-brand-gold' : 'bg-white border-brand-light'}`}>
                    {step.done && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p className={`font-medium text-sm ${step.done ? 'text-brand-text' : 'text-brand-grey'}`}>{step.status}</p>
                    <p className="text-xs text-brand-grey">{step.date}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Mock tracking map placeholder */}
        <div className="bg-brand-light h-48 flex items-center justify-center mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 opacity-50" />
          <div className="relative text-center">
            <MapPin size={32} className="text-brand-gold mx-auto mb-2" />
            <p className="text-sm text-brand-grey">Live tracking available once shipped</p>
            <p className="text-xs text-brand-grey">(Powered by Shiprocket + Mapbox)</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="btn-outline flex items-center justify-center gap-2 flex-1" id="download-invoice">
            <Download size={16} /> Download Invoice
          </button>
          <button
            className="btn-outline flex items-center justify-center gap-2 flex-1 border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
            id="whatsapp-updates"
          >
            <MessageCircle size={16} /> Get WhatsApp Updates
          </button>
          <Link to="/account?tab=orders" className="btn-primary flex items-center justify-center gap-2 flex-1" id="view-orders">
            Track My Orders
          </Link>
        </div>

        <div className="text-center mt-10">
          <Link to="/products" className="text-brand-gold text-sm hover:underline focus-visible:outline-brand-gold" id="continue-shopping-confirm">
            Continue Shopping →
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default OrderConfirmationPage;
