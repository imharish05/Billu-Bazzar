import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AlertTriangle } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { fetchAdminOrders, updateOrderStatus } from '../redux/slices/ordersSlice';
import currencyJs from 'currency.js';

const fmt = (v) => currencyJs(v, { symbol: '₹', precision: 0 }).format();

const STATUS_TABS = ['All', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
const STATUS_COLORS = {
  PENDING: 'bg-yellow-50 text-yellow-700', CONFIRMED: 'bg-blue-50 text-blue-700',
  PROCESSING: 'bg-purple-50 text-purple-700', SHIPPED: 'bg-indigo-50 text-indigo-700',
  OUT_FOR_DELIVERY: 'bg-orange-50 text-orange-700', DELIVERED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-500',
};
const PAY_COLORS = { PAID: 'bg-green-50 text-green-700', UNPAID: 'bg-yellow-50 text-yellow-700', REFUNDED: 'bg-gray-100 text-gray-500' };

const OrdersAdminPage = () => {
  const dispatch = useDispatch();
  const { items: orders, loading, total } = useSelector(s => s.orders);
  const [activeStatus, setActiveStatus] = useState('All');

  useEffect(() => {
    dispatch(fetchAdminOrders({ status: activeStatus === 'All' ? undefined : activeStatus }));
  }, [activeStatus, dispatch]);

  const handleStatusUpdate = (id, status) => dispatch(updateOrderStatus({ id, status }));

  const filtered = activeStatus === 'All' ? orders : orders.filter(o => o.status === activeStatus);

  return (
    <AdminLayout title="Orders">
      {/* Status tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide" role="tablist">
        {STATUS_TABS.map(s => (
          <button
            key={s}
            onClick={() => setActiveStatus(s)}
            role="tab" aria-selected={activeStatus === s}
            id={`orders-tab-${s}`}
            className={`flex-shrink-0 px-4 py-2 text-xs font-medium rounded-lg transition-all ${activeStatus === s ? 'bg-brand-gold text-white' : 'bg-white text-brand-grey hover:bg-brand-light'}`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-brand-light flex items-center justify-between">
          <p className="text-sm text-brand-grey">{total} total orders</p>
          <button className="text-xs text-brand-gold hover:underline focus-visible:outline-brand-gold" id="export-orders">Export CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Orders table">
            <thead>
              <tr className="bg-brand-light/40 text-left">
                {['Order #', 'Customer', 'Items', 'Amount', 'Payment', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-brand-grey uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-brand-light">
                    {[...Array(8)].map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-16" /></td>)}
                  </tr>
                ))
              ) : filtered.map(order => (
                <tr key={order.id} className="border-b border-brand-light hover:bg-brand-light/20 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-semibold text-brand-gold">{order.orderNumber}</span>
                    {order.isFraudFlagged && <AlertTriangle size={12} className="inline ml-1 text-red-500" title="Fraud flagged" />}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{order.customer?.name || 'Customer'}</p>
                    <p className="text-xs text-brand-grey">{order.customer?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-center">{order.items?.length || '—'}</td>
                  <td className="px-4 py-3 font-semibold">{fmt(order.totalAmount)}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${PAY_COLORS[order.paymentStatus] || 'bg-gray-100'}`}>{order.paymentStatus}</span></td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      onChange={e => handleStatusUpdate(order.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}
                      id={`status-${order.id}`}
                      aria-label="Order status"
                    >
                      {['PENDING','CONFIRMED','PROCESSING','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'].map(s => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-brand-grey text-xs">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-brand-gold hover:underline focus-visible:outline-brand-gold" id={`invoice-${order.id}`}>Invoice</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center text-brand-grey">No orders for this status.</div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrdersAdminPage;
