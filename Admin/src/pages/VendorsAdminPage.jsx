import AdminLayout from '../components/AdminLayout';

const VENDORS = [
  { id: 1, name: 'Sabyasachi Mukherjee House', email: 'contact@sabyasachi.com', commission: 15, rating: 4.9, products: 28, isActive: true },
  { id: 2, name: 'Anita Dongre Label', email: 'info@anitadongre.com', commission: 12, rating: 4.7, products: 45, isActive: true },
  { id: 3, name: 'Raw Mango by Sanjay Garg', email: 'sales@rawmango.in', commission: 14, rating: 4.8, products: 32, isActive: true },
  { id: 4, name: 'Jaipur Jewels Co.', email: 'orders@jaipurjewels.com', commission: 18, rating: 4.6, products: 61, isActive: true },
  { id: 5, name: 'Mumbai Oud House', email: 'info@mumbaioud.com', commission: 20, rating: 4.5, products: 14, isActive: false },
];

const VendorsAdminPage = () => (
  <AdminLayout title="Vendors">
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-brand-light flex items-center justify-between">
        <p className="text-sm text-brand-grey">{VENDORS.length} vendors</p>
        <button className="btn-primary text-sm flex items-center gap-2 px-4 py-2" id="add-vendor-btn">+ Add Vendor</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Vendors table">
          <thead><tr className="bg-brand-light/40 text-left">{['Vendor','Email','Commission','Rating','Products','Status','Action'].map(h=><th key={h} className="px-4 py-3 text-xs font-semibold text-brand-grey uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody>
            {VENDORS.map(v => (
              <tr key={v.id} className="border-b border-brand-light hover:bg-brand-light/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-brand-gold/10 flex items-center justify-center"><span className="text-brand-gold text-xs font-bold">{v.name[0]}</span></div><p className="font-medium">{v.name}</p></div>
                </td>
                <td className="px-4 py-3 text-brand-grey text-xs">{v.email}</td>
                <td className="px-4 py-3 font-medium">{v.commission}%</td>
                <td className="px-4 py-3"><span className="text-brand-gold">★ {v.rating}</span></td>
                <td className="px-4 py-3">{v.products}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${v.isActive?'bg-green-50 text-green-700':'bg-gray-100 text-gray-500'}`}>{v.isActive?'Active':'Inactive'}</span></td>
                <td className="px-4 py-3"><button className="text-xs text-brand-gold hover:underline" id={`edit-vendor-${v.id}`}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </AdminLayout>
);
export default VendorsAdminPage;
