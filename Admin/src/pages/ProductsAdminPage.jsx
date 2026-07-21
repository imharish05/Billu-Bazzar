import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, Upload, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import Switch from '../components/Switch';
import { fetchAdminProducts, createProduct, updateProduct, deleteProduct } from '../redux/slices/productsSlice';
import currencyJs from 'currency.js';
import toast from 'react-hot-toast';
import api from '../services/api';

const fmt = (v) => currencyJs(v, { symbol: '₹', precision: 0 }).format();

const EMPTY_FORM = {
  name: '', slug: '', shortDescription: '', description: '', price: '', comparePrice: '',
  stock: '', sku: '', categoryId: '', subCategoryId: '', subSubCategoryId: '', vendorId: '', isFeatured: false, isNewArrival: false,
  isBestSeller: false, isActive: true, images: [], spin_images: [], tags: [],
};

// Compute cartesian product of arrays of values
const cartesian = (arrays) => {
  if (!arrays.length) return [[]];
  return arrays.reduce(
    (acc, arr) => acc.flatMap(combo => arr.map(v => [...combo, v])),
    [[]]
  );
};

const ProductModal = ({ product, onClose, onSave }) => {
  const [form, setForm] = useState(product ? { ...product } : { ...EMPTY_FORM });
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [vendors, setVendors] = useState([]);

  // Variant States
  const [hasVariants, setHasVariants] = useState(product?.variants?.length > 0);
  const [variantOptions, setVariantOptions] = useState([]);
  const [generatedVariants, setGeneratedVariants] = useState([]);
  const [newOptionKey, setNewOptionKey] = useState('');
  const [newOptionValue, setNewOptionValue] = useState({});

  useEffect(() => {
    const loadCategoriesAndVendors = async () => {
      try {
        const [catRes, subRes, subSubRes, venRes] = await Promise.all([
          api.get('/categories?all=true'),
          api.get('/subcategories?all=true'),
          api.get('/subsubcategories?all=true'),
          api.get('/vendors')
        ]);
        setCategories(catRes.data.categories || []);
        setSubCategories(subRes.data.subCategories || []);
        setSubSubCategories(subSubRes.data.subSubCategories || []);
        setVendors(venRes.data.vendors || venRes.data.success ? venRes.data.vendors : []);
      } catch (err) {
        console.error('Error fetching categories/vendors hierarchy', err);
      }
    };
    loadCategoriesAndVendors();
  }, []);

  // Initialize variant states when editing
  useEffect(() => {
    if (product && product.variants && product.variants.length > 0) {
      // Reconstruct variantOptions from existing variants' attributes
      const optionsMap = {};
      product.variants.forEach(v => {
        const attrs = v.attributes || {};
        Object.entries(attrs).forEach(([key, val]) => {
          if (!optionsMap[key]) optionsMap[key] = new Set();
          optionsMap[key].add(val);
        });
      });

      const initialOptions = Object.entries(optionsMap).map(([key, valueSet]) => ({
        key,
        values: Array.from(valueSet)
      }));
      setVariantOptions(initialOptions);

      // Map existing variants
      const initialVariants = product.variants.map(v => ({
        id: v.id,
        variantName: Object.entries(v.attributes || {}).map(([key, val]) => `${key}: ${val}`).join(' · '),
        sku: v.sku || '',
        price: v.price || '',
        mrp: v.mrp || '',
        stock: v.stock || 0,
        attributes: v.attributes || {},
        image: v.image || null,
        images: v.images || [],
        imagePreview: v.image || null
      }));
      setGeneratedVariants(initialVariants);
    }
  }, [product]);

  // Re-generate combinations when options change
  const handleRebuildVariants = (updatedOptions) => {
    const activeOptions = updatedOptions.filter(o => o.key.trim() && o.values.length > 0);
    if (activeOptions.length === 0) {
      setGeneratedVariants([]);
      return;
    }

    const combos = cartesian(activeOptions.map(o => o.values.map(v => ({ key: o.key, value: v }))));
    
    const nextVariants = combos.map((combo, idx) => {
      // Create attributes object
      const comboAttributes = {};
      combo.forEach(c => { comboAttributes[c.key] = c.value; });
      const comboName = combo.map(c => `${c.key}: ${c.value}`).join(' · ');

      // Find if we have an existing variant that matches these attributes
      const existingMatch = generatedVariants.find(gv => {
        const gvAttrs = gv.attributes || {};
        return combo.every(c => String(gvAttrs[c.key]) === String(c.value));
      });

      if (existingMatch) {
        return {
          ...existingMatch,
          variantName: comboName,
          attributes: comboAttributes
        };
      }

      return {
        variantName: comboName,
        sku: '',
        price: form.price || '',
        mrp: form.comparePrice || '',
        stock: '0',
        attributes: comboAttributes,
        imageFile: null,
        imagePreview: null
      };
    });

    setGeneratedVariants(nextVariants);
  };

  // Add a new variant option key (e.g. Size, Color, custom)
  const addOptionKey = () => {
    const key = newOptionKey.trim();
    if (!key) return;
    if (variantOptions.some(o => o.key.toLowerCase() === key.toLowerCase())) {
      toast.error(`Option "${key}" already exists`);
      return;
    }
    const nextOptions = [...variantOptions, { key, values: [] }];
    setVariantOptions(nextOptions);
    setNewOptionKey('');
  };

  // Remove a variant option dimension
  const removeOptionKey = (idx) => {
    const nextOptions = variantOptions.filter((_, i) => i !== idx);
    setVariantOptions(nextOptions);
    handleRebuildVariants(nextOptions);
  };

  // Add value to a specific option key
  const addOptionValue = (optionIdx) => {
    const val = (newOptionValue[optionIdx] || '').trim();
    if (!val) return;

    const opt = variantOptions[optionIdx];
    if (opt.values.length >= 1) {
      toast.error(`Only one value is allowed for "${opt.key}".`);
      return;
    }
    if (opt.values.some(v => v.toLowerCase() === val.toLowerCase())) {
      toast.error(`Value "${val}" already exists under ${opt.key}`);
      return;
    }

    const nextOptions = [...variantOptions];
    nextOptions[optionIdx] = {
      ...opt,
      values: [...opt.values, val]
    };

    setVariantOptions(nextOptions);
    setNewOptionValue(prev => ({ ...prev, [optionIdx]: '' }));
    handleRebuildVariants(nextOptions);
  };

  // Remove a value from an option
  const removeOptionValue = (optionIdx, valIdx) => {
    const opt = variantOptions[optionIdx];
    const nextValues = opt.values.filter((_, i) => i !== valIdx);
    const nextOptions = [...variantOptions];
    nextOptions[optionIdx] = {
      ...opt,
      values: nextValues
    };
    setVariantOptions(nextOptions);
    handleRebuildVariants(nextOptions);
  };

  // Update specific variant field in generated list
  const handleUpdateVariantField = (idx, field, val) => {
    setGeneratedVariants(prev => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        [field]: val
      };
      return next;
    });
  };

  // Handle variant image upload
  const handleVariantImageUpload = (idx, file) => {
    if (!file) return;
    setGeneratedVariants(prev => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        imageFile: file,
        imagePreview: URL.createObjectURL(file)
      };
      return next;
    });
  };

  const filteredSubCategories = subCategories.filter(
    sub => Number(sub.categoryId) === Number(form.categoryId)
  );

  const filteredSubSubCategories = subSubCategories.filter(
    ss => Number(ss.subCategoryId) === Number(form.subCategoryId)
  );

  const handleCategoryChange = (val) => {
    setForm(p => ({
      ...p,
      categoryId: val,
      subCategoryId: '',
      subSubCategoryId: ''
    }));
  };

  const handleSubCategoryChange = (val) => {
    setForm(p => ({
      ...p,
      subCategoryId: val,
      subSubCategoryId: ''
    }));
  };

  const handleSubSubCategoryChange = (val) => {
    setForm(p => ({
      ...p,
      subSubCategoryId: val
    }));
  };
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState(product ? [...(product.images || [])] : []);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const [newSpinImageFiles, setNewSpinImageFiles] = useState([]);
  const [existingSpinImages, setExistingSpinImages] = useState(product ? [...(product.spin_images || [])] : []);
  const [isSpinDragging, setIsSpinDragging] = useState(false);
  const spinFileInputRef = useRef(null);
  const [enable360, setEnable360] = useState(product && product.spin_images && product.spin_images.length > 0);

  const set = (k, v) => {
    setForm(p => {
      const next = { ...p, [k]: v };
      if (k === 'name' && (!p.slug || p.slug.trim() === '' || p.slug === p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))) {
        next.slug = v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      return next;
    });
  };

  const handleFileSelect = (eOrFiles) => {
    const files = eOrFiles.target ? eOrFiles.target.files : eOrFiles;
    if (!files || files.length === 0) return;
    
    const file = Array.from(files).find(f => f.type.startsWith('image/'));
    if (!file) return;

    file.preview = URL.createObjectURL(file);
    
    // Revoke old previews to avoid leaks
    newImageFiles.forEach(f => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });

    setNewImageFiles([file]);
    setExistingImages([]);
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

  const handleSpinFileSelect = (eOrFiles) => {
    const files = eOrFiles.target ? eOrFiles.target.files : eOrFiles;
    if (!files || files.length === 0) return;
    
    const filesArr = Array.from(files).filter(f => f.type.startsWith('image/')).map(file => {
      file.preview = URL.createObjectURL(file);
      return file;
    });
    setNewSpinImageFiles(prev => [...prev, ...filesArr]);
    if (spinFileInputRef.current) spinFileInputRef.current.value = '';
  };

  const removeNewSpinFile = (idx) => {
    setNewSpinImageFiles(prev => {
      const target = prev[idx];
      if (target && target.preview) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  const removeExistingSpinImage = (idx) => {
    setExistingSpinImages(prev => prev.filter((_, i) => i !== idx));
  };

  const moveExistingSpinImage = (idx, dir) => {
    setExistingSpinImages(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const moveNewSpinFile = (idx, dir) => {
    setNewSpinImageFiles(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();

    // Map fields
    Object.keys(form).forEach(key => {
      if (key === 'images' || key === 'spin_images' || key === 'variants') return; // Skip old fields
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
    fd.append('existingSpinImages', JSON.stringify(enable360 ? existingSpinImages : []));

    newImageFiles.forEach(file => {
      fd.append('images', file);
    });

    if (enable360) {
      newSpinImageFiles.forEach(file => {
        fd.append('spin_images', file);
      });
    }

    // Handle Variants Payload
    if (hasVariants && generatedVariants.length > 0) {
      const variantsPayload = generatedVariants.map((v, idx) => ({
        id: v.id || null,
        sku: v.sku || `PV-${form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${idx}-${Date.now()}`,
        price: v.price === '' ? null : parseFloat(v.price),
        mrp: v.mrp === '' ? null : parseFloat(v.mrp),
        stock: v.stock === '' ? 0 : parseInt(v.stock, 10),
        attributes: v.attributes || {},
        image: v.image || null,
        images: v.images || []
      }));

      fd.append('variants', JSON.stringify(variantsPayload));

      // Append variant image files
      generatedVariants.forEach((v, idx) => {
        if (v.imageFile) {
          fd.append(`variantGallery_${idx}`, v.imageFile);
        }
      });
    }

    onSave(fd);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-light sticky top-0 bg-white z-10">
          <h2 className="font-playfair text-xl font-semibold">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="p-1.5 hover:text-brand-gold transition-colors focus-visible:outline-brand-gold" aria-label="Close"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: 'Product Name *', key: 'name', req: true },
              { label: 'Slug', key: 'slug' },
              { label: 'SKU', key: 'sku' },
            ].map(({ label, key, req }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor={`prod-${key}`}>{label}</label>
                <input id={`prod-${key}`} type="text" value={form[key] || ''} onChange={e => set(key, e.target.value)} required={req} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-none" placeholder={label.replace(' *', '')} />
              </div>
            ))}

            {/* Vendor Dropdown */}
            <div>
              <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="prod-vendor">Vendor</label>
              <select
                id="prod-vendor"
                value={form.vendorId || ''}
                onChange={e => set('vendorId', e.target.value)}
                className="w-full border border-brand-light bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors rounded-none"
              >
                <option value="">Select Vendor</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="prod-category">Category *</label>
              <select
                id="prod-category"
                value={form.categoryId || ''}
                onChange={e => handleCategoryChange(e.target.value)}
                required
                className="w-full border border-brand-light bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors rounded-none"
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Sub Category Dropdown */}
            <div>
              <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="prod-subcategory">Sub Category</label>
              <select
                id="prod-subcategory"
                value={form.subCategoryId || ''}
                onChange={e => handleSubCategoryChange(e.target.value)}
                disabled={!form.categoryId}
                className="w-full border border-brand-light bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors disabled:bg-neutral-50 disabled:cursor-not-allowed rounded-none"
              >
                <option value="">Select Sub Category</option>
                {filteredSubCategories.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>

            {/* Sub Subcategory Dropdown */}
            <div>
              <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="prod-subsubcategory">Sub Subcategory</label>
              <select
                id="prod-subsubcategory"
                value={form.subSubCategoryId || ''}
                onChange={e => handleSubSubCategoryChange(e.target.value)}
                disabled={!form.subCategoryId}
                className="w-full border border-brand-light bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors disabled:bg-neutral-50 disabled:cursor-not-allowed rounded-none"
              >
                <option value="">Select Sub Subcategory</option>
                {filteredSubSubCategories.map(ss => (
                  <option key={ss.id} value={ss.id}>{ss.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="prod-shortDesc">Short Description</label>
            <textarea id="prod-shortDesc" rows={2} value={form.shortDescription || ''} onChange={e => set('shortDescription', e.target.value)} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold resize-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="prod-desc">Description</label>
            <textarea id="prod-desc" rows={4} value={form.description || ''} onChange={e => set('description', e.target.value)} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold resize-none" />
          </div>

          {/* Variants Toggle & Builder */}
          <div className="border-t border-brand-light pt-6">
            <div className="flex items-center justify-between bg-neutral-50 p-4 border border-brand-light mb-6">
              <div>
                <p className="text-sm font-semibold text-neutral-900">Product Variants</p>
                <p className="text-xs text-brand-grey mt-0.5">This product has variants like different sizes, colors, styles, or designs</p>
              </div>
              <Switch checked={hasVariants} onChange={e => setHasVariants(e.target.checked)} />
            </div>

            {hasVariants ? (
              <div className="space-y-6">
                {/* 1. Options setup */}
                <div className="bg-neutral-50 p-4 border border-brand-light space-y-4">
                  <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Configure Attributes / Option Types</h3>
                  
                  {/* List existing configured option keys */}
                  {variantOptions.map((opt, optIdx) => (
                    <div key={optIdx} className="bg-white border border-brand-light p-4 space-y-3 relative">
                      <button
                        type="button"
                        onClick={() => removeOptionKey(optIdx)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs font-bold"
                      >
                        ✕ Remove
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-700">Option Type:</span>
                        <span className="text-xs font-bold text-brand-gold px-2.5 py-0.5 bg-brand-gold/10">{opt.key}</span>
                      </div>
                      
                      {/* Values list as pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {opt.values.map((v, vIdx) => (
                          <span key={vIdx} className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-700 text-xs px-2 py-0.5 font-medium border border-neutral-200">
                            {v}
                            <button
                              type="button"
                              onClick={() => removeOptionValue(optIdx, vIdx)}
                              className="text-[10px] text-neutral-400 hover:text-neutral-600 font-bold ml-0.5"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Add new value to this key */}
                      {opt.values.length === 0 && (
                        <div className="flex gap-2 max-w-sm">
                          <input
                            type="text"
                            placeholder={`Add value to ${opt.key}...`}
                            value={newOptionValue[optIdx] || ''}
                            onChange={e => setNewOptionValue(prev => ({ ...prev, [optIdx]: e.target.value }))}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addOptionValue(optIdx);
                              }
                            }}
                            className="border border-brand-light px-2.5 py-1 text-xs focus:outline-none focus:border-brand-gold flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => addOptionValue(optIdx)}
                            className="bg-neutral-900 text-white text-xs px-3 py-1 font-semibold uppercase tracking-wider"
                          >
                            Add Value
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add new Option Key input */}
                  <div className="flex gap-2 max-w-md pt-2">
                    <input
                      type="text"
                      placeholder="e.g. Colour, Size, Material, Design..."
                      value={newOptionKey}
                      onChange={e => setNewOptionKey(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addOptionKey();
                        }
                      }}
                      className="border border-brand-light px-3 py-1.5 text-xs focus:outline-none focus:border-brand-gold flex-1"
                    />
                    <button
                      type="button"
                      onClick={addOptionKey}
                      className="bg-brand-gold text-white text-xs px-4 py-1.5 font-semibold uppercase tracking-wider flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Option Type
                    </button>
                  </div>
                </div>

                {/* 2. Generated Combinations Grid */}
                {generatedVariants.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Combinations Matrix ({generatedVariants.length})</h3>
                    <div className="border border-brand-light divide-y divide-brand-light overflow-hidden bg-white">
                      {generatedVariants.map((v, idx) => (
                        <div key={idx} className="p-4 grid sm:grid-cols-12 gap-4 items-start bg-white hover:bg-neutral-50/50 transition-colors">
                          {/* Variant Image Select */}
                          <div className="sm:col-span-2">
                            <div className="relative aspect-square border border-brand-light rounded bg-neutral-50 overflow-hidden group flex items-center justify-center cursor-pointer">
                              {v.imagePreview ? (
                                <>
                                  <img src={v.imagePreview} alt="variant" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateVariantField(idx, 'imagePreview', null)}
                                    className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full hover:bg-red-600 transition-colors shadow"
                                  >
                                    ✕
                                  </button>
                                </>
                              ) : (
                                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-1">
                                  <Upload size={16} className="text-brand-grey mb-1" />
                                  <span className="text-[10px] text-brand-grey text-center leading-tight">Add Photo</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => handleVariantImageUpload(idx, e.target.files[0])}
                                  />
                                </label>
                              )}
                            </div>
                          </div>

                          {/* Variant Name & SKU */}
                          <div className="sm:col-span-4 space-y-2">
                            <p className="text-xs font-bold text-neutral-900 line-clamp-1">{v.variantName}</p>
                            <input
                              type="text"
                              placeholder="Auto SKU Code"
                              value={v.sku}
                              onChange={e => handleUpdateVariantField(idx, 'sku', e.target.value)}
                              className="w-full border border-brand-light px-2 py-1 text-xs focus:outline-none focus:border-brand-gold font-mono"
                            />
                          </div>

                          {/* Prices and Stock */}
                          <div className="sm:col-span-6 grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-brand-grey mb-0.5">Sale Price *</label>
                              <input
                                type="number"
                                required
                                value={v.price}
                                onChange={e => handleUpdateVariantField(idx, 'price', e.target.value)}
                                className="w-full border border-brand-light px-2 py-1 text-xs focus:outline-none focus:border-brand-gold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-brand-grey mb-0.5">MRP Price</label>
                              <input
                                type="number"
                                value={v.mrp}
                                onChange={e => handleUpdateVariantField(idx, 'mrp', e.target.value)}
                                className="w-full border border-brand-light px-2 py-1 text-xs focus:outline-none focus:border-brand-gold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-brand-grey mb-0.5">Stock *</label>
                              <input
                                type="number"
                                required
                                value={v.stock}
                                onChange={e => handleUpdateVariantField(idx, 'stock', e.target.value)}
                                className="w-full border border-brand-light px-2 py-1 text-xs focus:outline-none focus:border-brand-gold"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* If product does NOT have variants, we show the main pricing & stock fields */
              <div className="grid sm:grid-cols-3 gap-4">
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
              </div>
            )}
          </div>

          {/* Product Image */}
          <div className="border-t border-brand-light pt-6">
            <label className="block text-xs font-semibold text-brand-grey mb-1.5">Product Image</label>
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
              <p className="text-sm text-brand-grey font-medium">Drag & drop image here, or click to upload</p>
              <p className="text-xs text-brand-grey mt-1">JPEG, PNG, WebP — single image, max 50MB</p>
              <input
                ref={fileInputRef}
                type="file"
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

          {/* 360 Spin View Toggle */}
          <div className="border-t border-brand-light pt-6">
            <div className="flex items-center justify-between bg-neutral-50 p-4 border border-brand-light mb-4">
              <div>
                <p className="text-sm font-semibold text-neutral-900">360° Spin View</p>
                <p className="text-xs text-brand-grey mt-0.5">Enable 360° interactive product spin sequence</p>
              </div>
              <input
                type="checkbox"
                id="enable-360-toggle"
                checked={enable360}
                onChange={e => setEnable360(e.target.checked)}
                className="w-4 h-4 text-brand-gold border-brand-light rounded focus:ring-brand-gold cursor-pointer"
              />
            </div>

            {enable360 && (
              <div className="space-y-4">
                <label className="block text-xs font-semibold text-brand-grey">360° Spin View Frames (Ordered Sequence)</label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    isSpinDragging
                      ? 'border-brand-gold bg-brand-gold/5'
                      : 'border-brand-light hover:border-brand-gold'
                  }`}
                  onClick={() => spinFileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsSpinDragging(true); }}
                  onDragLeave={() => setIsSpinDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsSpinDragging(false);
                    if (e.dataTransfer.files) handleSpinFileSelect(e.dataTransfer.files);
                  }}
                >
                  <Upload size={28} className="mx-auto text-brand-grey mb-2" />
                  <p className="text-sm text-brand-grey font-medium">Drag & drop 360° frames here, or click to upload</p>
                  <input
                    ref={spinFileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleSpinFileSelect}
                  />
                </div>

                {/* Spin Image Preview Grid */}
                {(existingSpinImages.length > 0 || newSpinImageFiles.length > 0) && (
                  <div className="grid grid-cols-6 gap-3 mt-4">
                    {existingSpinImages.map((img, idx) => (
                      <div key={`exist-spin-${idx}`} className="relative aspect-square border border-brand-light rounded-lg overflow-hidden bg-brand-light group">
                        <img src={img} alt="Spin Frame" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); moveExistingSpinImage(idx, -1); }}
                            disabled={idx === 0}
                            className="bg-white/90 text-brand-text p-1 rounded-full hover:bg-white transition-colors shadow disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeExistingSpinImage(idx); }}
                            className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow"
                          >
                            <X size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); moveExistingSpinImage(idx, 1); }}
                            disabled={idx === existingSpinImages.length - 1}
                            className="bg-white/90 text-brand-text p-1 rounded-full hover:bg-white transition-colors shadow disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronRight size={12} />
                          </button>
                        </div>
                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded">{idx + 1}</span>
                      </div>
                    ))}
                    {newSpinImageFiles.map((file, idx) => (
                      <div key={`new-spin-${idx}`} className="relative aspect-square border border-brand-light rounded-lg overflow-hidden bg-brand-light group">
                        <img src={file.preview} alt="New Spin Frame" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); moveNewSpinFile(idx, -1); }}
                            disabled={idx === 0}
                            className="bg-white/90 text-brand-text p-1 rounded-full hover:bg-white transition-colors shadow disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeNewSpinFile(idx); }}
                            className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow"
                          >
                            <X size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); moveNewSpinFile(idx, 1); }}
                            disabled={idx === newSpinImageFiles.length - 1}
                            className="bg-white/90 text-brand-text p-1 rounded-full hover:bg-white transition-colors shadow disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronRight size={12} />
                          </button>
                        </div>
                        <span className="absolute bottom-1 left-1 bg-brand-gold text-white text-[8px] font-bold px-1 rounded shadow">NEW</span>
                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded">{existingSpinImages.length + idx + 1}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Featured, New, Best Seller Toggles */}
          <div className="border-t border-brand-light pt-6 flex flex-wrap items-center gap-6">
            {[{k:'isFeatured',l:'Featured'},{k:'isNewArrival',l:'New Arrival'},{k:'isBestSeller',l:'Best Seller'},{k:'isActive',l:'Active'}].map(({k,l}) => (
              <label key={k} className="flex items-center gap-2 text-sm cursor-pointer select-none" htmlFor={`prod-${k}`}>
                <Switch checked={!!form[k]} onChange={e => set(k, e.target.checked)} id={`prod-${k}`} />
                {l}
              </label>
            ))}
          </div>

          <div className="flex gap-3 pt-6 border-t border-brand-light">
            <button type="button" onClick={onClose} className="w-full border border-brand-light py-3 font-semibold text-xs tracking-wider uppercase text-neutral-800 hover:bg-neutral-50 transition-colors" id="prod-cancel">Cancel</button>
            <button type="submit" className="w-full bg-neutral-950 text-white hover:bg-neutral-800 py-3 font-semibold text-xs tracking-wider uppercase transition-colors" id="prod-save">Save Product</button>
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
                  <td className="px-4 py-3 text-brand-grey">
                    <div className="text-xs space-y-0.5">
                      <span className="font-medium text-brand-text block">{product.category?.name || '—'}</span>
                      {product.subcategory && (
                        <span className="text-[10px] text-brand-grey block">› {product.subcategory.name}</span>
                      )}
                      {product.subsubcategory && (
                        <span className="text-[9px] text-brand-gold block">» {product.subsubcategory.name}</span>
                      )}
                    </div>
                  </td>
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