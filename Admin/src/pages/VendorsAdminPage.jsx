import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Store, Star, Mail, Phone, Percent, MapPin } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import Switch from '../components/Switch';
import api from '../services/api';
import toast from 'react-hot-toast';

const VendorsAdminPage = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    gstin: '',
    commissionRate: 10.0,
    rating: 4.0,
    isActive: true,
    address: { street: '', city: '', state: '', zip: '' }
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadVendors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/vendors?all=true');
      setVendors(res.data.vendors || []);
    } catch (err) {
      console.error('Error loading vendors:', err);
      toast.error('Failed to load vendors.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const openModal = (vendor = null) => {
    setEditing(vendor);
    setError(null);
    setForm(vendor ? {
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone || '',
      gstin: vendor.gstin || '',
      commissionRate: vendor.commissionRate !== undefined ? vendor.commissionRate : 10.0,
      rating: vendor.rating !== undefined ? vendor.rating : 4.0,
      isActive: vendor.isActive,
      address: {
        street: vendor.address?.street || '',
        city: vendor.address?.city || '',
        state: vendor.address?.state || '',
        zip: vendor.address?.zip || ''
      }
    } : {
      name: '',
      email: '',
      phone: '',
      gstin: '',
      commissionRate: 10.0,
      rating: 4.0,
      isActive: true,
      address: { street: '', city: '', state: '', zip: '' }
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        gstin: form.gstin.trim(),
        commissionRate: parseFloat(form.commissionRate) || 0.0,
        rating: parseFloat(form.rating) || 4.0,
      };

      if (editing) {
        await api.put(`/vendors/${editing.id}`, payload);
        toast.success('Vendor updated successfully.');
      } else {
        await api.post('/vendors', payload);
        toast.success('Vendor created successfully.');
      }

      setModalOpen(false);
      loadVendors();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save vendor');
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async (id) => {
    try {
      const deleteRes = await api.delete(`/vendors/${id}`);
      toast.success(deleteRes.data.message || 'Vendor deleted successfully.');
      loadVendors();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete vendor');
    }
  };

  const handleDelete = (id, name) => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1">
        <p className="text-sm font-semibold text-neutral-800">Confirm Deletion</p>
        <p className="text-xs text-neutral-600">
          Are you sure you want to permanently delete vendor <strong>{name}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={() => { toast.dismiss(t.id); executeDelete(id); }}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors rounded shadow-sm"
          >
            Yes, Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold uppercase tracking-wider transition-colors rounded border border-neutral-200"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 10000, position: 'top-center', style: { minWidth: '350px' } });
  };

  return (
    <AdminLayout title="Vendors">
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-brand-grey">{vendors.length} vendors total</p>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2" id="add-vendor-btn">
          <Plus size={16} /> Add Vendor
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-12 w-full rounded-lg" />)}
          </div>
        ) : vendors.length === 0 ? (
          <div className="p-12 text-center">
            <Store size={48} className="mx-auto text-brand-grey/50 mb-3" />
            <p className="font-playfair text-xl text-brand-grey">No vendors yet</p>
            <button onClick={() => openModal()} className="btn-primary mt-4" id="add-first-vendor">Add First Vendor</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" aria-label="Vendors table">
              <thead>
                <tr className="border-b border-brand-light bg-brand-light/20 text-brand-grey text-xs font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3 w-16">NO</th>
                  <th className="px-5 py-3">Vendor</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3 w-28">Commission</th>
                  <th className="px-5 py-3 w-28">Rating</th>
                  <th className="px-5 py-3 w-28">Products</th>
                  <th className="px-5 py-3 w-28">Status</th>
                  <th className="px-5 py-3 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-light text-sm">
                {vendors.map((v, idx) => (
                  <tr key={v.id} className="hover:bg-brand-light/20 transition-colors">
                    <td className="px-5 py-4 font-medium text-brand-grey">{idx + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-brand-gold/10 flex items-center justify-center border border-brand-gold/20">
                          <span className="text-brand-gold font-bold text-sm">{v.name.substring(0, 2).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-brand-text">{v.name}</p>
                          {v.gstin && <p className="text-[10px] bg-neutral-100 text-brand-grey px-1.5 py-0.5 rounded mt-0.5 inline-block font-mono">GSTIN: {v.gstin}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-xs text-brand-grey">
                          <Mail size={12} />
                          <span>{v.email}</span>
                        </div>
                        {v.phone && (
                          <div className="flex items-center gap-1 text-xs text-brand-grey">
                            <Phone size={12} />
                            <span>{v.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-brand-text">
                      <div className="flex items-center gap-0.5">
                        <span>{v.commissionRate}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1 text-brand-gold font-semibold">
                        <Star size={14} className="fill-brand-gold" />
                        <span>{v.rating}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 text-brand-grey font-medium">
                      {v.products?.length || 0} items
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        v.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'
                      }`}>
                        {v.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => openModal(v)} className="p-2 text-brand-grey hover:text-brand-gold hover:bg-brand-light/30 rounded transition-colors" id={`edit-vendor-${v.id}`} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(v.id, v.name)} className="p-2 text-brand-grey hover:text-red-500 hover:bg-red-50 rounded transition-colors" id={`del-vendor-${v.id}`} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && !saving && setModalOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="bg-white rounded-xl w-full max-w-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-light flex-shrink-0">
                <h2 className="font-playfair text-lg font-semibold">{editing ? 'Edit Vendor' : 'Add Vendor'}</h2>
                <button onClick={() => !saving && setModalOpen(false)} className="p-1.5 hover:text-brand-gold focus-visible:outline-brand-gold transition-colors"><X size={18} /></button>
              </div>
              
              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
                {error && (
                  <div className="text-xs text-red-500 bg-red-50 border border-red-200 p-3 rounded">{error}</div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="vendor-name">Vendor Name *</label>
                    <input id="vendor-name" type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors" placeholder="e.g. Sabyasachi Mukherjee House" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="vendor-email">Email Address *</label>
                    <input id="vendor-email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors" placeholder="contact@vendor.com" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="vendor-phone">Phone Number</label>
                    <input id="vendor-phone" type="text" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors" placeholder="e.g. 9876543210" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="vendor-gstin">GSTIN</label>
                    <input id="vendor-gstin" type="text" value={form.gstin} onChange={e => setForm(p => ({ ...p, gstin: e.target.value }))} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors font-mono" placeholder="27AAACZ1234A1Z5" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="vendor-comm">Commission Rate (%)</label>
                    <div className="relative">
                      <input id="vendor-comm" type="number" min="0" max="100" step="0.01" value={form.commissionRate} onChange={e => setForm(p => ({ ...p, commissionRate: e.target.value }))} className="w-full border border-brand-light pl-3 pr-8 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors" placeholder="10.0" />
                      <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-grey" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="vendor-rating">Rating (1.0 - 5.0)</label>
                    <div className="relative">
                      <input id="vendor-rating" type="number" min="1" max="5" step="0.1" value={form.rating} onChange={e => setForm(p => ({ ...p, rating: e.target.value }))} className="w-full border border-brand-light pl-3 pr-8 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors" placeholder="4.0" />
                      <Star size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-grey" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-brand-light pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-grey mb-3 flex items-center gap-1">
                    <MapPin size={12} /> Address Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-medium text-brand-grey mb-1" htmlFor="addr-street">Street Address</label>
                      <input id="addr-street" type="text" value={form.address.street} onChange={e => setForm(p => ({ ...p, address: { ...p.address, street: e.target.value } }))} className="w-full border border-brand-light px-3 py-1.5 text-xs focus:outline-none focus:border-brand-gold transition-colors" placeholder="Suite 101, Business Park" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-brand-grey mb-1" htmlFor="addr-city">City</label>
                      <input id="addr-city" type="text" value={form.address.city} onChange={e => setForm(p => ({ ...p, address: { ...p.address, city: e.target.value } }))} className="w-full border border-brand-light px-3 py-1.5 text-xs focus:outline-none focus:border-brand-gold transition-colors" placeholder="Mumbai" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-brand-grey mb-1" htmlFor="addr-state">State</label>
                      <input id="addr-state" type="text" value={form.address.state} onChange={e => setForm(p => ({ ...p, address: { ...p.address, state: e.target.value } }))} className="w-full border border-brand-light px-3 py-1.5 text-xs focus:outline-none focus:border-brand-gold transition-colors" placeholder="Maharashtra" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-brand-grey mb-1" htmlFor="addr-zip">Postal / ZIP Code</label>
                      <input id="addr-zip" type="text" value={form.address.zip} onChange={e => setForm(p => ({ ...p, address: { ...p.address, zip: e.target.value } }))} className="w-full border border-brand-light px-3 py-1.5 text-xs focus:outline-none focus:border-brand-gold transition-colors" placeholder="400001" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-brand-light">
                  <Switch checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} id="vendor-active" />
                  <label className="text-xs font-semibold text-brand-text cursor-pointer select-none" htmlFor="vendor-active">Active Status (Visible in store)</label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-brand-light flex-shrink-0">
                  <button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="btn-outline flex-1" id="vendor-cancel">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1" id="vendor-save">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default VendorsAdminPage;
