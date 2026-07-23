import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, Upload, ChevronDown, Check, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import currencyJs from 'currency.js';
import toast from 'react-hot-toast';
import api from '../services/api';

const fmt = (v) => currencyJs(v, { symbol: '₹', precision: 0 }).format();

// ── Custom Searchable Combobox for Variant Option Attribute Values ─────────────
const VariantAttributeSelect = ({ label, value, onChange, suggestions = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = suggestions.filter(s =>
    s.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-xs font-semibold text-neutral-700 mb-1 capitalize">{label} *</label>
      <div
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full border border-neutral-300 px-3 py-2 text-xs rounded-md bg-white flex items-center justify-between cursor-pointer hover:border-brand-gold focus:border-brand-gold transition-colors font-medium text-neutral-800 shadow-sm"
      >
        <span className={value ? 'text-neutral-900 font-bold' : 'text-neutral-400'}>
          {value || `Select ${label}...`}
        </span>
        <ChevronDown size={14} className={`text-neutral-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[200px] bg-white border border-neutral-200 shadow-2xl rounded-xl z-50 p-2.5 space-y-2 animate-in fade-in duration-150">
          <input
            type="text"
            autoFocus
            placeholder={`Search or type ${label}...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && searchTerm.trim()) {
                e.preventDefault();
                handleSelect(searchTerm.trim());
              }
            }}
            className="w-full border border-neutral-300 px-3 py-1.5 text-xs rounded-md focus:outline-none focus:border-brand-gold bg-neutral-50 font-medium text-neutral-800"
          />

          <div className="max-h-40 overflow-y-auto space-y-1 py-0.5 custom-scrollbar">
            {filtered.length > 0 ? (
              filtered.map(s => {
                const isSelected = value && value.trim().toLowerCase() === s.trim().toLowerCase();
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSelect(s)}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-md flex items-center justify-between transition-colors ${
                      isSelected ? 'bg-amber-100 text-amber-900 font-bold' : 'hover:bg-neutral-100 text-neutral-800 font-medium'
                    }`}
                  >
                    <span>{s}</span>
                    {isSelected && <Check size={14} className="text-amber-800" />}
                  </button>
                );
              })
            ) : (
              <p className="text-[11px] text-neutral-400 p-2 italic text-center">No predefined values</p>
            )}

            {searchTerm.trim() && !suggestions.some(s => s.toLowerCase() === searchTerm.trim().toLowerCase()) && (
              <button
                type="button"
                onClick={() => handleSelect(searchTerm.trim())}
                className="w-full text-left px-3 py-1.5 text-xs rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold flex items-center gap-1.5 mt-1 border border-amber-200"
              >
                <Plus size={12} /> Add "{searchTerm.trim()}"
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const VariantModal = ({ variant, onClose, onSave, products, warehouses }) => {
  const isEdit = !!variant;
  const [selectedProductId, setSelectedProductId] = useState(variant?.productId || '');
  const [sku, setSku] = useState(variant?.sku || '');
  const [price, setPrice] = useState(variant?.price || '');
  const [mrp, setMrp] = useState(variant?.mrp || '');
  const [stock, setStock] = useState(variant?.stock !== undefined ? String(variant?.stock) : '0');
  const [warehouseId, setWarehouseId] = useState(variant?.warehouseId || '');
  const [attributes, setAttributes] = useState(variant?.attributes || {});
  
  const [lowStockThreshold, setLowStockThreshold] = useState(variant?.lowStockThreshold !== undefined ? String(variant.lowStockThreshold) : '10');
  const [gstRate, setGstRate] = useState(variant?.gstRate || '18%');
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(variant?.image || '');

  // Multi-Image Upload States (Up to 5 Images per Variant)
  const [existingImages, setExistingImages] = useState(() => {
    if (Array.isArray(variant?.images) && variant.images.length > 0) return variant.images.slice(0, 5);
    if (variant?.image) return [variant.image];
    return [];
  });
  const [newImageFiles, setNewImageFiles] = useState([]);

  // Selected Product details
  const selectedProduct = products.find(p => Number(p.id) === Number(selectedProductId));

  // Determine allowed option keys (attributes) based ONLY on Section 4 options defined on selectedProduct
  const optionKeys = useMemo(() => {
    if (!selectedProduct) return [];
    if (selectedProduct.attributes) {
      if (Array.isArray(selectedProduct.attributes)) {
        return selectedProduct.attributes.map(a => a.optionName || a.name || a.key).filter(Boolean);
      }
      if (typeof selectedProduct.attributes === 'object') {
        return Object.keys(selectedProduct.attributes).filter(k => k.trim() !== '');
      }
    }
    if (selectedProduct.variants?.[0]?.attributes) {
      return Object.keys(selectedProduct.variants[0].attributes).filter(k => k.trim() !== '');
    }
    return [];
  }, [selectedProduct]);

  // Get existing / defined option values for each option key (from Section 4 or existing variants)
  const getExistingValues = (key) => {
    if (!selectedProduct) return [];
    const valuesSet = new Set();
    
    if (selectedProduct.attributes) {
      if (Array.isArray(selectedProduct.attributes)) {
        const item = selectedProduct.attributes.find(a => (a.optionName || a.name || a.key)?.toLowerCase() === key.toLowerCase());
        if (item) {
          const raw = item.optionValue || item.values || item.value || '';
          if (Array.isArray(raw)) raw.forEach(v => valuesSet.add(v));
          else if (typeof raw === 'string') raw.split(',').forEach(v => v.trim() && valuesSet.add(v.trim()));
        }
      } else if (typeof selectedProduct.attributes === 'object') {
        const raw = selectedProduct.attributes[key];
        if (Array.isArray(raw)) raw.forEach(v => valuesSet.add(v));
        else if (typeof raw === 'string') raw.split(',').forEach(v => v.trim() && valuesSet.add(v.trim()));
      }
    }

    if (selectedProduct.variants) {
      selectedProduct.variants.forEach(v => {
        if (v.attributes && v.attributes[key]) {
          valuesSet.add(v.attributes[key]);
        }
      });
    }
    return Array.from(valuesSet);
  };

  // Sync attributes with selected product's option keys
  useEffect(() => {
    if (!isEdit && selectedProductId) {
      const nextAttrs = {};
      optionKeys.forEach(k => {
        nextAttrs[k] = '';
      });
      setAttributes(nextAttrs);
    }
  }, [selectedProductId, isEdit, optionKeys]);

  const handleAttributeChange = (key, val) => {
    setAttributes(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImageFile(file);
      setMainImagePreview(URL.createObjectURL(file));
    }
  };

  const handleMultipleFilesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = 5 - (existingImages.length + newImageFiles.length);
    if (remainingSlots <= 0) {
      toast.error('Maximum 5 variant gallery images allowed');
      return;
    }
    const selected = files.slice(0, remainingSlots).map(file => {
      file.preview = URL.createObjectURL(file);
      return file;
    });
    setNewImageFiles(prev => [...prev, ...selected]);
  };

  const removeExistingImage = (idx) => {
    setExistingImages(prev => prev.filter((_, i) => i !== idx));
  };

  const removeNewFile = (idx) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }

    // Verify all required option types have values
    for (const key of optionKeys) {
      if (!attributes[key] || attributes[key].trim() === '') {
        toast.error(`Please provide a value for option "${key}"`);
        return;
      }
    }

    // Check attribute combo conflict for creation and edit
    if (selectedProduct?.variants) {
      const isConflict = selectedProduct.variants.some(v => {
        if (isEdit && Number(v.id) === Number(variant.id)) return false;
        const vAttrs = v.attributes || {};
        return optionKeys.every(k => String(vAttrs[k] || '').trim().toLowerCase() === String(attributes[k] || '').trim().toLowerCase());
      });

      if (isConflict) {
        const comboStr = Object.entries(attributes).map(([k, v]) => `${k}: ${v}`).join(', ');
        toast.error(`Variant combination '${comboStr}' already exists for this product!`);
        return;
      }
    }

    const fd = new FormData();
    fd.append('productId', selectedProductId);
    fd.append('sku', sku);
    fd.append('price', price);
    fd.append('mrp', mrp);
    fd.append('stock', stock);
    fd.append('lowStockThreshold', lowStockThreshold);
    fd.append('gstRate', gstRate);
    fd.append('warehouseId', warehouseId || '');
    fd.append('attributes', JSON.stringify(attributes));
    fd.append('existingImages', JSON.stringify(existingImages));
    
    if (mainImageFile) {
      fd.append('variantImages', mainImageFile);
    }

    newImageFiles.forEach(file => {
      fd.append('variantImages', file);
    });

    onSave(fd);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-light sticky top-0 bg-white z-10">
          <h2 className="font-playfair text-xl font-semibold">{isEdit ? 'Edit Variant' : 'Add Variant'}</h2>
          <button onClick={onClose} className="p-1.5 hover:text-brand-gold transition-colors focus-visible:outline-brand-gold" aria-label="Close"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Product selection (read-only in Edit mode) */}
            <div>
              <label className="block text-xs font-semibold text-brand-grey mb-1.5" htmlFor="var-product">Product *</label>
              {isEdit ? (
                <div className="w-full border border-brand-light bg-neutral-50 px-3 py-2 text-sm text-brand-grey font-medium rounded-md">
                  {variant.product?.name}
                </div>
              ) : (
                <select
                  id="var-product"
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  required
                  className="w-full border border-brand-light bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors rounded-md"
                >
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Dynamic Attributes / Option Types inputs */}
            {selectedProductId && (
              <div className="border border-brand-light p-4 bg-neutral-50/50 rounded-lg space-y-3">
                <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Configure Product Option Attributes</h3>
                {optionKeys.length === 0 ? (
                  <p className="text-xs text-brand-grey italic">
                    This product does not have custom option types defined in Section 4.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {optionKeys.map(key => {
                      const suggestions = getExistingValues(key);
                      return (
                        <VariantAttributeSelect
                          key={key}
                          label={key}
                          value={attributes[key] || ''}
                          onChange={(val) => handleAttributeChange(key, val)}
                          suggestions={suggestions}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Core Fields Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-grey mb-1.5" htmlFor="var-sku">SKU Code</label>
                <input
                  id="var-sku"
                  type="text"
                  placeholder="Auto SKU if blank"
                  value={sku}
                  onChange={e => setSku(e.target.value)}
                  className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-md font-mono"
                />
              </div>

              {/* Warehouse Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-brand-grey mb-1.5" htmlFor="var-warehouse">Warehouse</label>
                <select
                  id="var-warehouse"
                  value={warehouseId}
                  onChange={e => setWarehouseId(e.target.value)}
                  className="w-full border border-brand-light bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors rounded-md"
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.city})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-grey mb-1.5" htmlFor="var-price">Selling Price (₹) *</label>
                <input
                  id="var-price"
                  type="number"
                  required
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-md font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-grey mb-1.5" htmlFor="var-mrp">MRP (₹)</label>
                <input
                  id="var-mrp"
                  type="number"
                  value={mrp}
                  onChange={e => setMrp(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-md font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-grey mb-1.5" htmlFor="var-stock">Stock QTY *</label>
                <input
                  id="var-stock"
                  type="number"
                  required
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                  placeholder="0"
                  className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-md font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-grey mb-1.5" htmlFor="var-threshold">Low Stock Threshold</label>
                <input
                  id="var-threshold"
                  type="number"
                  value={lowStockThreshold}
                  onChange={e => setLowStockThreshold(e.target.value)}
                  placeholder="10"
                  className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-md font-sans"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-brand-grey mb-1.5" htmlFor="var-gst">GST Percentage</label>
                <select
                  id="var-gst"
                  value={gstRate}
                  onChange={e => setGstRate(e.target.value)}
                  className="w-full border border-brand-light bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors rounded-md font-medium"
                >
                  <option value="0%">0% (Exempt)</option>
                  <option value="5%">5% (SGST 2.5% + CGST 2.5%)</option>
                  <option value="12%">12% (SGST 6% + CGST 6%)</option>
                  <option value="18%">18% (SGST 9% + CGST 9%)</option>
                  <option value="28%">28% (SGST 14% + CGST 14%)</option>
                </select>
              </div>
            </div>

            {/* Main Variant Image Input (Dashed Dropzone & Rounded Preview Card) */}
            <div className="pt-2 border-t border-neutral-200 space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700">
                Main Variant Image • Recommended 400×400px (1:1) • Max: 3MB
              </label>

              {mainImagePreview ? (
                <div className="relative w-28 h-28 border border-neutral-300 rounded-2xl overflow-hidden shadow-md group bg-neutral-900">
                  <img src={mainImagePreview} alt="Main Variant" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setMainImageFile(null);
                      setMainImagePreview('');
                    }}
                    className="absolute top-2 right-2 bg-black/80 hover:bg-red-600 text-white p-1 rounded-full shadow-lg transition-colors"
                    title="Remove Main Image"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-neutral-300 hover:border-brand-gold bg-white hover:bg-neutral-50/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium group-hover:text-neutral-800">
                    <Camera size={16} className="text-neutral-400 group-hover:text-brand-gold" />
                    <span>Click to <strong>browse</strong> or <strong>drag & drop</strong></span>
                  </div>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleMainImageChange} className="hidden" />
                </label>
              )}
            </div>

            {/* Variant Gallery (Up to 5 Images) */}
            <div className="pt-2 border-t border-neutral-200 space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-neutral-800">Variant Gallery (Max 5 Images)</label>
                <span className="text-xs font-mono font-semibold text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded">
                  {existingImages.length + newImageFiles.length} / 5
                </span>
              </div>

              <div className="grid grid-cols-5 gap-3">
                {existingImages.map((imgUrl, idx) => (
                  <div key={`existing-${idx}`} className="relative aspect-square border border-neutral-300 rounded-md overflow-hidden bg-neutral-100 shadow-sm">
                    <img src={imgUrl} alt={`Variant ${idx + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeExistingImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 shadow"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {newImageFiles.map((file, idx) => {
                  const globalPos = existingImages.length + idx + 1;
                  return (
                    <div key={`new-${idx}`} className="relative aspect-square border-2 border-brand-gold/60 rounded-md overflow-hidden bg-neutral-100 shadow-sm">
                      <img src={file.preview} alt={`Upload ${globalPos}`} className="w-full h-full object-cover" />
                      <span className="absolute top-1 left-1 bg-brand-gold text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        #{globalPos}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeNewFile(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 shadow"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}

                {existingImages.length + newImageFiles.length < 5 && (
                  <label className="aspect-square border-2 border-dashed border-neutral-300 hover:border-brand-gold flex flex-col items-center justify-center text-neutral-400 hover:text-brand-gold cursor-pointer rounded-md bg-neutral-50 transition-colors">
                    <Plus size={20} />
                    <span className="text-[10px] font-semibold mt-1">Add Photo</span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleMultipleFilesSelect}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-brand-light">
            <button type="button" onClick={onClose} className="w-full border border-brand-light py-3 font-semibold text-xs tracking-wider uppercase text-neutral-800 hover:bg-neutral-50 transition-colors">Cancel</button>
            <button type="submit" className="w-full bg-neutral-950 text-white hover:bg-neutral-800 py-3 font-semibold text-xs tracking-wider uppercase transition-colors">Save Variant</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const VariantsAdminPage = () => {
  const [variants, setVariants] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [vRes, pRes, wRes] = await Promise.all([
        api.get('/variants'),
        api.get('/products?limit=1000'),
        api.get('/warehouses')
      ]);
      setVariants(vRes.data.variants || []);
      setProducts(pRes.data.products || []);
      setWarehouses(wRes.data.warehouses || []);
    } catch (err) {
      toast.error('Failed to load variants database');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleSave = async (formData) => {
    try {
      if (editing) {
        await api.put(`/variants/update/${editing.id}`, formData);
        toast.success('Variant updated successfully');
      } else {
        await api.post('/variants/add', formData);
        toast.success('Variant created successfully');
      }
      setModalOpen(false);
      setEditing(null);
      fetchInitialData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save variant');
    }
  };

  const executeDelete = async (id) => {
    try {
      await api.delete(`/variants/${id}`);
      toast.success('Variant deleted successfully');
      fetchInitialData();
    } catch (err) {
      toast.error('Failed to delete variant');
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1">
        <p className="text-sm font-semibold text-neutral-800">Confirm Deletion</p>
        <p className="text-xs text-neutral-600">Are you sure you want to delete this variant? This will remove its stock records.</p>
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
      position: 'top-center'
    });
  };

  // Filter variants based on search (product name or SKU) and product selection
  const filteredVariants = variants.filter(v => {
    const matchesSearch = v.sku?.toLowerCase().includes(search.toLowerCase()) || 
                          v.product?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesProduct = productFilter === '' || Number(v.productId) === Number(productFilter);
    return matchesSearch && matchesProduct;
  });

  return (
    <AdminLayout title="Variants">
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey" />
          <input
            type="search"
            placeholder="Search SKU or Product..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-brand-light text-sm focus:outline-none focus:border-brand-gold"
          />
        </div>

        {/* Product Filter */}
        <select
          value={productFilter}
          onChange={e => setProductFilter(e.target.value)}
          className="border border-brand-light bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold max-w-xs"
        >
          <option value="">All Products</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus size={16} /> Add Variant
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-brand-light flex items-center justify-between">
          <p className="text-sm text-brand-grey">{filteredVariants.length} variants found</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Variants table">
            <thead>
              <tr className="bg-brand-light/40 text-left">
                {['Image', 'Product', 'SKU', 'Attributes', 'Warehouse', 'Selling Price', 'MRP', 'Stock', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-brand-grey uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-brand-light">
                    {[...Array(9)].map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-16" /></td>)}
                  </tr>
                ))
              ) : filteredVariants.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-brand-grey italic">No variants found matching criteria</td>
                </tr>
              ) : filteredVariants.map(variant => {
                const attributesStr = Object.entries(variant.attributes || {})
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(' · ');

                return (
                  <tr key={variant.id} className="border-b border-brand-light hover:bg-brand-light/20 transition-colors">
                    <td className="px-4 py-3">
                      <img 
                        src={variant.image || variant.product?.images?.[0] || 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=80'} 
                        alt="Variant" 
                        className="w-10 h-12 object-cover rounded" 
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium line-clamp-1">{variant.product?.name || '—'}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{variant.sku}</td>
                    <td className="px-4 py-3 text-brand-grey font-medium text-xs">
                      {attributesStr || <span className="italic text-neutral-400">Default Variant</span>}
                    </td>
                    <td className="px-4 py-3 text-brand-grey">
                      {variant.warehouse?.name || '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold">{fmt(variant.price)}</td>
                    <td className="px-4 py-3 font-medium text-brand-grey">{variant.mrp ? fmt(variant.mrp) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${variant.stock <= 5 ? 'text-red-500' : 'text-green-600'}`}>
                        {variant.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditing(variant); setModalOpen(true); }} className="p-1.5 text-brand-grey hover:text-brand-gold transition-colors focus-visible:outline-brand-gold" aria-label="Edit"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(variant.id)} className="p-1.5 text-brand-grey hover:text-red-400 transition-colors focus-visible:outline-brand-gold" aria-label="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <VariantModal 
            variant={editing} 
            products={products} 
            warehouses={warehouses}
            onClose={() => { setModalOpen(false); setEditing(null); }} 
            onSave={handleSave} 
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default VariantsAdminPage;
