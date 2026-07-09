import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, Upload } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { fetchAdminProducts, createProduct, updateProduct, deleteProduct } from '../redux/slices/productsSlice';
import currencyJs from 'currency.js';
import toast from 'react-hot-toast';

const fmt = (v) => currencyJs(v, { symbol: '₹', precision: 0 }).format();

const EMPTY_FORM = {
  name: '', slug: '', shortDescription: '', description: '', price: '', comparePrice: '',
  stock: '', sku: '', categoryId: '', vendorId: '', isFeatured: false, isNewArrival: false,
  isBestSeller: false, isActive: true, images: [], tags: [],
};

const ProductModal = ({ product, onClose, onSave }) => {
  const [form, setForm] = useState(product ? { ...product } : { ...EMPTY_FORM });
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState(product ? [...(product.images || [])] : []);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFileSelect = (eOrFiles) => {
    const files = eOrFiles.target ? eOrFiles.target.files : eOrFiles;
    if (!files || files.length === 0) return;
    
    const filesArr = Array.from(files).filter(f => f.type.startsWith('image/')).map(file => {
      file.preview = URL.createObjectURL(file);
      return file;
    });
    setNewImageFiles(prev => [...prev, ...filesArr]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeNewFile = (idx) => {
    setNewImageFiles(prev => {
      const target = prev[idx];
      if (target && target.preview) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  const removeExistingImage = (idx) => {
    setExistingImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.keys(form).forEach(key => {
      if (key === 'images') return; // Skip old field
      const value = form[key];
      if (value === null || value === undefined) {
        // skip
      } else if (Array.isArray(value) || typeof value === 'object') {
        fd.append(key, JSON.stringify(value));
      } else {
        fd.append(key, String(value));
      }
    });

    fd.append('existingImages', JSON.stringify(existingImages));

    newImageFiles.forEach(file => {
      fd.append('images', file);
    });

    onSave(fd);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-light sticky top-0 bg-white z-10">
          <h2 className="font-playfair text-xl font-semibold">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="p-1.5 hover:text-brand-gold transition-colors focus-visible:outline-brand-gold" aria-label="Close"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid sm:grid-cols-2 gap-4">
          {[
            { label: 'Product Name *', key: 'name', req: true },
            { label: 'Slug', key: 'slug' },
            { label: 'SKU', key: 'sku' },
            { label: 'Category ID', key: 'categoryId' },
          ].map(({ label, key, req }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor={`prod-${key}`}>{label}</label>
              <input id={`prod-${key}`} type="text" value={form[key] || ''} onChange={e => set(key, e.target.value)} required={req} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" placeholder={label.replace(' *', '')} />
            </div>
          ))}
          {[
            { label: 'Price (₹) *', key: 'price', req: true },
            { label: 'Compare Price (₹)', key: 'comparePrice' },
            { label: 'Stock Qty', key: 'stock' },
          ].map(({ label, key, req }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor={`prod-${key}`}>{label}</label>
              <input id={`prod-${key}`} type="number" value={form[key] || ''} onChange={e => set(key, e.target.value)} required={req} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="prod-shortDesc">Short Description</label>
            <textarea id="prod-shortDesc" rows={2} value={form.shortDescription || ''} onChange={e => set('shortDescription', e.target.value)} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold resize-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="prod-desc">Description</label>
            <textarea id="prod-desc" rows={4} value={form.description || ''} onChange={e => set('description', e.target.value)} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold resize-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-brand-grey mb-1.5">Product Images</label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                isDragging
                  ? 'border-brand-gold bg-brand-gold/5'
                  : 'border-brand-light hover:border-brand-gold'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload size={28} className="mx-auto text-brand-grey mb-2" />
              <p className="text-sm text-brand-grey font-medium">Drag & drop files here, or click to upload</p>
              <p className="text-xs text-brand-grey mt-1">JPEG, PNG, WebP — max 50MB</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Image Preview Grid */}
            {(existingImages.length > 0 || newImageFiles.length > 0) && (
              <div className="grid grid-cols-4 gap-3 mt-4">
                {existingImages.map((img, idx) => (
                  <div key={`exist-${idx}`} className="relative aspect-square border border-brand-light rounded-lg overflow-hidden bg-brand-light group">
                    <img src={img} alt="Product" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeExistingImage(idx); }}
                        className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow"
                        title="Remove Image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {newImageFiles.map((file, idx) => (
                  <div key={`new-${idx}`} className="relative aspect-square border border-brand-light rounded-lg overflow-hidden bg-brand-light group">
                    <img src={file.preview} alt="New upload" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeNewFile(idx); }}
                        className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow"
                        title="Remove Image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <span className="absolute bottom-1 left-1 bg-brand-gold text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">NEW</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="sm:col-span-2 flex gap-6">
            {[{k:'isFeatured',l:'Featured'},{k:'isNewArrival',l:'New Arrival'},{k:'isBestSeller',l:'Best Seller'},{k:'isActive',l:'Active'}].map(({k,l}) => (
              <label key={k} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={!!form[k]} onChange={e => set(k, e.target.checked)} className="accent-brand-gold w-4 h-4" id={`prod-${k}`} />
                {l}
              </label>
            ))}
          </div>
          <div className="sm:col-span-2 flex gap-3 pt-2 border-t border-brand-light">
            <button type="button" onClick={onClose} className="btn-outline flex-1" id="prod-cancel">Cancel</button>
            <button type="submit" className="btn-primary flex-1" id="prod-save">Save Product</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const ProductsAdminPage = () => {
  const dispatch = useDispatch();
  const { items, loading, total } = useSelector(s => s.products);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    dispatch(fetchAdminProducts({ search: search || undefined }));
  }, [search, dispatch]);

  const handleSave = async (form) => {
    if (editing) await dispatch(updateProduct({ id: editing.id, data: form }));
    else await dispatch(createProduct(form));
    setModalOpen(false); setEditing(null);
  };

  const executeDelete = async (id) => {
    try {
      await dispatch(deleteProduct(id));
      toast.success('Product deactivated successfully');
    } catch (err) {
      toast.error('Failed to deactivate product');
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1">
        <p className="text-sm font-semibold text-neutral-800">Confirm Deactivation</p>
        <p className="text-xs text-neutral-600">Are you sure you want to deactivate this product?</p>
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              executeDelete(id);
            }}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors rounded shadow-sm"
          >
            Yes, Deactivate
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
      position: 'top-center'
    });
  };

  return (
    <AdminLayout title="Products">
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey" />
          <input
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-brand-light text-sm focus:outline-none focus:border-brand-gold"
            id="products-search"
            aria-label="Search products"
          />
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary flex items-center gap-2 whitespace-nowrap" id="add-product-btn">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-brand-light flex items-center justify-between">
          <p className="text-sm text-brand-grey">{total} products</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Products table">
            <thead>
              <tr className="bg-brand-light/40 text-left">
                {['Image', 'Name', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-brand-grey uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-brand-light">
                    {[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-16" /></td>)}
                  </tr>
                ))
              ) : items.map(product => (
                <tr key={product.id} className="border-b border-brand-light hover:bg-brand-light/20 transition-colors">
                  <td className="px-4 py-3">
                    <img src={product.images?.[0] || 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=80'} alt={product.name} className="w-10 h-12 object-cover rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium line-clamp-1">{product.name}</p>
                    <p className="text-xs text-brand-grey">{product.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-brand-grey">{product.category?.name || '—'}</td>
                  <td className="px-4 py-3 font-semibold">{fmt(product.price)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${product.stock <= 5 ? 'text-red-500' : 'text-green-600'}`}>{product.stock}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${product.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditing(product); setModalOpen(true); }} className="p-1.5 text-brand-grey hover:text-brand-gold transition-colors focus-visible:outline-brand-gold" aria-label="Edit" id={`edit-prod-${product.id}`}><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(product.id)} className="p-1.5 text-brand-grey hover:text-red-400 transition-colors focus-visible:outline-brand-gold" aria-label="Delete" id={`del-prod-${product.id}`}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && <ProductModal product={editing} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={handleSave} />}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default ProductsAdminPage;
