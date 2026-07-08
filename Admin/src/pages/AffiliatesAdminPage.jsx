import { useState } from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';

const AFFILIATES = [
  { id: 1, name: 'Meera Kapoor', code: 'MEERA20', commission: 8, earnings: 42800, clicks: 12400, orders: 214, isActive: true },
  { id: 2, name: 'Riya Ahuja', code: 'RIYA15', commission: 7, earnings: 28600, clicks: 8900, orders: 143, isActive: true },
  { id: 3, name: 'Priya Fashion', code: 'PRIYA10', commission: 10, earnings: 68200, clicks: 24000, orders: 341, isActive: true },
  { id: 4, name: 'Sana Glam', code: 'SANA12', commission: 6, earnings: 15400, clicks: 5200, orders: 87, isActive: false },
  { id: 5, name: 'StyleHub India', code: 'STYLEHUB', commission: 9, earnings: 31800, clicks: 9800, orders: 159, isActive: true },
];

const AffiliatesAdminPage = () => {
  const [affiliates, setAffiliates] = useState(AFFILIATES);

  const toggle = (id) => setAffiliates(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));

  return (
    <AdminLayout title="Affiliates">
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-brand-grey">{affiliates.length} affiliates · ₹{affiliates.reduce((s,a)=>s+a.earnings,0).toLocaleString('en-IN')} total paid out</p>
        <button className="btn-primary flex items-center gap-2" id="add-affiliate-btn">+ Add Affiliate</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Affiliates table">
            <thead>
              <tr className="bg-brand-light/40 text-left">
                {['Influencer','Referral Code','Commission','Earnings','Clicks','Orders','Status'].map(h=>(
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-brand-grey uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {affiliates.map(a => (
                <tr key={a.id} className="border-b border-brand-light hover:bg-brand-light/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-gold to-yellow-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{a.name[0]}</span>
                      </div>
                      <p className="font-medium">{a.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="font-mono text-xs bg-brand-light px-2 py-0.5 rounded">{a.code}</span></td>
                  <td className="px-4 py-3 font-semibold">{a.commission}%</td>
                  <td className="px-4 py-3 font-semibold text-green-700">₹{a.earnings.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-brand-grey">{a.clicks.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">{a.orders}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(a.id)} className="focus-visible:outline-brand-gold" id={`toggle-aff-${a.id}`} aria-label="Toggle active">
                      {a.isActive ? <ToggleRight size={22} className="text-brand-gold" /> : <ToggleLeft size={22} className="text-brand-grey" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
export default AffiliatesAdminPage;
