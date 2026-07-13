import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Circle, MapPin } from 'lucide-react';
import { mockOrders } from '../../data/mockAccountData';
import { formatPrice } from '../../utils/currency';

const STATUS_COLORS = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  PROCESSING: 'bg-purple-50 text-purple-700',
  SHIPPED: 'bg-indigo-50 text-indigo-700',
  OUT_FOR_DELIVERY: 'bg-orange-50 text-orange-700',
  DELIVERED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-700',
  RETURNED: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS = {
  PENDING: 'Order Placed',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipping',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
};

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

  // Generate tracking list dynamically using the active order status to align with the Admin status lifecycle.
  const trackingSteps = (() => {
    const steps = [
      { key: 'PENDING', label: 'Order Placed' },
      { key: 'CONFIRMED', label: 'Confirmed' },
      { key: 'PROCESSING', label: 'Processing' },
      { key: 'SHIPPED', label: 'Shipped' },
      { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
      { key: 'DELIVERED', label: 'Delivered' },
    ];

    if (order.status === 'CANCELLED') {
      return [
        { label: 'Order Placed', date: order.createdAt, done: true },
        { label: 'Cancelled', date: order.updatedAt || order.createdAt, done: true },
      ];
    }

    const orderSequence = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const currentIndex = orderSequence.indexOf(order.status);
    const baseDate = new Date(order.createdAt);

    return steps.map((step, idx) => {
      const stepIndex = orderSequence.indexOf(step.key);
      const done = stepIndex <= currentIndex;

      // Generate a mock sequential date for completed steps
      let date = null;
      if (done) {
        if (step.key === 'PENDING') {
          date = order.createdAt;
        } else {
          const simDate = new Date(baseDate);
          simDate.setDate(baseDate.getDate() + stepIndex);
          date = simDate.toISOString();
        }
      }

      return {
        label: step.label,
        date,
        done,
      };
    });
  })();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Link to="/account/orders" className="inline-flex items-center gap-1.5 text-sm text-brand-grey hover:text-brand-gold mb-5" id="back-to-orders">
        <ArrowLeft size={15} /> Back to Orders
      </Link>

      <div className="bg-white shadow-sm p-6 mb-5">
        <div className="flex justify-between items-start flex-wrap gap-2 mb-1">
          <h1 className="font-playfair text-xl font-semibold">Order #{order.orderNumber}</h1>
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
            {STATUS_LABELS[order.status] || order.status}
          </span>
        </div>
        <p className="text-xs text-brand-grey">
          Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · {order.paymentMethod}
        </p>
      </div>

      {/* Tracking timeline */}
      <div className="bg-white shadow-sm p-6 mb-5">
        <h2 className="font-medium text-sm mb-5">Order Tracking</h2>
        <div className="flex items-start">
          {trackingSteps.map((step, i) => (
            <div key={step.label} className="flex-1 flex flex-col items-center text-center relative">
              {i !== 0 && (
                <div className={`absolute top-3 right-1/2 w-full h-0.5 -z-0 ${trackingSteps[i - 1].done ? 'bg-brand-gold' : 'bg-brand-light'}`} />
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