import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, ToggleLeft, ToggleRight } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import api from '../services/api';

const BannersAdminPage = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', subtitle: '', image: '', type: 'HERO', ctaText: '', ctaLink: '', position: 1, isActive: true });

  const load = async () => {
    try { setLoading(true); const res = await api.get('/banners'); setBanners(res.data.banners || []); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openModal = (b = null) => { setEditing(b); setForm(b || { title: '', subtitle: '', image: '', type: 'HERO', ctaText: '', ctaLink: '', position: 1, isActive: true }); setModalOpen(true); };
  const handleSave = async (e) => { e.preventDefault(); try { if (editing) await api.put(`/banners/${editing.id}`, form); else await api.post('/banners', form); setModalOpen(false); load(); } catch(err){console.error(err);} };
  const handleDelete = async (id) => { if (window.confirm('Delete this banner?')) { try { await api.delete(`/banners/${id}`); load(); } catch(err){console.error(err);} } };
  const handleToggle = async (b) => { try { await api.put(`/banners/${b.id}`, { ...b, isActive: !b.isActive }); load(); } catch(err){console.error(err);} };

  return (
    <AdminLayout title="Banners">
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-brand-grey">{banners.length} banners</p>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2" id="add-banner-btn"><Plus size={16} /> Add Banner</button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map(banner => (
            <div key={banner.id} className="bg-white rounded-xl shadow-sm overflow-hidden group">
              <div className="relative h-40 bg-brand-light">
                <img src={banner.image || 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400'} alt={banner.title} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <span className="bg-brand-gold text-white text-[10px] font-bold px-2 py-0.5 rounded">{banner.type}</span>
                  <span className="bg-white/90 text-brand-text text-[10px] font-bold px-2 py-0.5 rounded">Pos: {banner.position}</span>
                </div>
              </div>
              <div className="p-4">
                <p className="font-medium text-sm mb-1 line-clamp-1">{banner.title}</p>
                <p className="text-xs text-brand-grey line-clamp-1">{banner.subtitle}</p>
                <div className="flex items-center justify-between mt-3">
                  <button onClick={() => handleToggle(banner)} className="text-brand-grey hover:text-brand-gold transition-colors focus-visible:outline-brand-gold" id={`toggle-banner-${banner.id}`}>
                    {banner.isActive ? <ToggleRight size={22} className="text-brand-gold" /> : <ToggleLeft size={22} />}
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(banner)} className="p-1.5 text-brand-grey hover:text-brand-gold focus-visible:outline-brand-gold" id={`edit-banner-${banner.id}`}><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(banner.id)} className="p-1.5 text-brand-grey hover:text-red-400 focus-visible:outline-brand-gold" id={`del-banner-${banner.id}`}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="bg-white rounded-xl w-full max-w-lg">
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-light">
                <h2 className="font-playfair text-lg font-semibold">{editing ? 'Edit Banner' : 'Add Banner'}</h2>
                <button onClick={() => setModalOpen(false)} className="p-1.5 hover:text-brand-gold"><X size={18} /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                {[{k:'title',l:'Title *',req:true},{k:'subtitle',l:'Subtitle'},{k:'image',l:'Image URL *',req:true},{k:'ctaText',l:'CTA Button Text'},{k:'ctaLink',l:'CTA Link'}].map(({k,l,req}) => (
                  <div key={k}><label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor={`ban-${k}`}>{l}</label><input id={`ban-${k}`} type="text" value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} required={req} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" /></div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="ban-type">Type</label><select id="ban-type" value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"><option>HERO</option><option>PROMO</option><option>CATEGORY</option><option>SALE</option></select></div>
                  <div><label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="ban-pos">Position</label><input id="ban-pos" type="number" value={form.position} onChange={e=>setForm(p=>({...p,position:Number(e.target.value)}))} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" /></div>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={e=>setForm(p=>({...p,isActive:e.target.checked}))} className="accent-brand-gold" id="ban-active" /> Active</label>
                <div className="flex gap-3 pt-2 border-t border-brand-light">
                  <button type="button" onClick={()=>setModalOpen(false)} className="btn-outline flex-1" id="ban-cancel">Cancel</button>
                  <button type="submit" className="btn-primary flex-1" id="ban-save">Save Banner</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};
export default BannersAdminPage;
