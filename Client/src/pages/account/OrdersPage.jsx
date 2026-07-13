import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, ChevronRight } from 'lucide-react';
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
 * OrdersPage — /account/orders
 * PRD ref: "Customer Account > Order history"
 * Mock data — swap mockOrders for `useSelector(s => s.orders.items)` +
 * `dispatch(fetchMyOrders())` once the API is live.
 */
const OrdersPage = () => {
  const orders = mockOrders;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <h1 className="font-playfair text-xl font-semibold mb-5">My Orders</h1>

      {orders.length === 0 ? (
        <div className="bg-white shadow-sm p-12 text-center">
          <Package size={40} className="text-brand-light mx-auto mb-3" strokeWidth={1} />
          <p className="font-playfair text-xl mb-2">No orders yet</p>
          <p className="text-brand-grey text-sm mb-4">Start exploring our curated collections</p>
          <Link to="/products" className="btn-primary" id="orders-empty-shop">Shop Now</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Link
              key={order.id}
              to={`/account/orders/${order.id}`}
              className="block bg-white shadow-sm hover:shadow-md transition-shadow p-5 focus-visible:outline-brand-gold"
              id={`order-row-${order.id}`}
            >
              <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                <div>
                  <p className="font-medium">Order #{order.orderNumber}</p>
                  <p className="text-xs text-brand-grey">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-brand-grey">{order.items.length} item{order.items.length > 1 ? 's' : ''} · {order.paymentMethod}</span>
                <span className="font-semibold text-brand-gold flex items-center gap-1">
                  {formatPrice(order.totalAmount)}
                  <ChevronRight size={14} className="text-brand-grey" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default OrdersPage;