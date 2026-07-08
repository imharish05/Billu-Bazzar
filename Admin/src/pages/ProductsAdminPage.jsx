import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, Upload } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { fetchAdminProducts, createProduct, updateProduct, deleteProduct } from '../redux/slices/productsSlice';
import currencyJs from 'currency.js';

const fmt = (v) => currencyJs(v, { symbol: '₹', precision: 0 }).format();

const EMPTY_FORM = {
  name: '', slug: '', shortDescription: '', description: '', price: '', comparePrice: '',
  stock: '', sku: '', categoryId: '', vendorId: '', isFeatured: false, isNewArrival: false,
  isBestSeller: false, isActive: true, images: [], tags: [],
};

const ProductModal = ({ product, onClose, onSave }) => {
  const [form, setForm] = useState(product ? { ...product } : { ...EMPTY_FORM });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => { e.preventDefault(); onSave(form); };

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
            <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="prod-images">Image URLs (comma-separated)</label>
            <input id="prod-images" type="text" value={Array.isArray(form.images) ? form.images.join(', ') : form.images || ''} onChange={e => set('images', e.target.value.split(',').map(s => s.trim()))} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" placeholder="https://example.com/img1.jpg, ..." />
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

  const handleDelete = async (id) => {
    if (window.confirm('Deactivate this product?')) dispatch(deleteProduct(id));
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
