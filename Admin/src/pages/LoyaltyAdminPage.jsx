import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../services/api';
import toast from 'react-hot-toast';

const TYPE_COLORS = {
  EARN: 'bg-green-50 text-green-700',
  REDEEM: 'bg-red-50 text-red-600',
  BONUS: 'bg-amber-50 text-amber-700',
  EXPIRE: 'bg-gray-100 text-gray-500',
};

const LoyaltyAdminPage = () => {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    earnRate: 20,
    redeemRate: 0.2,
    maxRedeemAmount: 500,
    expiryMonths: 2,
    earnRules: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ledgerRes, settingsRes] = await Promise.all([
        api.get('/loyalty/ledger'),
        api.get('/site-settings/loyalty')
      ]);
      if (ledgerRes.data.success) {
        setLedger(ledgerRes.data.ledger);
      }
      if (settingsRes.data.success && settingsRes.data.data) {
        setSettings(settingsRes.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.post('/site-settings/loyalty', { data: settings });
      setShowSettings(false);
      toast.success('Loyalty settings saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings.');
    }
  };

  const handleRuleChange = (index, field, value) => {
    const newRules = [...settings.earnRules];
    newRules[index][field] = value;
    setSettings({ ...settings, earnRules: newRules });
  };

  const addRule = () => {
    setSettings({
      ...settings,
      earnRules: [...(settings.earnRules || []), { id: Date.now().toString(), action: '', points: '' }]
    });
  };

  const removeRule = (index) => {
    const newRules = [...settings.earnRules];
    newRules.splice(index, 1);
    setSettings({ ...settings, earnRules: newRules });
  };

  return (
    <AdminLayout title="Loyalty Program">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowSettings(true)} className="bg-brand-text text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-gold transition-colors">
          Configure Loyalty Settings
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="px-5 py-3 border-b border-brand-light flex items-center justify-between">
          <p className="text-sm font-medium">Loyalty Ledger</p>
          <input type="text" placeholder="Filter by customer..." className="text-sm border border-brand-light px-3 py-1.5 focus:outline-none focus:border-brand-gold w-48" id="loyalty-search" aria-label="Filter by customer" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Loyalty ledger">
            <thead>
              <tr className="bg-brand-light/40 text-left">
                {['Customer', 'Type', 'Points', 'Balance', 'Description', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-brand-grey uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-4 text-brand-grey">Loading...</td></tr>
              ) : ledger.map(entry => (
                <tr key={entry.id} className="border-b border-brand-light hover:bg-brand-light/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{entry.customer?.name || 'Unknown'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[entry.type] || TYPE_COLORS.BONUS}`}>
                      {entry.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold" style={{ color: entry.points > 0 ? '#16a34a' : '#dc2626' }}>
                    {entry.points > 0 ? '+' : ''}{entry.points}
                  </td>
                  <td className="px-4 py-3 text-brand-grey">{entry.balance}</td>
                  <td className="px-4 py-3 text-brand-grey text-xs">{entry.description}</td>
                  <td className="px-4 py-3 text-brand-grey text-xs">
                    {new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-brand-light flex justify-between items-center sticky top-0 bg-white">
              <h2 className="font-playfair text-xl font-semibold">Loyalty Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-brand-grey hover:text-brand-text">&times;</button>
            </div>
            <form onSubmit={handleSaveSettings} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Earn Rate (INR per 1 Point)</label>
                  <input type="number" value={settings.earnRate} onChange={e => setSettings({ ...settings, earnRate: Number(e.target.value) })} className="w-full border border-brand-light rounded p-2 focus:border-brand-gold outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Redeem Rate (INR per 1 Point)</label>
                  <input type="number" step="0.01" value={settings.redeemRate} onChange={e => setSettings({ ...settings, redeemRate: Number(e.target.value) })} className="w-full border border-brand-light rounded p-2 focus:border-brand-gold outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Redeem Amount per Order (INR)</label>
                  <input type="number" value={settings.maxRedeemAmount} onChange={e => setSettings({ ...settings, maxRedeemAmount: Number(e.target.value) })} className="w-full border border-brand-light rounded p-2 focus:border-brand-gold outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Points Expiry (Months)</label>
                  <input type="number" value={settings.expiryMonths} onChange={e => setSettings({ ...settings, expiryMonths: Number(e.target.value) })} className="w-full border border-brand-light rounded p-2 focus:border-brand-gold outline-none" required />
                </div>
              </div>
              
              <div className="border-t border-brand-light pt-6">
                <h3 className="font-medium mb-4">"How to Earn More" Instructions</h3>
                {settings.earnRules && settings.earnRules.map((rule, idx) => (
                  <div key={idx} className="flex gap-2 mb-3">
                    <input type="text" placeholder="Action (e.g. Write a review)" value={rule.action} onChange={e => handleRuleChange(idx, 'action', e.target.value)} className="flex-1 border border-brand-light rounded p-2 focus:border-brand-gold outline-none" required />
                    <input type="text" placeholder="Points (e.g. +50 points)" value={rule.points} onChange={e => handleRuleChange(idx, 'points', e.target.value)} className="w-40 border border-brand-light rounded p-2 focus:border-brand-gold outline-none" required />
                    <button type="button" onClick={() => removeRule(idx)} className="text-red-500 px-2 font-bold hover:bg-red-50 rounded">X</button>
                  </div>
                ))}
                <button type="button" onClick={addRule} className="text-sm text-brand-gold font-medium mt-2">+ Add Rule</button>
              </div>

              <div className="flex justify-end pt-4 border-t border-brand-light">
                <button type="button" onClick={() => setShowSettings(false)} className="px-4 py-2 text-brand-grey hover:text-brand-text mr-4">Cancel</button>
                <button type="submit" className="bg-brand-text text-white px-6 py-2 rounded-md hover:bg-brand-gold transition-colors">Save Settings</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
export default LoyaltyAdminPage;
