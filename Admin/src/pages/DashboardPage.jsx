import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ShoppingBag, Users, TrendingUp, Clock, Package, AlertTriangle, Plus, ArrowRight, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import AdminOrderDetailsModal from '../components/AdminOrderDetailsModal';
import { fetchStats } from '../redux/slices/dashboardSlice';
import { fetchAdminOrders, updateOrderStatus } from '../redux/slices/ordersSlice';
import currencyJs from 'currency.js';

const fmt = (v) => currencyJs(v, { symbol: '₹', precision: 0 }).format();

/* Animated counter hook — anime.js pattern, implemented with requestAnimationFrame */
const useCounter = (target, duration = 1200) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return count;
};

/* Stat Card — glass surface #4 (glass-stat-card) */
const StatCard = ({ icon: Icon, label, value, prefix = '', suffix = '', trend, color = '#C9A24B', index }) => {
  const animated = useCounter(typeof value === 'number' ? value : 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      /* glass-stat-card: dashboard stat cards float over gradient mesh */
      className="glass-stat-card rounded-xl p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon size={22} style={{ color }} strokeWidth={1.5} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-brand-grey text-xs font-medium mb-1">{label}</p>
      <p className="font-playfair text-3xl font-bold text-brand-text">
        {prefix}{typeof value === 'number' ? animated.toLocaleString('en-IN') : value}{suffix}
      </p>
    </motion.div>
  );
};

const STATUS_COLORS = {
  PENDING: 'bg-yellow-50 text-yellow-700', CONFIRMED: 'bg-blue-50 text-blue-700',
  PROCESSING: 'bg-purple-50 text-purple-700', SHIPPED: 'bg-indigo-50 text-indigo-700',
  OUT_FOR_DELIVERY: 'bg-orange-50 text-orange-700',
   DELIVERED: 'bg-green-50 text-green-600',
  CANCELLED: 'bg-red-50 text-red-500',
};

/* Low-stock mock data */
const lowStockItems = [
  { name: 'Rose Gold Lehenga Set (Size S)', stock: 2, sku: 'BB-LEH-001' },
  { name: 'Oud Royale Perfume 50ml', stock: 4, sku: 'BB-PER-012' },
  { name: 'Kundan Polki Necklace Set', stock: 1, sku: 'BB-JEW-034' },
];

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { stats, revenueChart, loading } = useSelector(s => s.dashboard);
  const { items: orders } = useSelector(s => s.orders);
  const [selectedOrderModal, setSelectedOrderModal] = useState(null);

  useEffect(() => {
    dispatch(fetchStats());
    dispatch(fetchAdminOrders({ limit: 5 }));
  }, [dispatch]);

  const handleStatusUpdate = (id, status) => {
    dispatch(updateOrderStatus({ id, status }));
  };

  const statCards = [
    { icon: TrendingUp, label: 'Total Revenue', value: stats.totalRevenue, prefix: '₹', trend: 12 },
    { icon: ShoppingBag, label: 'Total Orders', value: stats.totalOrders, trend: 8 },
    { icon: Users, label: 'Total Customers', value: stats.totalCustomers, trend: 15 },
    { icon: Clock, label: 'Pending Orders', value: stats.pendingOrders, color: '#f59e0b', trend: -3 },
  ];

  return (
    <AdminLayout title="Dashboard">
      {/* Gradient mesh wrapper — glass cards need a colourful bg underneath */}
      <div className="gradient-mesh -m-6 p-6 min-h-screen">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {statCards.map((card, i) => (
            <StatCard key={card.label} {...card} index={i} />
          ))}
        </div>

        <div className="grid xl:grid-cols-3 gap-6 mb-6">
          {/* Revenue Area Chart */}
          <div className="xl:col-span-2 bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-playfair text-lg font-semibold">7-Day Revenue</h2>
              <span className="text-xs text-brand-grey">Last 7 days</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A24B" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#C9A24B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EEE8" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6B6B6B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B6B6B' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v) => [fmt(v), 'Revenue']} contentStyle={{ fontSize: 12, border: '1px solid #F0EEE8', borderRadius: 4 }} />
                <Area type="monotone" dataKey="revenue" stroke="#C9A24B" strokeWidth={2} fill="url(#goldGrad)" dot={{ fill: '#C9A24B', r: 3 }} animationBegin={200} animationDuration={800} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={17} className="text-amber-500" strokeWidth={1.5} />
              <h2 className="font-playfair text-lg font-semibold">Low Stock Alert</h2>
            </div>
            <div className="space-y-3">
              {lowStockItems.map(item => (
                <div key={item.sku} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                  <Package size={16} className="text-amber-600 flex-shrink-0" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                    <p className="text-xs text-brand-grey">{item.sku}</p>
                  </div>
                  <span className="flex-shrink-0 text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                    {item.stock} left
                  </span>
                </div>
              ))}
            </div>
            <Link to="/products" className="mt-4 text-xs text-brand-gold hover:underline flex items-center gap-1" id="low-stock-manage">
              Manage Stock <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-brand-light">
            <h2 className="font-playfair text-lg font-semibold">Recent Orders</h2>
            <Link to="/orders" className="text-xs text-brand-gold hover:underline flex items-center gap-1" id="view-all-orders">
              View All <ArrowRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Recent orders">
              <thead>
                <tr className="bg-brand-light/50 text-left">
                  {['Order #', 'Customer', 'Amount', 'Payment', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-brand-grey uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-brand-light">
                      {[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-20" /></td>)}
                    </tr>
                  ))
                ) : orders.slice(0, 5).map(order => (
                  <tr key={order.id} className="border-b border-brand-light hover:bg-brand-light/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-brand-gold">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-brand-grey">{order.customer?.name || 'Customer'}</td>
                    <td className="px-4 py-3 font-semibold">{fmt(order.totalAmount)}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${order.paymentStatus === 'PAID' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>{order.paymentStatus}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>{order.status ? order.status.replace(/_/g, ' ') : ''}</span></td>
                    <td className="px-4 py-3 text-brand-grey text-xs">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedOrderModal(order)}
                        className="p-1.5 bg-brand-gold/10 hover:bg-brand-gold hover:text-white text-brand-gold rounded-lg transition-all flex items-center gap-1 text-xs font-medium border border-brand-gold/20"
                        title="View Order Details"
                        id={`dashboard-view-order-${order.id}`}
                      >
                        <Eye size={14} /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Add Product', to: '/products', icon: Plus },
            { label: 'View Orders', to: '/orders', icon: ShoppingBag },
            { label: 'Reports', to: '/reports', icon: TrendingUp },
            { label: 'Settings', to: '/settings', icon: Package },
          ].map(({ label, to, icon: Icon }) => (
            <Link
              key={label}
              to={to}
              className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow text-sm font-medium hover:text-brand-gold"
              id={`quick-${label.toLowerCase().replace(/\s/g,'-')}`}
            >
              <Icon size={18} className="text-brand-gold" strokeWidth={1.5} />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Admin Order Details Modal */}
      {selectedOrderModal && (
        <AdminOrderDetailsModal
          order={selectedOrderModal}
          onClose={() => setSelectedOrderModal(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </AdminLayout>
  );
};

export default DashboardPage;
