import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Upload } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import api from '../services/api';
import toast from 'react-hot-toast';

const SubCategoriesAdminPage = () => {
  const [parentCategories, setParentCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({ categoryId: '', name: '', slug: '', isActive: true });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const fileInputRef = useRef(null);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch top level Categories
      const categoriesRes = await api.get('/categories?all=true');
      const parents = categoriesRes.data.categories || [];
      setParentCategories(parents);

      // Fetch SubCategories from individual endpoint
      const subRes = await api.get('/subcategories?all=true');
      const subs = subRes.data.subCategories || [];
      setSubCategories(subs);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load categories data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = (sub = null) => {
    setEditing(sub);
    setForm(sub ? {
      categoryId: String(sub.categoryId || ''),
      name: sub.name,
      slug: sub.slug || '',
      isActive: sub.isActive
    } : {
      categoryId: parentCategories[0]?.id ? String(parentCategories[0].id) : '',
      name: '',
      slug: '',
      isActive: true
    });
    setImagePreview(sub?.image || null);
    setImageFile(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setModalOpen(true);
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    const slugVal = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setForm(p => ({ ...p, name: val, slug: slugVal }));
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
    if (!form.categoryId) {
      setUploadError('Please select a category');
      return;
    }
    setSaving(true);
    setUploadError(null);

    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('slug', form.slug.trim());
      fd.append('isActive', String(form.isActive));
      fd.append('categoryId', form.categoryId);

      const file = imageFile || fileInputRef.current?.files?.[0];
      if (file) {
        fd.append('image', file);
      }

      if (editing) {
        await api.put(`/subcategories/${editing.id}`, fd);
        toast.success('Sub-category updated successfully.');
      } else {
        await api.post('/subcategories', fd);
        toast.success('Sub-category created successfully.');
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      setUploadError(err.response?.data?.message || err.message || 'Failed to save sub-category');
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async (id) => {
    try {
      const deleteRes = await api.delete(`/subcategories/${id}`);
      toast.success(deleteRes.data.message || 'Sub-category deleted successfully.');
      loadData();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to delete sub-category';
      toast.error(errMsg);
      console.error(err);
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1">
        <p className="text-sm font-semibold text-neutral-800">Confirm Deletion</p>
        <p className="text-xs text-neutral-600">
          Are you sure you want to permanently delete this sub-category? This will delete all sub-subcategories under it and cannot be undone.
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
    ), {
      duration: 10000,
      position: 'top-center',
      style: { minWidth: '350px' }
    });
  };

  const getParentName = (categoryId) => {
    const parent = parentCategories.find(p => p.id === categoryId);
    return parent ? parent.name : '—';
  };

  return (
    <AdminLayout title="Sub-categories">
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-brand-grey">{subCategories.length} sub-categories</p>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2" id="add-subcat-btn" disabled={parentCategories.length === 0}>
          <Plus size={16} /> Add Sub-category
        </button>
      </div>

      {parentCategories.length === 0 && !loading && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg">
          Please add at least one Category before creating a sub-category.
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-12 w-full rounded-lg" />)}
          </div>
        ) : subCategories.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-playfair text-xl text-brand-grey">No sub-categories yet</p>
            <button onClick={() => openModal()} className="btn-primary mt-4" id="add-first-subcat" disabled={parentCategories.length === 0}>Add First Sub-category</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-light bg-brand-light/20 text-brand-grey text-xs font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3 w-16">NO</th>
                  <th className="px-5 py-3 w-24">Image</th>
                  <th className="px-5 py-3">Category Name</th>
                  <th className="px-5 py-3">Sub-category Name</th>
                  <th className="px-5 py-3 w-32">Status</th>
                  <th className="px-5 py-3 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-light text-sm">
                {subCategories.map((sub, idx) => (
                  <tr key={sub.id} className="hover:bg-brand-light/10 transition-colors">
                    <td className="px-5 py-4 font-medium text-brand-grey">{idx + 1}</td>
                    <td className="px-5 py-4">
                      <div className="w-10 h-10 rounded bg-brand-light overflow-hidden border border-brand-light flex items-center justify-center">
                        {sub.image ? (
                          <img src={sub.image} alt={sub.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-brand-grey text-[10px] font-bold uppercase">{sub.name.substring(0, 2)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-brand-text">
                      {getParentName(sub.categoryId)}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-brand-text">{sub.name}</p>
                      <p className="text-xs text-brand-grey">/{sub.slug}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        sub.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'
                      }`}>
                        {sub.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => openModal(sub)} className="p-2 text-brand-grey hover:text-brand-gold hover:bg-brand-light/30 rounded transition-colors" id={`edit-sub-${sub.id}`} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(sub.id)} className="p-2 text-brand-grey hover:text-red-500 hover:bg-red-50 rounded transition-colors" id={`del-sub-${sub.id}`} title="Delete">
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
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-light">
                <h2 className="font-playfair text-lg font-semibold">{editing ? 'Edit Sub-category' : 'Add Sub-category'}</h2>
                <button onClick={() => !saving && setModalOpen(false)} className="p-1.5 hover:text-brand-gold focus-visible:outline-brand-gold transition-colors"><X size={18} /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                {uploadError && (
                  <div className="text-xs text-red-500 bg-red-50 border border-red-200 p-3 rounded">{uploadError}</div>
                )}
                
                {/* Parent Category Selector */}
                <div>
                  <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="sub-parent">Category *</label>
                  <select id="sub-parent" value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))} required className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors bg-white">
                    <option value="" disabled>Select category...</option>
                    {parentCategories.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="sub-name">Sub-category Name *</label>
                  <input id="sub-name" type="text" value={form.name} onChange={handleNameChange} required className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors" placeholder="e.g. Lehenga Sets" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="sub-slug">Slug</label>
                  <input id="sub-slug" type="text" value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} className="w-full border border-brand-light bg-neutral-50 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors" placeholder="lehenga-sets" />
                </div>

                {/* Subcategory Image upload zone */}
                <div>
                  <label className="block text-xs font-medium text-brand-grey mb-1.5">Sub-category Image</label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                      isDragging
                        ? 'border-brand-gold bg-brand-gold/5'
                        : 'border-brand-light hover:border-brand-gold'
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
                        <img src={imagePreview} alt="Preview" className="max-h-36 mx-auto object-contain rounded" />
                        <button type="button" onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute top-1 right-1 bg-white/80 p-1 rounded-full hover:bg-white border border-brand-light shadow-sm transition-colors">
                          <X size={12} className="text-brand-text" />
                        </button>
                      </div>
                    ) : (
                      <div className="py-4">
                        <Upload size={24} className="mx-auto text-brand-grey mb-1.5" />
                        <p className="text-xs text-brand-grey font-medium">Drag & drop image here, or click to upload</p>
                        <p className="text-[10px] text-brand-grey/60 mt-0.5">JPEG, PNG, WebP — max 10MB</p>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="accent-brand-gold w-4 h-4 cursor-pointer" id="sub-active" />
                  <label className="text-xs font-semibold text-brand-text cursor-pointer select-none" htmlFor="sub-active">Active (Visible in store)</label>
                </div>

                <div className="flex gap-3 pt-3 border-t border-brand-light">
                  <button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="btn-outline flex-1" id="sub-cancel">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1" id="sub-save">
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

export default SubCategoriesAdminPage;
