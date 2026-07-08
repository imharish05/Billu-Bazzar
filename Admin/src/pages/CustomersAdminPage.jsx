import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, CheckCircle, Star } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { fetchCustomers } from '../redux/slices/customersSlice';

const CustomersAdminPage = () => {
  const dispatch = useDispatch();
  const { items, loading, total } = useSelector(s => s.customers);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchCustomers({ search: search || undefined }));
  }, [search, dispatch]);

  return (
    <AdminLayout title="Customers">
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey" />
          <input type="search" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-brand-light text-sm focus:outline-none focus:border-brand-gold" id="customers-search" aria-label="Search customers" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-brand-light">
          <p className="text-sm text-brand-grey">{total} customers</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Customers table">
            <thead>
              <tr className="bg-brand-light/40 text-left">
                {['Customer', 'Phone', 'Loyalty Pts', 'Orders', 'Verified', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-brand-grey uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-brand-light">
                    {[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-20" /></td>)}
                  </tr>
                ))
              ) : items.map(customer => (
                <tr key={customer.id} className="border-b border-brand-light hover:bg-brand-light/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-gold flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{customer.name?.[0] || '?'}</span>
                      </div>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-xs text-brand-grey">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-brand-grey">{customer.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="fill-brand-gold text-brand-gold" />
                      <span className="font-medium">{customer.loyaltyPoints || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">{customer.orders?.length || 0}</td>
                  <td className="px-4 py-3">
                    {customer.isVerified ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <span className="text-xs text-brand-grey">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-brand-grey text-xs">{new Date(customer.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-brand-gold hover:underline focus-visible:outline-brand-gold" id={`view-cust-${customer.id}`}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && items.length === 0 && <div className="py-12 text-center text-brand-grey">No customers found.</div>}
        </div>
      </div>
    </AdminLayout>
  );
};

export default CustomersAdminPage;
