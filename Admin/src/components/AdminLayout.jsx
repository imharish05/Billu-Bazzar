import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, Package, Tag, ShoppingBag, Users, Image, Ticket,
  Warehouse, UserCheck, BarChart3, Settings, LogOut, Menu, X,
  Store, CreditCard, Gift, MessageSquare, Globe, Bell, ShoppingCart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import { logout } from '../redux/slices/authSlice';

const NAV_SECTIONS = [
  {
    heading: null,
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    heading: 'Marketing',
    items: [
      { to: '/slider-messages', label: 'Slider Messages', icon: MessageSquare },
      { to: '/banners', label: 'Banners', icon: Image },
      { to: '/coupons', label: 'Coupons', icon: Ticket },
      { to: '/affiliates', label: 'Affiliates', icon: UserCheck },
      { to: '/loyalty', label: 'Loyalty', icon: Gift },
    ],
  },
  {
    heading: 'Products',
    items: [
      { to: '/categories', label: 'Categories', icon: Tag },
      { to: '/sub-categories', label: 'Sub-categories', icon: Tag },
      { to: '/sub-sub-categories', label: 'Sub-subcategories', icon: Tag },
      { to: '/products', label: 'Products', icon: Package },
      { to: '/variants', label: 'Variants', icon: Package },
      { to: '/orders', label: 'Orders', icon: ShoppingBag },
    ],
  },
  {
    heading: 'Customers',
    items: [
      { to: '/customers', label: 'Customers', icon: Users },
      { to: '/abandoned-carts', label: 'Abandoned Carts', icon: ShoppingCart },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { to: '/vendors', label: 'Vendors', icon: Store },
      { to: '/warehouses', label: 'Warehouses', icon: Warehouse },
    ],
  },
  {
    heading: 'Finance',
    items: [
      { to: '/payments', label: 'Payments', icon: CreditCard },
      { to: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    heading: null,
    items: [
      { to: '/site-settings', label: 'Site Settings', icon: Globe },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const AdminLayout = ({ children, title = '' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { admin } = useSelector(s => s.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'order', text: 'New order #1084 received', time: '5 mins ago', read: false },
    { id: 2, type: 'stock', text: 'Low stock warning: Rose Gold Lehenga Set', time: '1 hour ago', read: false },
    { id: 3, type: 'ticket', text: 'New support ticket: Refund request #304', time: '2 hours ago', read: true },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleLogout = () => { dispatch(logout()); navigate('/login'); };

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-white border-r border-brand-light w-60">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-brand-light flex-shrink-0">
        <Logo size="md" showText={true} />
        <p className="text-[10px] text-brand-grey mt-1 tracking-widest uppercase">Admin Panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2" aria-label="Admin navigation">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {section.heading && (
              <p className="px-3 py-2 text-[10px] font-bold text-brand-grey uppercase tracking-[0.15em]">
                {section.heading}
              </p>
            )}
            {section.items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all border-l-2 ${
                    isActive
                      ? 'bg-amber-50 text-brand-gold border-brand-gold'
                      : 'border-transparent text-brand-grey hover:bg-brand-light hover:text-brand-text'
                  }`
                }
                id={`nav-${label.toLowerCase()}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={17} strokeWidth={1.5} />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom user section */}
      <div className="px-4 py-4 border-t border-brand-light">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-brand-gold flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{admin?.name?.[0] || 'A'}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{admin?.name || 'Admin'}</p>
            <p className="text-[10px] text-brand-grey truncate">{admin?.role || 'superadmin'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 text-xs text-red-400 hover:text-red-600 transition-colors py-1.5 focus-visible:outline-brand-gold"
          id="admin-logout-btn"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              key="mobile-sidebar"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.28 }}
              className="fixed left-0 top-0 bottom-0 z-50 lg:hidden"
            >
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Glass surface: Admin top navbar */}
        <header className="glass-nav flex-shrink-0 flex items-center justify-between px-4 md:px-6 h-14 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-1.5 hover:text-brand-gold transition-colors focus-visible:outline-brand-gold"
              aria-label="Toggle sidebar"
              id="admin-mobile-menu"
            >
              <Menu size={20} strokeWidth={1.5} />
            </button>
            <h1 className="font-playfair text-lg font-semibold text-brand-text">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <a href={import.meta.env.VITE_CLIENT_URL || 'http://localhost:5173'} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-grey hover:text-brand-gold transition-colors focus-visible:outline-brand-gold">
              View Store ↗
            </a>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-1.5 text-brand-grey hover:text-brand-gold transition-colors focus-visible:outline-brand-gold relative flex items-center"
                aria-label="Notifications"
                id="admin-notifications-bell"
              >
                <Bell size={18} strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 bg-white border border-brand-light shadow-xl z-50 rounded-lg overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-brand-light bg-neutral-50">
                        <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-[10px] font-semibold text-brand-gold hover:underline uppercase tracking-wider bg-transparent border-none cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-brand-light">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-brand-grey">No notifications</div>
                        ) : (
                          notifications.map(n => (
                            <div
                              key={n.id}
                              className={`p-3 text-xs transition-colors hover:bg-neutral-50/50 flex gap-2 ${
                                !n.read ? 'bg-amber-50/20' : ''
                              }`}
                            >
                              <div className="flex-1">
                                <p className={`text-neutral-800 text-left ${!n.read ? 'font-medium' : ''}`}>{n.text}</p>
                                <p className="text-[10px] text-brand-grey text-left mt-0.5">{n.time}</p>
                              </div>
                              {!n.read && (
                                <div className="w-1.5 h-1.5 bg-brand-gold rounded-full self-center" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="w-8 h-8 rounded-full bg-brand-gold flex items-center justify-center">
              <span className="text-white text-xs font-bold">{admin?.name?.[0] || 'A'}</span>
            </div>
          </div>
        </header>

        {/* Page content — scrollable */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
