import AdminLayout from '../components/AdminLayout';

const WAREHOUSES = [
  { id: 1, name: 'Mumbai Main Hub', code: 'MUM-01', city: 'Mumbai', state: 'Maharashtra', contact: '+91 98765 43210', stockCount: 4820, isActive: true },
  { id: 2, name: 'Delhi NCR Warehouse', code: 'DEL-01', city: 'Gurugram', state: 'Haryana', contact: '+91 98765 11111', stockCount: 3140, isActive: true },
  { id: 3, name: 'Bengaluru South', code: 'BLR-01', city: 'Bengaluru', state: 'Karnataka', contact: '+91 98765 22222', stockCount: 2210, isActive: true },
  { id: 4, name: 'Hyderabad Facility', code: 'HYD-01', city: 'Hyderabad', state: 'Telangana', contact: '+91 98765 33333', stockCount: 1540, isActive: false },
];

const WarehousesAdminPage = () => (
  <AdminLayout title="Warehouses">
    <div className="flex justify-between items-center mb-6">
      <p className="text-sm text-brand-grey">{WAREHOUSES.length} warehouses</p>
      <button className="btn-primary flex items-center gap-2" id="add-warehouse-btn">+ Add Warehouse</button>
    </div>
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {WAREHOUSES.map(w => (
        <div key={w.id} className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold text-sm">{w.name}</p>
              <p className="text-xs text-brand-gold font-mono mt-0.5">{w.code}</p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${w.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{w.isActive ? 'Active' : 'Inactive'}</span>
          </div>
          <p className="text-xs text-brand-grey">{w.city}, {w.state}</p>
          <p className="text-xs text-brand-grey">{w.contact}</p>
          <div className="mt-4 pt-3 border-t border-brand-light flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-brand-text">{w.stockCount.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-brand-grey">SKUs in stock</p>
            </div>
            <button className="text-xs text-brand-gold hover:underline focus-visible:outline-brand-gold" id={`edit-wh-${w.id}`}>Edit</button>
          </div>
        </div>
      ))}
    </div>
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-brand-light"><p className="font-medium text-sm">Warehouse Details</p></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Warehouses detail table">
          <thead><tr className="bg-brand-light/40 text-left">{['Name','Code','City','Contact','Stock','Status'].map(h=><th key={h} className="px-4 py-3 text-xs font-semibold text-brand-grey uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody>
            {WAREHOUSES.map(w => (
              <tr key={w.id} className="border-b border-brand-light hover:bg-brand-light/20 transition-colors">
                <td className="px-4 py-3 font-medium">{w.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-brand-gold">{w.code}</td>
                <td className="px-4 py-3 text-brand-grey">{w.city}, {w.state}</td>
                <td className="px-4 py-3 text-brand-grey">{w.contact}</td>
                <td className="px-4 py-3 font-semibold">{w.stockCount.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${w.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{w.isActive ? 'Active' : 'Inactive'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </AdminLayout>
);
export default WarehousesAdminPage;
