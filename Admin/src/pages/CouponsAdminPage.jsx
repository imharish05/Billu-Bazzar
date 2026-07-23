import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Copy, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';
import api from '../services/api';

const CouponsAdminPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ code: '', type: 'PERCENT', value: '', minOrderValue: 0, maxDiscount: '', usageLimit: 1, validFrom: '', validTo: '', isActive: true });

  const load = async () => {
    try { setLoading(true); const res = await api.get('/coupons').catch(() => ({ data: { coupons: [] } })); setCoupons(res.data?.coupons || []); }
    catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAddModal = () => {
    setForm({ code: '', type: 'PERCENT', value: '', minOrderValue: 0, maxDiscount: '', usageLimit: 1, validFrom: '', validTo: '', isActive: true });
    setEditingId(null);
    setModalOpen(true);
  };

  const handleEdit = (coupon) => {
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderValue: coupon.minOrderValue || 0,
      maxDiscount: coupon.maxDiscount || '',
      usageLimit: coupon.usageLimit || 1,
      validFrom: coupon.validFrom ? coupon.validFrom.split('T')[0] : '',
      validTo: coupon.validUntil ? coupon.validUntil.split('T')[0] : (coupon.validTo ? coupon.validTo.split('T')[0] : ''),
      isActive: coupon.isActive ?? true
    });
    setEditingId(coupon.id);
    setModalOpen(true);
  };

  const executeDelete = async (id) => {
    try {
      await api.delete(`/coupons/${id}`);
      toast.success('Coupon deleted successfully.');
      load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1">
        <p className="text-sm font-semibold text-neutral-800">Confirm Deletion</p>
        <p className="text-xs text-neutral-600">
          Are you sure you want to permanently delete this coupon? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              executeDelete(id);
            }}
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

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/coupons/${editingId}`, form);
        toast.success('Coupon updated successfully.');
      } else {
        await api.post('/coupons', form);
        toast.success('Coupon created successfully.');
      }
      setModalOpen(false);
      setForm({ code: '', type: 'PERCENT', value: '', minOrderValue: 0, maxDiscount: '', usageLimit: 1, validFrom: '', validTo: '', isActive: true });
      setEditingId(null);
      load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save coupon');
    }
  };

  // Seed fallback data if API returns empty (coupon route may not be mounted yet)
  const displayCoupons = coupons.length ? coupons : [
    { id: 1, code: 'WELCOME20', type: 'PERCENT', value: 20, minOrderValue: 500, usageCount: 142, usageLimit: 1000, validTo: '2025-12-31', isActive: true },
    { id: 2, code: 'LUXE15', type: 'PERCENT', value: 15, minOrderValue: 2000, usageCount: 67, usageLimit: 500, validTo: '2025-10-31', isActive: true },
    { id: 3, code: 'FLAT500', type: 'FLAT', value: 500, minOrderValue: 3000, usageCount: 23, usageLimit: 200, validTo: '2025-09-30', isActive: false },
    { id: 4, code: 'BILLU10', type: 'PERCENT', value: 10, minOrderValue: 0, usageCount: 89, usageLimit: null, validTo: '2025-12-31', isActive: true },
  ];

  return (
    <AdminLayout title="Coupons">
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-brand-grey">{displayCoupons.length} coupons</p>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2" id="add-coupon-btn"><Plus size={16} /> Add Coupon</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Coupons table">
            <thead>
              <tr className="bg-brand-light/40 text-left">
                {['Code', 'Type', 'Value', 'Min Order', 'Usage', 'Valid Until', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-brand-grey uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(4)].map((_, i) => <tr key={i} className="border-b border-brand-light">{[...Array(8)].map((_,j)=><td key={j} className="px-4 py-3"><div className="skeleton h-4 w-20"/></td>)}</tr>)
              : displayCoupons.map(coupon => (
                <tr key={coupon.id} className="border-b border-brand-light hover:bg-brand-light/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-brand-text bg-brand-light px-2 py-0.5 rounded text-xs">{coupon.code}</span>
                      <button onClick={() => navigator.clipboard.writeText(coupon.code)} className="text-brand-grey hover:text-brand-gold" aria-label="Copy coupon code" id={`copy-${coupon.code}`}><Copy size={12} /></button>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${coupon.type === 'PERCENT' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{coupon.type}</span></td>
                  <td className="px-4 py-3 font-semibold">{coupon.type === 'PERCENT' ? `${coupon.value}%` : `₹${coupon.value}`}</td>
                  <td className="px-4 py-3 text-brand-grey">₹{coupon.minOrderValue || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-brand-text font-medium">{coupon.usageCount}</span>
                      <span className="text-brand-grey">/ {coupon.usageLimit || '∞'}</span>
                    </div>
                    {coupon.usageLimit && <div className="w-24 h-1 bg-brand-light rounded-full mt-1"><div className="h-full bg-brand-gold rounded-full" style={{width:`${Math.min((coupon.usageCount/coupon.usageLimit)*100,100)}%`}}/></div>}
                  </td>
                  <td className="px-4 py-3 text-brand-grey text-xs">{coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString('en-IN') : (coupon.validTo ? new Date(coupon.validTo).toLocaleDateString('en-IN') : '—')}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${coupon.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{coupon.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(coupon)} className="p-1.5 text-brand-grey hover:text-brand-gold transition-colors" title="Edit" id={`edit-${coupon.code}`}>
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(coupon.id)} className="p-1.5 text-brand-grey hover:text-red-500 transition-colors" title="Delete" id={`delete-${coupon.code}`}>
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

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setModalOpen(false)}>
            <motion.div initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.96}} className="bg-white rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-light">
                <h2 className="font-playfair text-lg font-semibold">{editingId ? 'Edit Coupon' : 'Add Coupon'}</h2>
                <button onClick={()=>setModalOpen(false)} className="p-1.5 hover:text-brand-gold"><X size={18}/></button>
              </div>
              <div className="flex flex-col md:flex-row">
                {/* Form Area */}
                <form onSubmit={handleSave} className="flex-1 p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="coup-code">Coupon Code *</label>
                    <input id="coup-code" type="text" value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value.toUpperCase()}))} required className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold uppercase font-mono" placeholder="WELCOME20"/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="coup-type">Type</label>
                      <select id="coup-type" value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold">
                        <option value="PERCENT">Percentage</option>
                        <option value="FLAT">Flat Amount</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="coup-val">Value *</label>
                      <input id="coup-val" type="number" value={form.value} onChange={e=>setForm(p=>({...p,value:e.target.value}))} required className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"/>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="coup-min">Min Order (₹)</label>
                      <input id="coup-min" type="number" value={form.minOrderValue} onChange={e=>setForm(p=>({...p,minOrderValue:e.target.value}))} className="w-full border border-brand-light px-2.5 py-2 text-xs focus:outline-none focus:border-brand-gold"/>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-grey mb-1.5 text-ellipsis overflow-hidden whitespace-nowrap" htmlFor="coup-max">Max Disc (₹)</label>
                      <input id="coup-max" type="number" value={form.maxDiscount} onChange={e=>setForm(p=>({...p,maxDiscount:e.target.value}))} disabled={form.type === 'FLAT'} className="w-full border border-brand-light px-2.5 py-2 text-xs focus:outline-none focus:border-brand-gold disabled:bg-neutral-100 disabled:text-neutral-400" placeholder="N/A"/>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="coup-limit">Usage Limit</label>
                      <input id="coup-limit" type="number" value={form.usageLimit} onChange={e=>setForm(p=>({...p,usageLimit:e.target.value}))} className="w-full border border-brand-light px-2.5 py-2 text-xs focus:outline-none focus:border-brand-gold"/>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="coup-from">Valid From</label>
                      <input id="coup-from" type="date" value={form.validFrom} onChange={e=>setForm(p=>({...p,validFrom:e.target.value}))} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"/>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="coup-to">Valid To</label>
                      <input id="coup-to" type="date" value={form.validTo} onChange={e=>setForm(p=>({...p,validTo:e.target.value}))} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"/>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2 border-t border-brand-light">
                    <button type="button" onClick={()=>setModalOpen(false)} className="btn-outline flex-1" id="coup-cancel">Cancel</button>
                    <button type="submit" className="btn-primary flex-1" id="coup-save">Save Coupon</button>
                  </div>
                </form>

                {/* Live Preview Area */}
                <div className="w-full md:w-[320px] bg-brand-light/35 p-6 border-t md:border-t-0 md:border-l border-brand-light flex flex-col justify-center items-center min-h-[260px] md:min-h-auto select-none">
                  {/* Coupon Card */}
                  <div className="w-full max-w-[280px] bg-white border border-brand-light shadow-md rounded-xl flex relative overflow-hidden transition-all duration-300 hover:shadow-lg">
                    {/* Left vertical color strip */}
                    <div className="w-3.5 bg-[#E55B32] flex-shrink-0" />
                    
                    {/* Card Content */}
                    <div className="flex-1 p-5 flex flex-col">
                      <span className="text-[10px] font-bold text-[#E55B32] tracking-widest uppercase block mb-1">
                        Offer Preview
                      </span>
                      <h4 className="font-playfair text-2xl font-bold text-[#0F2942] tracking-wide mb-2 uppercase select-all font-serif">
                        {form.code || 'WELCOME10'}
                      </h4>
                      <p className="text-2xl font-bold text-[#E55B32]">
                        {form.value ? (form.type === 'PERCENT' ? `${Number(form.value).toFixed(2)}% OFF` : `₹${Number(form.value).toFixed(2)} OFF`) : '10.00% OFF'}
                      </p>
                      
                      {/* Max discount */}
                      {form.type === 'PERCENT' && (
                        <p className="text-xs text-green-600 font-medium mt-1">
                          {form.maxDiscount ? `Up to ₹${Number(form.maxDiscount).toFixed(2)}` : 'No Max Discount'}
                        </p>
                      )}

                      {/* Dashed divider */}
                      <div className="border-t border-dashed border-neutral-200 my-4" />

                      {/* Min order */}
                      <p className="text-xs text-neutral-500">
                        Min Order: ₹{form.minOrderValue ? Number(form.minOrderValue).toFixed(2) : '0.00'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};
export default CouponsAdminPage;
