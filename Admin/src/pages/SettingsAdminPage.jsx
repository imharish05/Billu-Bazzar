import { useState } from 'react';
import { Save } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';

const TABS = ['General', 'Shipping', 'Payments', 'Users'];

const SettingsAdminPage = () => {
  const [tab, setTab] = useState('General');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => { e.preventDefault(); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const Field = ({ label, id, type = 'text', defaultValue, placeholder }) => (
    <div>
      <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor={id}>{label}</label>
      <input id={id} type={type} defaultValue={defaultValue} placeholder={placeholder} className="w-full border border-brand-light px-3 py-2.5 text-sm focus:outline-none focus:border-brand-gold" />
    </div>
  );

  return (
    <AdminLayout title="Settings">
      <div className="flex gap-2 mb-6 border-b border-brand-light" role="tablist">
        {TABS.map(t => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} id={`settings-tab-${t}`}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-brand-gold text-brand-gold' : 'border-transparent text-brand-grey hover:text-brand-text'}`}>{t}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
        <form onSubmit={handleSave} className="space-y-5">
          {tab === 'General' && (
            <>
              <Field label="Store Name" id="store-name" defaultValue="Billu Bazaar" />
              <Field label="Store Tagline" id="store-tagline" defaultValue="India's Luxury Fashion Destination" />
              <Field label="Support Email" id="support-email" type="email" defaultValue="hello@billubazaar.com" />
              <Field label="Support Phone" id="support-phone" defaultValue="+91 99999 99999" />
              <Field label="GST Number" id="gst-number" defaultValue="27AABCB1234A1Z1" />
              <Field label="Store Address" id="store-address" defaultValue="14 Linking Road, Bandra West, Mumbai 400050" />
            </>
          )}
          {tab === 'Shipping' && (
            <>
              <Field label="Free Shipping Threshold (₹)" id="ship-threshold" type="number" defaultValue="1499" />
              <Field label="Standard Shipping Rate (₹)" id="ship-rate" type="number" defaultValue="99" />
              <Field label="Express Shipping Rate (₹)" id="ship-express" type="number" defaultValue="249" />
              <Field label="Shiprocket API Key (mock)" id="shiprocket-key" defaultValue="mock_key_here" />
              <Field label="Estimated Delivery (days)" id="ship-days" type="number" defaultValue="5" />
            </>
          )}
          {tab === 'Payments' && (
            <>
              <Field label="Razorpay Key ID (mock)" id="rzp-key" defaultValue="rzp_test_mock123" />
              <Field label="Razorpay Secret (mock)" id="rzp-secret" type="password" defaultValue="rzp_secret_mock" />
              <div>
                <label className="block text-xs font-medium text-brand-grey mb-1.5">Enabled Payment Methods</label>
                {['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash on Delivery'].map(m => (
                  <label key={m} className="flex items-center gap-2 text-sm mb-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-brand-gold" id={`pay-method-${m}`} /> {m}
                  </label>
                ))}
              </div>
            </>
          )}
          {tab === 'Users' && (
            <div>
              <h3 className="font-medium text-sm mb-4">Admin Users</h3>
              <div className="space-y-3">
                {[
                  { name: 'Super Admin', email: 'admin@billubazaar.com', role: 'superadmin' },
                  { name: 'Category Manager', email: 'category@billubazaar.com', role: 'manager' },
                  { name: 'Order Executive', email: 'orders@billubazaar.com', role: 'executive' },
                ].map(user => (
                  <div key={user.email} className="flex items-center gap-3 p-3 border border-brand-light rounded-lg">
                    <div className="w-9 h-9 rounded-full bg-brand-gold flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{user.name[0]}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-brand-grey">{user.email}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-brand-light text-brand-grey rounded-full">{user.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-brand-light flex items-center gap-3">
            <button type="submit" className="btn-primary flex items-center gap-2" id="settings-save"><Save size={15} /> Save Settings</button>
            {saved && <span className="text-green-600 text-sm">✓ Settings saved!</span>}
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};
export default SettingsAdminPage;
