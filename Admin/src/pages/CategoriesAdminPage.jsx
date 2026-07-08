import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, X } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import api from '../services/api';

const CategoriesAdminPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', parentId: '', isActive: true });

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories/tree');
      setCategories(res.data.categories || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadCategories(); }, []);

  const openModal = (cat = null) => {
    setEditing(cat);
    setForm(cat ? { name: cat.name, slug: cat.slug, description: cat.description || '', parentId: cat.parentId || '', isActive: cat.isActive } : { name: '', slug: '', description: '', parentId: '', isActive: true });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/categories/${editing.id}`, form);
      else await api.post('/categories', form);
      setModalOpen(false); loadCategories();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try { await api.delete(`/categories/${id}`); loadCategories(); } catch (err) { console.error(err); }
  };

  return (
    <AdminLayout title="Categories">
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-brand-grey">{categories.length} parent categories</p>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2" id="add-cat-btn"><Plus size={16} /> Add Category</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-12 w-full rounded-lg" />)}</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-playfair text-xl text-brand-grey">No categories yet</p>
            <button onClick={() => openModal()} className="btn-primary mt-4" id="add-first-cat">Add First Category</button>
          </div>
        ) : (
          <div className="divide-y divide-brand-light">
            {categories.map(cat => (
              <div key={cat.id}>
                {/* Parent row */}
                <div className="flex items-center gap-3 px-5 py-4 hover:bg-brand-light/20 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-brand-gold/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-gold text-xs font-bold">{cat.name[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{cat.name}</p>
                    <p className="text-xs text-brand-grey">/{cat.slug} · {cat.children?.length || 0} subcategories</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${cat.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{cat.isActive ? 'Active' : 'Inactive'}</span>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(cat)} className="p-1.5 text-brand-grey hover:text-brand-gold focus-visible:outline-brand-gold" id={`edit-cat-${cat.id}`}><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-brand-grey hover:text-red-400 focus-visible:outline-brand-gold" id={`del-cat-${cat.id}`}><Trash2 size={14} /></button>
                  </div>
                </div>
                {/* Children */}
                {cat.children?.map(child => (
                  <div key={child.id} className="flex items-center gap-3 px-5 py-3 pl-14 bg-brand-light/20 hover:bg-brand-light/40 transition-colors border-t border-brand-light">
                    <ChevronRight size={12} className="text-brand-grey -ml-4" />
                    <div className="flex-1">
                      <p className="text-sm text-brand-grey">{child.name}</p>
                      <p className="text-[11px] text-brand-grey/60">/{child.slug}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openModal(child)} className="p-1.5 text-brand-grey hover:text-brand-gold focus-visible:outline-brand-gold" id={`edit-cat-${child.id}`}><Edit2 size={13} /></button>
                      <button onClick={() => handleDelete(child.id)} className="p-1.5 text-brand-grey hover:text-red-400 focus-visible:outline-brand-gold" id={`del-cat-${child.id}`}><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="bg-white rounded-xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-light">
                <h2 className="font-playfair text-lg font-semibold">{editing ? 'Edit Category' : 'Add Category'}</h2>
                <button onClick={() => setModalOpen(false)} className="p-1.5 hover:text-brand-gold focus-visible:outline-brand-gold"><X size={18} /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                {[{k:'name',l:'Name *',req:true},{k:'slug',l:'Slug'},{k:'description',l:'Description'}].map(({k,l,req}) => (
                  <div key={k}>
                    <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor={`cat-${k}`}>{l}</label>
                    <input id={`cat-${k}`} type="text" value={form[k]} onChange={e => setForm(p=>({...p,[k]:e.target.value}))} required={req} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="cat-parent">Parent Category (leave blank for parent)</label>
                  <select id="cat-parent" value={form.parentId} onChange={e => setForm(p=>({...p,parentId:e.target.value}))} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold">
                    <option value="">None (Parent Category)</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(p=>({...p,isActive:e.target.checked}))} className="accent-brand-gold" id="cat-active" /> Active
                </label>
                <div className="flex gap-3 pt-2 border-t border-brand-light">
                  <button type="button" onClick={() => setModalOpen(false)} className="btn-outline flex-1" id="cat-cancel">Cancel</button>
                  <button type="submit" className="btn-primary flex-1" id="cat-save">Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default CategoriesAdminPage;
