import { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, X, Save, Plus } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import api from '../services/api';

const AffiliatesAdminPage = () => {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', referralCode: '', commissionRate: 5.0, payoutMethod: 'Bank Transfer' });
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/affiliates');
      setAffiliates(res.data.affiliates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (aff) => {
    try {
      await api.put(`/affiliates/${aff.id}`, { isActive: !aff.isActive });
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      await api.post('/affiliates', form);
      setModalOpen(false);
      setForm({ name: '', email: '', referralCode: '', commissionRate: 5.0, payoutMethod: 'Bank Transfer' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <AdminLayout title="Affiliates">
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-brand-grey">{affiliates.length} affiliates · ₹{affiliates.reduce((s,a)=>s+Number(a.totalEarnings || 0),0).toLocaleString('en-IN')} total paid out</p>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2" id="add-affiliate-btn">
          <Plus size={16} /> Add Affiliate
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-brand-grey">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Affiliates table">
              <thead>
                <tr className="bg-brand-light/40 text-left">
                  {['Influencer','Email','Referral Code','Commission','Earnings','Clicks','Orders','Status'].map(h=>(
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
                    <td className="px-4 py-3 text-brand-grey">{a.email}</td>
                    <td className="px-4 py-3"><span className="font-mono text-xs bg-brand-light px-2 py-0.5 rounded">{a.referralCode}</span></td>
                    <td className="px-4 py-3 font-semibold">{a.commissionRate}%</td>
                    <td className="px-4 py-3 font-semibold text-green-700">₹{Number(a.totalEarnings || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-brand-grey">{Number(a.totalClicks || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">{a.totalOrders || 0}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggle(a)} className="focus-visible:outline-brand-gold" id={`toggle-aff-${a.id}`} aria-label="Toggle active">
                        {a.isActive ? <ToggleRight size={22} className="text-brand-gold" /> : <ToggleLeft size={22} className="text-brand-grey" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-brand-light">
              <h3 className="font-semibold text-brand-text">Add New Affiliate</h3>
              <button onClick={() => setModalOpen(false)} className="text-brand-grey hover:text-brand-text"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-brand-grey mb-1" htmlFor="aff-name">Full Name</label>
                <input id="aff-name" type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-grey mb-1" htmlFor="aff-email">Email Address</label>
                <input id="aff-email" type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-grey mb-1" htmlFor="aff-code">Referral Code</label>
                <input id="aff-code" type="text" required value={form.referralCode} onChange={e => setForm({...form, referralCode: e.target.value})} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-grey mb-1" htmlFor="aff-rate">Commission Rate (%)</label>
                <input id="aff-rate" type="number" step="0.1" required value={form.commissionRate} onChange={e => setForm({...form, commissionRate: e.target.value})} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-brand-light">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-outline px-4 py-2">Cancel</button>
                <button type="submit" className="btn-primary flex items-center gap-2 px-4 py-2"><Save size={15} /> Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
export default AffiliatesAdminPage;
