import { useState, useEffect, useRef } from 'react';
import { ToggleLeft, ToggleRight, X, Save, Plus, Edit2, Trash2, Upload, Copy, RefreshCw } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import Switch from '../components/Switch';
import api from '../services/api';
import toast from 'react-hot-toast';

const generateUniqueCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // avoid ambiguous characters
  let code = 'BB-AFF-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const AffiliatesAdminPage = () => {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    referralCode: '',
    commissionRate: 5.0,
    payoutMethod: 'Bank Transfer',
    followers: '0',
    handle: '',
    productsCurated: 0
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/affiliates');
      setAffiliates(res.data.affiliates || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load affiliates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCopyLink = (code) => {
    const origin = import.meta.env.VITE_CLIENT_URL || window.location.origin.replace(':5174', ':5173');
    const url = `${origin}/products?ref=${code}`;
    navigator.clipboard.writeText(url)
      .then(() => toast.success('Referral link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy link.'));
  };

  const openModal = (aff = null) => {
    setEditing(aff);
    setForm(aff ? {
      name: aff.name,
      email: aff.email,
      referralCode: aff.referralCode,
      commissionRate: aff.commissionRate,
      payoutMethod: aff.payoutMethod || 'Bank Transfer',
      followers: aff.followers || '0',
      handle: aff.handle || '',
      productsCurated: aff.productsCurated || 0
    } : {
      name: '',
      email: '',
      referralCode: generateUniqueCode(),
      commissionRate: 5.0,
      payoutMethod: 'Bank Transfer',
      followers: '0',
      handle: '',
      productsCurated: 0
    });
    setImagePreview(aff?.avatar || null);
    setImageFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setModalOpen(true);
  };

  const handleToggleActive = async (aff) => {
    try {
      await api.put(`/affiliates/${aff.id}`, { ...aff, isActive: !aff.isActive });
      toast.success('Status updated successfully.');
      load();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status.');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('email', form.email.trim());
      fd.append('referralCode', form.referralCode.trim());
      fd.append('commissionRate', String(form.commissionRate));
      fd.append('payoutMethod', form.payoutMethod);
      fd.append('followers', form.followers.trim());
      fd.append('handle', form.handle.trim());
      fd.append('productsCurated', String(form.productsCurated));

      const file = imageFile || fileInputRef.current?.files?.[0];
      if (file) {
        fd.append('avatar', file);
      }

      if (editing) {
        await api.put(`/affiliates/${editing.id}`, fd);
        toast.success('Affiliate updated successfully.');
      } else {
        await api.post('/affiliates', fd);
        toast.success('Affiliate created successfully.');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save affiliate');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this affiliate? This action cannot be undone.')) return;
    try {
      await api.delete(`/affiliates/${id}`);
      toast.success('Affiliate permanently deleted.');
      load();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete affiliate.');
    }
  };

  return (
    <AdminLayout title="Affiliates">
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-brand-grey">
          {affiliates.length} affiliates · ₹{affiliates.reduce((s, a) => s + Number(a.totalEarnings || 0), 0).toLocaleString('en-IN')} total paid out
        </p>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2" id="add-affiliate-btn">
          <Plus size={16} /> Add Affiliate
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-brand-grey">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-brand-light">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse" aria-label="Affiliates table">
              <thead>
                <tr className="bg-brand-light/40 border-b border-brand-light">
                  {['Influencer', 'Email', 'Referral Code', 'Followers', 'Commission', 'Earnings', 'Clicks', 'Orders', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-4 text-xs font-semibold text-brand-grey uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-light">
                {affiliates.map(a => (
                  <tr key={a.id} className="hover:bg-brand-light/10 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-brand-light bg-neutral-100 flex items-center justify-center">
                          {a.avatar ? (
                            <img src={a.avatar} alt={a.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-brand-text font-bold text-xs">{a.name[0]}</span>
                          )}
                        </div>
                        <p className="font-semibold text-brand-text">{a.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-brand-grey">{a.email}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-brand-light text-brand-text px-2 py-0.5 rounded border border-brand-light/60">
                          {a.referralCode}
                        </span>
                        <button
                          onClick={() => handleCopyLink(a.referralCode)}
                          className="p-1 text-brand-grey hover:text-brand-gold hover:bg-brand-light rounded transition-all"
                          title="Copy Referral Link"
                          id={`copy-aff-${a.id}`}
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-brand-text">{a.followers || '0'}</td>
                    <td className="px-5 py-4 font-semibold text-brand-text">{a.commissionRate}%</td>
                    <td className="px-5 py-4 font-semibold text-green-700">
                      ₹{Number(a.totalEarnings || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4 text-brand-grey">{Number(a.totalClicks || 0).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-4 font-medium text-brand-text">{a.totalOrders || 0}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center">
                        <Switch
                          checked={a.isActive}
                          onChange={() => handleToggleActive(a)}
                          id={`toggle-aff-${a.id}`}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openModal(a)} className="p-2 text-brand-grey hover:text-brand-gold hover:bg-brand-light/35 rounded transition-colors" id={`edit-aff-${a.id}`} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(a.id)} className="p-2 text-brand-grey hover:text-red-500 hover:bg-red-50 rounded transition-colors" id={`del-aff-${a.id}`} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && !saving && setModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-brand-light">
              <h3 className="font-playfair text-lg font-semibold text-brand-text">
                {editing ? 'Edit Affiliate Profile' : 'Add New Affiliate'}
              </h3>
              <button onClick={() => !saving && setModalOpen(false)} className="text-brand-grey hover:text-brand-text">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <p className="text-red-500 text-xs bg-red-50 p-2.5 rounded border border-red-200">{error}</p>}
              
              <div>
                <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="aff-name">Full Name *</label>
                <input id="aff-name" type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors" />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="aff-email">Email Address *</label>
                <input id="aff-email" type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="aff-code">Referral Code *</label>
                  <div className="relative">
                    <input
                      id="aff-code"
                      type="text"
                      required
                      value={form.referralCode}
                      onChange={e => setForm({...form, referralCode: e.target.value.toUpperCase().replace(/\s+/g, '')})}
                      className="w-full border border-brand-light pl-3 pr-8 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, referralCode: generateUniqueCode() }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-grey hover:text-brand-gold transition-colors"
                      title="Generate Unique Code"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="aff-rate">Commission Rate (%)</label>
                  <input id="aff-rate" type="number" step="0.1" required value={form.commissionRate} onChange={e => setForm({...form, commissionRate: parseFloat(e.target.value) || 0})} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="aff-handle">Social Handle (e.g. @arya_official)</label>
                <input id="aff-handle" type="text" value={form.handle} onChange={e => setForm({...form, handle: e.target.value})} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors" placeholder="@handle" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="aff-followers">Followers (e.g. 150K, 1.2M)</label>
                  <input id="aff-followers" type="text" value={form.followers} onChange={e => setForm({...form, followers: e.target.value})} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors" placeholder="e.g. 150K" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="aff-products-curated">Products Curated</label>
                  <input id="aff-products-curated" type="number" value={form.productsCurated} onChange={e => setForm({...form, productsCurated: parseInt(e.target.value) || 0})} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors" />
                </div>
              </div>

              {/* Avatar upload zone */}
              <div>
                <label className="block text-xs font-medium text-brand-grey mb-1.5">Avatar Image</label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                    isDragging ? 'border-brand-gold bg-brand-gold/5' : 'border-brand-light hover:border-brand-gold'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      processFile(file);
                    }
                  }}
                >
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Avatar Preview" className="max-h-24 mx-auto object-contain rounded-full w-24 h-24 border border-brand-light" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute top-0 right-1/3 bg-white/80 p-1 rounded-full hover:bg-white border border-brand-light shadow-sm transition-colors">
                        <X size={12} className="text-brand-text" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-2">
                      <Upload size={20} className="mx-auto text-brand-grey mb-1.5" />
                      <p className="text-xs text-brand-grey font-medium">Drag & drop image or click to upload</p>
                      <p className="text-[9px] text-brand-grey/60 mt-0.5">JPEG, PNG, WebP — max 5MB</p>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />
              </div>

              <div className="flex gap-3 pt-4 border-t border-brand-light">
                <button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="btn-outline flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex items-center justify-center gap-2 flex-1">
                  <Save size={15} /> {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AffiliatesAdminPage;
