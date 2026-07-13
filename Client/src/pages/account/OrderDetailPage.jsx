import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Circle, MapPin } from 'lucide-react';
import { mockOrders } from '../../data/mockAccountData';
import { formatPrice } from '../../utils/currency';

/**
 * OrderDetailPage — /account/orders/:id
 * PRD ref: "Customer Account > Order history" + "Order Confirmation >
 * Real-time order tracking" (premium). Tracking here is a static mock
 * timeline; swap for live status polling / websocket once available.
 */
const OrderDetailPage = () => {
  const { id } = useParams();
  const order = mockOrders.find(o => o.id === id);

  if (!order) return <Navigate to="/account/orders" replace />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Link to="/account/orders" className="inline-flex items-center gap-1.5 text-sm text-brand-grey hover:text-brand-gold mb-5" id="back-to-orders">
        <ArrowLeft size={15} /> Back to Orders
      </Link>

      <div className="bg-white shadow-sm p-6 mb-5">
        <div className="flex justify-between items-start flex-wrap gap-2 mb-1">
          <h1 className="font-playfair text-xl font-semibold">Order #{order.orderNumber}</h1>
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-brand-light text-brand-text">{order.status}</span>
        </div>
        <p className="text-xs text-brand-grey">
          Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · {order.paymentMethod}
        </p>
      </div>

      {/* Tracking timeline */}
      <div className="bg-white shadow-sm p-6 mb-5">
        <h2 className="font-medium text-sm mb-5">Order Tracking</h2>
        <div className="flex items-start">
          {order.tracking.map((step, i) => (
            <div key={step.label} className="flex-1 flex flex-col items-center text-center relative">
              {i !== 0 && (
                <div className={`absolute top-3 right-1/2 w-full h-0.5 -z-0 ${order.tracking[i - 1].done ? 'bg-brand-gold' : 'bg-brand-light'}`} />
              )}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${step.done ? 'bg-brand-gold text-white' : 'bg-brand-light text-brand-grey'}`}>
                {step.done ? <Check size={13} /> : <Circle size={8} />}
              </div>
              <p className={`text-xs mt-2 font-medium ${step.done ? 'text-brand-text' : 'text-brand-grey'}`}>{step.label}</p>
              {step.date && (
                <p className="text-[10px] text-brand-grey mt-0.5">
                  {new Date(step.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white shadow-sm p-6 mb-5">
        <h2 className="font-medium text-sm mb-4">Items</h2>
        <div className="space-y-4">
          {order.items.map(item => (
            <div key={item.id} className="flex items-center gap-4">
              <img src={item.image} alt={item.name} className="w-16 h-16 object-cover flex-shrink-0" loading="lazy" decoding="async" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-brand-grey">Qty: {item.qty}</p>
              </div>
              <span className="text-sm font-semibold text-brand-gold">{formatPrice(item.price)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-5 pt-4 border-t border-brand-light">
          <span className="text-sm font-medium">Total</span>
          <span className="text-base font-bold text-brand-gold">{formatPrice(order.totalAmount)}</span>
        </div>
      </div>

      {/* Shipping address */}
      <div className="bg-white shadow-sm p-6 flex items-start gap-3">
        <MapPin size={18} className="text-brand-gold flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium mb-1">Shipping Address</p>
          <p className="text-sm text-brand-grey">{order.shippingAddress}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderDetailPage;