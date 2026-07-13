import { NavLink, Outlet } from 'react-router-dom';
import { User, Package, Heart, Star, Gift, Headphones, LogOut } from 'lucide-react';
import Footer from '../../components/Footer';
import { mockCustomer } from '../../data/mockAccountData';

const NAV_ITEMS = [
  { to: '/account', label: 'Profile', icon: User, end: true },
  { to: '/account/orders', label: 'My Orders', icon: Package },
  { to: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/account/loyalty', label: 'Loyalty & Cashback', icon: Star },
  { to: '/account/personal-shopper', label: 'Personal Shopper', icon: Gift },
  { to: '/account/support', label: 'Support', icon: Headphones },
];

/**
 * AccountLayout — sidebar shell shared by every /account/* page.
 * Each nav item is a real route (not a client-side tab switch), so pages
 * are individually linkable, refreshable, and independently code-splittable.
 * Uses mock customer data — swap for `useSelector(s => s.auth.customer)`
 * once the account API is wired up.
 */
const AccountLayout = () => {
  const customer = mockCustomer;

  return (
    <main id="main-content">
      <div className="max-w-site mx-auto px-6 md:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-60 flex-shrink-0">
            <div className="bg-white shadow-sm p-5 text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-brand-gold flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold text-xl">{customer.avatarInitial}</span>
              </div>
              <p className="font-medium">{customer.name}</p>
              <p className="text-xs text-brand-grey truncate">{customer.email}</p>
              <div className="mt-3 flex items-center justify-center gap-1">
                <Star size={12} className="fill-brand-gold text-brand-gold" />
                <span className="text-xs font-medium text-brand-gold">{customer.loyaltyPoints} pts · {customer.loyaltyTier}</span>
              </div>
            </div>

            <nav className="bg-white shadow-sm overflow-hidden">
              {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-4 py-3 text-sm text-left border-l-2 transition-all hover:bg-brand-light ${
                      isActive ? 'border-brand-gold text-brand-gold bg-brand-light/50' : 'border-transparent text-brand-grey'
                    }`
                  }
                  id={`account-nav-${label.toLowerCase().replace(/\s.*/, '')}`}
                >
                  <Icon size={16} strokeWidth={1.5} />
                  {label}
                </NavLink>
              ))}
              <button
                onClick={() => { /* wire to dispatch(logout()) once auth is live */ }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left border-l-2 border-transparent text-red-400 hover:bg-red-50 transition-all"
                id="account-logout"
              >
                <LogOut size={16} strokeWidth={1.5} /> Sign Out
              </button>
            </nav>
          </aside>

          {/* Routed page content */}
          <div className="flex-1">
            <Outlet />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default AccountLayout;