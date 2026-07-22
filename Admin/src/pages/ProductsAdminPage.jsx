import { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, Upload, ChevronLeft, ChevronRight, ChevronDown, Check, Eye, Play, Pause, RotateCw, Sparkles, Box, ShieldCheck, Tag } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import Switch from '../components/Switch';
import { fetchAdminProducts, createProduct, updateProduct, deleteProduct } from '../redux/slices/productsSlice';
import currencyJs from 'currency.js';
import toast from 'react-hot-toast';
import api from '../services/api';

const fmt = (v) => currencyJs(v, { symbol: '₹', precision: 0 }).format();

const PRESET_OPTION_NAMES = ['Size', 'Color', 'Material', 'Fabric', 'Style', 'Metal Purity', 'Pattern', 'Weight'];

// ── Custom Searchable Combobox Dropdown for Option Type ─────────────────────
const OptionTypeSelect = ({ value, onChange, usedOptions = [] }) => {
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

  const filteredPresets = PRESET_OPTION_NAMES.filter(name =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isExactPreset = PRESET_OPTION_NAMES.some(
    name => name.toLowerCase() === searchTerm.trim().toLowerCase()
  );

  const handleSelect = (selectedName) => {
    const isUsedByOther = usedOptions.some(
      u => u.trim().toLowerCase() === selectedName.trim().toLowerCase() &&
           u.trim().toLowerCase() !== (value || '').trim().toLowerCase()
    );
    if (isUsedByOther) {
      toast.error(`Option type '${selectedName}' is already added!`);
      return;
    }
    onChange(selectedName);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button matching reference UI */}
      <div
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full border border-neutral-300 px-3 py-2 text-xs rounded-lg bg-white flex items-center justify-between cursor-pointer hover:border-brand-gold focus:border-brand-gold transition-colors font-medium text-neutral-800 shadow-sm"
      >
        <span className={value ? 'text-neutral-900 font-semibold' : 'text-neutral-400'}>
          {value || 'Select type...'}
        </span>
        <ChevronDown size={14} className={`text-neutral-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[220px] bg-white border border-neutral-200 shadow-2xl rounded-xl z-50 p-2.5 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search or type custom input box */}
          <input
            type="text"
            autoFocus
            placeholder="Search or type custom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchTerm.trim()) {
                e.preventDefault();
                handleSelect(searchTerm.trim());
              }
            }}
            className="w-full border border-neutral-300 px-3 py-1.5 text-xs rounded-md focus:outline-none focus:border-brand-gold bg-neutral-50 font-medium text-neutral-800"
          />

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar py-0.5">
            {filteredPresets.map((name) => {
              const isSelected = value && value.trim().toLowerCase() === name.trim().toLowerCase();
              const isUsedByOther = usedOptions.some(
                u => u.trim().toLowerCase() === name.trim().toLowerCase() &&
                     u.trim().toLowerCase() !== (value || '').trim().toLowerCase()
              );

              return (
                <button
                  key={name}
                  type="button"
                  disabled={isUsedByOther}
                  onClick={() => handleSelect(name)}
                  className={`w-full text-left px-3 py-2 text-xs rounded-md flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-amber-100 text-amber-900 font-bold'
                      : isUsedByOther
                      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed line-through opacity-60'
                      : 'hover:bg-neutral-100 text-neutral-800 font-medium'
                  }`}
                >
                  <span>{name}</span>
                  {isSelected && <Check size={14} className="text-amber-800" />}
                  {isUsedByOther && <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Added</span>}
                </button>
              );
            })}

            {/* Custom option prompt if user types custom name */}
            {searchTerm.trim() && !isExactPreset && (
              <button
                type="button"
                onClick={() => handleSelect(searchTerm.trim())}
                className="w-full text-left px-3 py-2 text-xs rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold flex items-center gap-1.5 mt-1 border border-amber-200 transition-colors"
              >
                <Plus size={13} /> Add "{searchTerm.trim()}"
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const EMPTY_FORM = {
  name: '', slug: '', shortDescription: '', description: '', price: '', comparePrice: '',
  stock: '', sku: '', categoryId: '', subCategoryId: '', subSubCategoryId: '', vendorId: '', warehouseId: '',
  weight: '', length: '', width: '', height: '',
  isFeatured: false, isNewArrival: false, isBestSeller: false, hasAuthenticityBadge: false, isActive: true,
  has360View: false, hasVideo: false, videoUrl: '', defaultProductImage: null,
};

// ── Interactive 360 Spin Preview Box Component ──────────────────────────────
const SpinViewerPreview = ({ images }) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isAutoSpin, setIsAutoSpin] = useState(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);

  const totalFrames = images.length;

  useEffect(() => {
    if (!isAutoSpin || totalFrames === 0) return;
    const interval = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % totalFrames);
    }, 100);
    return () => clearInterval(interval);
  }, [isAutoSpin, totalFrames]);

  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || totalFrames === 0) return;
    const deltaX = e.clientX - startXRef.current;
    if (Math.abs(deltaX) > 10) {
      const step = deltaX > 0 ? 1 : -1;
      setFrameIndex(prev => (prev + step + totalFrames) % totalFrames);
      startXRef.current = e.clientX;
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  if (totalFrames === 0) return null;

  return (
    <div className="bg-neutral-900 rounded-lg p-4 text-white border border-neutral-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RotateCw size={14} className="text-brand-gold animate-spin-slow" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">360° Preview</span>
        </div>
        <button
          type="button"
          onClick={() => setIsAutoSpin(!isAutoSpin)}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded flex items-center gap-1 transition-colors ${
            isAutoSpin ? 'bg-brand-gold text-black' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
          }`}
        >
          {isAutoSpin ? <Pause size={12} /> : <Play size={12} />}
          {isAutoSpin ? 'Pause' : 'Auto Rotate'}
        </button>
      </div>

      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative aspect-square max-h-64 mx-auto bg-neutral-950 rounded overflow-hidden cursor-grab active:cursor-grabbing border border-neutral-800 flex items-center justify-center select-none"
      >
        <img
          src={images[frameIndex]}
          alt={`360 Frame ${frameIndex + 1}`}
          className="w-full h-full object-contain pointer-events-none"
        />
        <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] font-mono text-brand-gold">
          Frame {frameIndex + 1} / {totalFrames}
        </div>
        <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[9px] text-neutral-400">
          Drag left/right to rotate
        </div>
      </div>
    </div>
  );
};

// ── Storefront Product Live Preview Modal ────────────────────────────────────
const ProductLivePreviewModal = ({ product, onClose }) => {
  const [activeImg, setActiveImg] = useState(product.defaultProductImage || product.images?.[0] || 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600');
  const [activeTab, setActiveTab] = useState('gallery'); // 'gallery' | 'spin' | 'video'

  const images = product.images && product.images.length > 0 ? product.images : [activeImg];
  const spinImages = product.spin_images || [];
  const discountPct = product.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const attributes = typeof product.attributes === 'string' ? JSON.parse(product.attributes) : (product.attributes || {});

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-brand-gold" />
            <div>
              <h2 className="font-playfair text-lg font-semibold">Storefront Live Preview</h2>
              <p className="text-[11px] text-neutral-400">Live Customer View Showcase</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-8">
          
          {/* Card View Preview */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-gold mb-3">1. Product Card View (Listing Page)</h3>
            <div className="w-full max-w-xs bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden group">
              <div className="relative aspect-[4/5] bg-neutral-100 overflow-hidden">
                <img src={activeImg} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {discountPct > 0 && (
                  <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    {discountPct}% OFF
                  </span>
                )}
                {product.showAuthenticity && (
                  <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck size={10} /> Authentic
                  </span>
                )}
              </div>
              <div className="p-4 space-y-2">
                <p className="text-xs text-neutral-500 font-medium">{product.category?.name || 'Category'}</p>
                <h4 className="font-playfair text-base font-semibold text-neutral-900 line-clamp-1">{product.name || 'Untitled Product'}</h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-bold text-neutral-900">{fmt(product.price || 0)}</span>
                  {product.comparePrice > 0 && (
                    <span className="text-xs text-neutral-400 line-through">{fmt(product.comparePrice)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Full Showcase View */}
          <div className="border-t border-neutral-200 pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-gold mb-3">2. Product Details View (PDP)</h3>
            
            <div className="grid md:grid-cols-2 gap-8 bg-neutral-50 p-6 rounded-xl border border-neutral-200">
              
              {/* Media Section */}
              <div className="space-y-4">
                {/* Media Tabs */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('gallery')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeTab === 'gallery' ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 text-neutral-700'}`}
                  >
                    Gallery ({images.length})
                  </button>
                  {product.has360View && spinImages.length > 0 && (
                    <button
                      onClick={() => setActiveTab('spin')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeTab === 'spin' ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 text-neutral-700'}`}
                    >
                      360° View ({spinImages.length})
                    </button>
                  )}
                  {product.hasVideo && (product.videoUrl || product.videoFile) && (
                    <button
                      onClick={() => setActiveTab('video')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeTab === 'video' ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 text-neutral-700'}`}
                    >
                      Showcase Video
                    </button>
                  )}
                </div>

                {/* Display Media */}
                {activeTab === 'gallery' && (
                  <div className="space-y-3">
                    <div className="aspect-[4/5] bg-white rounded-lg border border-neutral-200 overflow-hidden">
                      <img src={activeImg} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    {images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {images.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveImg(img)}
                            className={`w-14 h-14 rounded overflow-hidden border-2 flex-shrink-0 ${activeImg === img ? 'border-brand-gold' : 'border-neutral-200'}`}
                          >
                            <img src={img} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'spin' && (
                  <SpinViewerPreview images={spinImages} />
                )}

                {activeTab === 'video' && (
                  <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center border border-neutral-800">
                    {product.videoUrl ? (
                      <video src={product.videoUrl} controls className="w-full h-full object-contain" />
                    ) : (
                      <p className="text-xs text-neutral-400">Video file attached</p>
                    )}
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-brand-gold font-bold uppercase tracking-wider">{product.category?.name || 'Category'}</span>
                  <h2 className="font-playfair text-2xl font-bold text-neutral-900 mt-1">{product.name || 'Untitled Product'}</h2>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">SKU: {product.sku || 'N/A'}</p>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-neutral-900">{fmt(product.price || 0)}</span>
                  {product.comparePrice > 0 && (
                    <span className="text-base text-neutral-400 line-through">{fmt(product.comparePrice)}</span>
                  )}
                </div>

                {product.shortDescription && (
                  <p className="text-xs text-neutral-600 leading-relaxed border-t border-b border-neutral-200 py-3">{product.shortDescription}</p>
                )}

                {/* Attributes / Options */}
                {Object.keys(attributes).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Specifications & Attributes</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(attributes).map(([k, v]) => (
                        <div key={k} className="bg-white border border-neutral-200 px-3 py-1.5 rounded text-xs flex items-center gap-2">
                          <span className="font-semibold text-neutral-500">{k}:</span>
                          <span className="font-bold text-neutral-900">{v}</span>
                          {k.toLowerCase() === 'color' && (
                            <span className="w-3 h-3 rounded-full border border-neutral-300" style={{ backgroundColor: v.startsWith('#') ? v : '#000' }} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shipping & Specs */}
                {(product.weight || product.dimensions) && (
                  <div className="bg-white p-3 border border-neutral-200 rounded space-y-1 text-xs">
                    <h4 className="font-bold text-neutral-800">Shipping Specs</h4>
                    {product.weight && <p className="text-neutral-600">Weight: <span className="font-semibold text-neutral-900">{product.weight} kg</span></p>}
                    {product.dimensions && (
                      <p className="text-neutral-600">Dimensions: <span className="font-semibold text-neutral-900">
                        {typeof product.dimensions === 'string' ? product.dimensions : `${product.dimensions.length || 0} x ${product.dimensions.width || 0} x ${product.dimensions.height || 0} cm`}
                      </span></p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs pt-2">
                  <span className={`px-2.5 py-1 rounded font-bold ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {product.stock > 0 ? `In Stock (${product.stock} units)` : 'Out of Stock'}
                  </span>
                  {product.showAuthenticity && (
                    <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded font-bold flex items-center gap-1">
                      <ShieldCheck size={12} /> 100% Certified Authentic
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ── Product Add / Edit Modal Component ──────────────────────────────────────
const ProductModal = ({ product, onClose, onSave }) => {
  const [form, setForm] = useState(product ? {
    name: product.name || '',
    sku: product.sku || '',
    slug: product.slug || '',
    shortDescription: product.shortDescription || '',
    description: product.description || '',
    price: product.price || '',
    comparePrice: product.comparePrice || '',
    stock: product.stock !== undefined ? product.stock : '0',
    categoryId: product.categoryId || '',
    subCategoryId: product.subCategoryId || '',
    subSubCategoryId: product.subSubCategoryId || '',
    vendorId: product.vendorId || '',
    warehouseId: product.warehouseId || '',
    weight: product.weight || '',
    length: product.dimensions?.length || '',
    width: product.dimensions?.width || product.dimensions?.breadth || '',
    height: product.dimensions?.height || '',
    isFeatured: Boolean(product.isFeatured),
    isNewArrival: Boolean(product.isNewArrival),
    isBestSeller: Boolean(product.isBestSeller),
    hasAuthenticityBadge: Boolean(product.showAuthenticity),
    isActive: product.isActive !== undefined ? Boolean(product.isActive) : true,
    has360View: Boolean(product.has360View || (product.spin_images && product.spin_images.length > 0)),
    hasVideo: Boolean(product.hasVideo || product.videoUrl),
    videoUrl: product.videoUrl || '',
    defaultProductImage: product.defaultProductImage || product.images?.[0] || null,
  } : { ...EMPTY_FORM });

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // Inline Custom Subcategory and SubSubcategory creation states
  const [customSubCategoryName, setCustomSubCategoryName] = useState('');
  const [isCustomSubCategory, setIsCustomSubCategory] = useState(false);
  const [customSubSubCategoryName, setCustomSubSubCategoryName] = useState('');
  const [isCustomSubSubCategory, setIsCustomSubSubCategory] = useState(false);

  // Live Storefront Preview state inside modal
  const [previewOpen, setPreviewOpen] = useState(false);

  // Dynamic Key-Value Option Rows with Color Support
  const [optionRows, setOptionRows] = useState(() => {
    if (product && product.attributes && Object.keys(product.attributes).length > 0) {
      const attrs = typeof product.attributes === 'string' ? JSON.parse(product.attributes) : product.attributes;
      return Object.entries(attrs).map(([k, v], i) => ({
        id: Date.now() + i,
        optionName: k,
        optionValue: v,
        colorHex: k.toLowerCase() === 'color' && v.startsWith('#') ? v : '#8B0000',
      }));
    }
    return [{ id: Date.now(), optionName: 'Size', optionValue: '', colorHex: '#8B0000' }];
  });

  // Product Variants Matrix State
  const [productVariants, setProductVariants] = useState(() => {
    if (product && Array.isArray(product.variants) && product.variants.length > 0) {
      return product.variants.map((v, idx) => ({
        id: v.id || Date.now() + idx,
        sku: v.sku || '',
        price: v.price !== undefined ? String(v.price) : '',
        mrp: v.mrp !== undefined ? String(v.mrp) : '',
        stock: v.stock !== undefined ? String(v.stock) : '0',
        attributes: v.attributes || {},
        existingImages: Array.isArray(v.images) ? v.images : (v.image ? [v.image] : []),
        newFiles: [],
      }));
    }
    return [];
  });

  // Real-time auto-sync variant combinations from Section 4 optionRows
  useEffect(() => {
    const validRows = optionRows.filter(r => r.optionName.trim() !== '' && r.optionValue.trim() !== '');
    if (validRows.length === 0) {
      setProductVariants([]);
      return;
    }

    const optionMap = [];
    validRows.forEach(r => {
      const name = r.optionName.trim();
      const vals = r.optionValue.split(',').map(v => v.trim()).filter(Boolean);
      if (vals.length > 0) {
        optionMap.push({ name, vals });
      }
    });

    if (optionMap.length === 0) {
      setProductVariants([]);
      return;
    }

    const cartesian = (arrays) => {
      return arrays.reduce((acc, curr) => {
        return acc.flatMap(d => curr.vals.map(e => ({ ...d, [curr.name]: e })));
      }, [{}]);
    };

    const combinations = cartesian(optionMap);

    setProductVariants(prev => {
      const existingMap = new Map();
      prev.forEach(v => {
        const key = Object.entries(v.attributes || {}).sort().map(([k, val]) => `${k}:${val}`).join('|');
        existingMap.set(key, v);
      });

      return combinations.map((combo, idx) => {
        const key = Object.entries(combo).sort().map(([k, val]) => `${k}:${val}`).join('|');
        const existing = existingMap.get(key);

        if (existing) {
          return { ...existing, attributes: combo };
        }

        const comboLabel = Object.values(combo).join('-');
        const skuCode = form.sku ? `${form.sku}-${comboLabel}`.toUpperCase().replace(/\s+/g, '') : `PV-${Date.now()}-${idx + 1}`;

        return {
          id: Date.now() + Math.random() + idx,
          sku: skuCode,
          attributes: combo,
          existingImages: [],
          newFiles: [],
        };
      });
    });
  }, [optionRows, form.sku]);

  const removeVariantRow = (variantId) => {
    setProductVariants(prev => prev.filter(v => v.id !== variantId));
  };

  const updateVariantRow = (variantId, field, val) => {
    setProductVariants(prev => prev.map(v => v.id === variantId ? { ...v, [field]: val } : v));
  };

  const updateVariantAttribute = (variantId, attrKey, attrVal) => {
    setProductVariants(prev => {
      const target = prev.find(v => v.id === variantId);
      if (!target) return prev;

      const nextAttrs = { ...(target.attributes || {}), [attrKey]: attrVal };

      const conflict = prev.some(v => {
        if (v.id === variantId) return false;
        const eAttrs = v.attributes || {};
        const keysA = Object.keys(eAttrs).sort();
        const keysB = Object.keys(nextAttrs).sort();
        if (keysA.length !== keysB.length) return false;
        return keysA.every(k => String(eAttrs[k]).trim().toLowerCase() === String(nextAttrs[k]).trim().toLowerCase());
      });

      if (conflict) {
        const label = Object.entries(nextAttrs).map(([k, v]) => `${k}: ${v}`).join(', ');
        toast.error(`Variant combination '${label}' already exists!`);
        return prev;
      }

      return prev.map(v => v.id === variantId ? { ...v, attributes: nextAttrs } : v);
    });
  };

  const handleVariantRowFilesSelect = (variantId, e) => {
    const files = Array.from(e.target.files || []);
    setProductVariants(prev => prev.map(v => {
      if (v.id !== variantId) return v;
      const remaining = 10 - ((v.existingImages?.length || 0) + (v.newFiles?.length || 0));
      if (remaining <= 0) {
        toast.error('Maximum 10 images per variant allowed');
        return v;
      }
      const selected = files.slice(0, remaining).map(file => {
        file.preview = URL.createObjectURL(file);
        return file;
      });
      return { ...v, newFiles: [...(v.newFiles || []), ...selected] };
    }));
  };

  const removeVariantRowImage = (variantId, isNew, idx) => {
    setProductVariants(prev => prev.map(v => {
      if (v.id !== variantId) return v;
      if (isNew) {
        return { ...v, newFiles: v.newFiles.filter((_, i) => i !== idx) };
      } else {
        return { ...v, existingImages: v.existingImages.filter((_, i) => i !== idx) };
      }
    }));
  };

  // Image Upload States
  const [defaultProductImageFile, setDefaultProductImageFile] = useState(null);
  const [defaultProductImagePreview, setDefaultProductImagePreview] = useState(form.defaultProductImage);

  // Variant Gallery Images
  const [existingVariantImages, setExistingVariantImages] = useState(product ? [...(product.images || [])] : []);
  const [newVariantImageFiles, setNewVariantImageFiles] = useState([]);

  // 360 Spin Images
  const [existingSpinImages, setExistingSpinImages] = useState(product ? [...(product.spin_images || [])] : []);
  const [newSpinImageFiles, setNewSpinImageFiles] = useState([]);

  // Video File
  const [videoFile, setVideoFile] = useState(null);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [catRes, subRes, subSubRes, venRes, whRes] = await Promise.all([
          api.get('/categories?all=true'),
          api.get('/subcategories?all=true'),
          api.get('/subsubcategories?all=true'),
          api.get('/vendors'),
          api.get('/warehouses')
        ]);
        setCategories(catRes.data.categories || []);
        setSubCategories(subRes.data.subCategories || []);
        setSubSubCategories(subSubRes.data.subSubCategories || []);
        setVendors(venRes.data.vendors || (venRes.data.success ? venRes.data.vendors : []));
        setWarehouses(whRes.data.warehouses || []);
      } catch (err) {
        console.error('Error fetching metadata', err);
      }
    };
    loadMetadata();
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Filtered Subcategories & SubSubcategories
  const filteredSubCategories = subCategories.filter(
    sub => Number(sub.categoryId) === Number(form.categoryId)
  );

  const filteredSubSubCategories = subSubCategories.filter(
    ss => Number(ss.subCategoryId) === Number(form.subCategoryId)
  );

  const handleCategoryChange = (val) => {
    setForm(p => ({ ...p, categoryId: val, subCategoryId: '', subSubCategoryId: '' }));
  };

  const handleSubCategoryChange = (val) => {
    setForm(p => ({ ...p, subCategoryId: val, subSubCategoryId: '' }));
  };

  // Rich Text Editor Command Helper
  const applyRichTextCommand = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  // Option Row Handlers
  const addOptionRow = () => {
    const existingNames = optionRows.map(r => r.optionName.trim().toLowerCase());
    const firstUnused = PRESET_OPTION_NAMES.find(name => !existingNames.includes(name.toLowerCase()));
    if (!firstUnused && optionRows.length >= PRESET_OPTION_NAMES.length + 5) {
      toast.error('Maximum variant options reached');
      return;
    }
    const defaultName = firstUnused || '';
    setOptionRows(prev => [...prev, { id: Date.now(), optionName: defaultName, optionValue: '', colorHex: '#8B0000' }]);
  };

  const removeOptionRow = (id) => {
    if (optionRows.length === 1) {
      toast.error('At least 1 variant option is required');
      return;
    }
    setOptionRows(prev => prev.filter(r => r.id !== id));
  };

  const updateOptionRow = (id, key, value) => {
    if (key === 'optionName' && value.trim() !== '') {
      const isDuplicate = optionRows.some(r => r.id !== id && r.optionName.trim().toLowerCase() === value.trim().toLowerCase());
      if (isDuplicate) {
        toast.error(`Option type '${value}' is already added!`);
        return;
      }
    }
    setOptionRows(prev => prev.map(r => r.id === id ? { ...r, [key]: value } : r));
  };

  // Image Selection Handlers
  const handleDefaultImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDefaultProductImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setDefaultProductImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleVariantImagesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = 10 - (existingVariantImages.length + newVariantImageFiles.length);
    if (remainingSlots <= 0) {
      toast.error('Maximum 10 variant gallery images allowed');
      return;
    }
    const selected = files.slice(0, remainingSlots).map(file => {
      file.preview = URL.createObjectURL(file);
      return file;
    });
    setNewVariantImageFiles(prev => [...prev, ...selected]);
  };

  const removeExistingVariantImage = (index) => {
    setExistingVariantImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewVariantFile = (index) => {
    setNewVariantImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const moveNewVariantFile = (index, direction) => {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= newVariantImageFiles.length) return;
    setNewVariantImageFiles(prev => {
      const arr = [...prev];
      const temp = arr[index];
      arr[index] = arr[newIdx];
      arr[newIdx] = temp;
      return arr;
    });
  };

  // 360 Spin Handlers
  const handleSpinFileSelect = (e) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/')).map(file => {
      file.preview = URL.createObjectURL(file);
      return file;
    });
    setNewSpinImageFiles(prev => [...prev, ...files]);
  };

  const moveSpinFrame = (index, direction, isNew = false) => {
    if (isNew) {
      const newIdx = index + direction;
      if (newIdx < 0 || newIdx >= newSpinImageFiles.length) return;
      setNewSpinImageFiles(prev => {
        const arr = [...prev];
        const temp = arr[index];
        arr[index] = arr[newIdx];
        arr[newIdx] = temp;
        return arr;
      });
    } else {
      const newIdx = index + direction;
      if (newIdx < 0 || newIdx >= existingSpinImages.length) return;
      setExistingSpinImages(prev => {
        const arr = [...prev];
        const temp = arr[index];
        arr[index] = arr[newIdx];
        arr[newIdx] = temp;
        return arr;
      });
    }
  };

  const removeSpinFrame = (index, isNew = false) => {
    if (isNew) {
      setNewSpinImageFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setExistingSpinImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || form.name.trim() === '') {
      toast.error('Product Name is required');
      return;
    }
    if (!form.sku || form.sku.trim() === '') {
      toast.error('SKU is required');
      return;
    }
    if (!form.categoryId) {
      toast.error('Category is required');
      return;
    }

    const validOptions = optionRows.filter(r => r.optionName.trim() !== '' && r.optionValue.trim() !== '');
    if (validOptions.length === 0) {
      toast.error('At least 1 variant option is required before publishing');
      return;
    }

    if (!defaultProductImageFile && !defaultProductImagePreview && existingVariantImages.length === 0 && newVariantImageFiles.length === 0) {
      toast.error('Default Product Listing Image is required');
      return;
    }

    if (form.has360View && existingSpinImages.length === 0 && newSpinImageFiles.length === 0) {
      toast.error('Please upload at least 1 image frame for 360° View');
      return;
    }

    if (form.hasVideo && !videoFile && (!form.videoUrl || form.videoUrl.trim() === '')) {
      toast.error('Please upload a video file or provide a video URL');
      return;
    }

    // Auto-create Subcategory if typed in custom input
    let finalSubCategoryId = form.subCategoryId;
    if ((isCustomSubCategory || filteredSubCategories.length === 0) && customSubCategoryName.trim()) {
      try {
        const subRes = await api.post('/subcategories', {
          name: customSubCategoryName.trim(),
          categoryId: parseInt(form.categoryId, 10),
          isActive: true
        });
        if (subRes.data.success && subRes.data.subCategory) {
          finalSubCategoryId = subRes.data.subCategory.id;
          setSubCategories(prev => [...prev, subRes.data.subCategory]);
        }
      } catch (err) {
        console.error('Error creating custom subcategory:', err);
      }
    }

    // Auto-create Sub-subcategory if typed in custom input
    let finalSubSubCategoryId = form.subSubCategoryId;
    if ((isCustomSubSubCategory || filteredSubSubCategories.length === 0) && customSubSubCategoryName.trim() && finalSubCategoryId) {
      try {
        const subSubRes = await api.post('/subsubcategories', {
          name: customSubSubCategoryName.trim(),
          subCategoryId: parseInt(finalSubCategoryId, 10),
          isActive: true
        });
        if (subSubRes.data.success && subSubRes.data.subSubCategory) {
          finalSubSubCategoryId = subSubRes.data.subSubCategory.id;
          setSubSubCategories(prev => [...prev, subSubRes.data.subSubCategory]);
        }
      } catch (err) {
        console.error('Error creating custom sub-subcategory:', err);
      }
    }

    const generatedSlug = form.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const fd = new FormData();
    fd.append('productName', form.name.trim());
    fd.append('sku', form.sku.trim());
    fd.append('slug', generatedSlug);
    fd.append('price', form.price === '' ? '0' : String(form.price));
    fd.append('comparePrice', form.comparePrice === '' ? '' : String(form.comparePrice));
    fd.append('stock', form.stock === '' ? '0' : String(form.stock));
    fd.append('shortDescription', form.shortDescription || '');
    fd.append('description', form.description || '');
    fd.append('categoryId', form.categoryId || '');
    fd.append('subCategoryId', finalSubCategoryId || '');
    fd.append('subSubCategoryId', finalSubSubCategoryId || '');
    fd.append('vendorId', form.vendorId || '');
    fd.append('warehouseId', form.warehouseId || '');
    fd.append('weight', form.weight || '');

    if (form.length || form.width || form.height) {
      fd.append('dimensions', JSON.stringify({
        length: form.length || '0',
        width: form.width || '0',
        height: form.height || '0',
        unit: 'cm'
      }));
    }

    fd.append('isFeatured', String(form.isFeatured));
    fd.append('isNewArrival', String(form.isNewArrival));
    fd.append('isBestSeller', String(form.isBestSeller));
    fd.append('hasAuthenticityBadge', String(form.hasAuthenticityBadge));
    fd.append('isActive', String(form.isActive));
    fd.append('has360View', String(form.has360View));
    fd.append('hasVideo', String(form.hasVideo));
    fd.append('videoUrl', form.videoUrl || '');

    fd.append('variantOptions', JSON.stringify(validOptions));

    if (defaultProductImageFile) {
      fd.append('defaultProductImage', defaultProductImageFile);
    }
    if (videoFile) {
      fd.append('video', videoFile);
    }

    if (productVariants.length > 0) {
      fd.append('variants', JSON.stringify(productVariants.map(v => ({
        id: typeof v.id === 'number' && v.id < 1000000000000 ? v.id : null,
        sku: v.sku,
        price: v.price,
        mrp: v.mrp,
        stock: v.stock,
        attributes: v.attributes,
        existingImages: v.existingImages || [],
      }))));

      productVariants.forEach((v, vIdx) => {
        if (Array.isArray(v.newFiles)) {
          v.newFiles.forEach(file => {
            fd.append(`variantFiles_${vIdx}`, file);
          });
        }
      });
    }

    fd.append('existingImages', JSON.stringify(existingVariantImages));
    newVariantImageFiles.forEach(file => {
      fd.append('variantImages', file);
    });

    if (form.has360View) {
      fd.append('existingSpinImages', JSON.stringify(existingSpinImages));
      newSpinImageFiles.forEach(file => {
        fd.append('spin_images', file);
      });
    }

    onSave(fd);
  };

  const combinedSpinPreviews = [
    ...existingSpinImages,
    ...newSpinImageFiles.map(f => f.preview)
  ];

  const constructedPreviewProduct = {
    ...form,
    images: [
      ...(defaultProductImagePreview ? [defaultProductImagePreview] : []),
      ...existingVariantImages,
      ...newVariantImageFiles.map(f => f.preview)
    ],
    spin_images: combinedSpinPreviews,
    attributes: optionRows.reduce((acc, r) => {
      if (r.optionName && r.optionValue) acc[r.optionName] = r.optionValue;
      return acc;
    }, {}),
    category: categories.find(c => String(c.id) === String(form.categoryId)),
    dimensions: { length: form.length, width: form.width, height: form.height },
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-light bg-neutral-900 text-white">
          <div>
            <h2 className="font-playfair text-xl font-semibold">{product ? 'Edit Product' : 'Add New Product'}</h2>
            <p className="text-xs text-neutral-400 font-sans">Single Base Variant Catalog Architecture</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Live Preview button commented out as requested */}
            {/* <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="px-3 py-1.5 bg-brand-gold text-black hover:bg-brand-gold/90 text-xs font-bold rounded flex items-center gap-1.5 transition-colors uppercase tracking-wider"
            >
              <Eye size={14} /> Live Preview
            </button> */}
            <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white transition-colors" aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8 overflow-y-auto flex-1 text-neutral-800">
          
          {/* SECTION 1: BASIC INFO */}
          <div className="bg-neutral-50 p-5 rounded-lg border border-brand-light space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-gold">1. Basic Information</h3>
              <span className="text-[10px] text-neutral-400">* Required Fields</span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  required
                  placeholder="e.g. Emerald Silk Kaftan"
                  className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">SKU *</label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={e => set('sku', e.target.value)}
                  required
                  placeholder="e.g. KFT-001"
                  className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Selling Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={e => set('price', e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-sm bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Compare Price / MRP (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.comparePrice}
                  onChange={e => set('comparePrice', e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-sm bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Stock Quantity *</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={e => set('stock', e.target.value)}
                  required
                  placeholder="0"
                  className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-sm bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Vendor</label>
                <select
                  value={form.vendorId}
                  onChange={e => set('vendorId', e.target.value)}
                  className="w-full border border-brand-light bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-sm"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Warehouse Location</label>
                <select
                  value={form.warehouseId}
                  onChange={e => set('warehouseId', e.target.value)}
                  className="w-full border border-brand-light bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-sm"
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.city})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Category *</label>
                <select
                  value={form.categoryId}
                  onChange={e => handleCategoryChange(e.target.value)}
                  required
                  className="w-full border border-brand-light bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-sm"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Subcategory */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-neutral-700">
                    Subcategory {filteredSubCategories.length > 0 ? '*' : '(Custom)'}
                  </label>
                  {form.categoryId && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomSubCategory(prev => !prev);
                        if (!isCustomSubCategory) setForm(p => ({ ...p, subCategoryId: '', subSubCategoryId: '' }));
                      }}
                      className="text-[10px] font-bold text-brand-gold hover:underline flex items-center gap-1"
                    >
                      {isCustomSubCategory || filteredSubCategories.length === 0 ? (filteredSubCategories.length > 0 ? 'Select Existing' : 'Custom Mode') : '+ Add New'}
                    </button>
                  )}
                </div>

                {isCustomSubCategory || (form.categoryId && filteredSubCategories.length === 0) ? (
                  <input
                    type="text"
                    value={customSubCategoryName}
                    onChange={e => setCustomSubCategoryName(e.target.value)}
                    disabled={!form.categoryId}
                    placeholder={!form.categoryId ? '— Select Category First —' : 'Type new subcategory name...'}
                    className="w-full border border-amber-400 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-sm bg-amber-50/60 font-semibold text-amber-950 placeholder:text-amber-800/50"
                  />
                ) : (
                  <select
                    value={form.subCategoryId}
                    onChange={e => handleSubCategoryChange(e.target.value)}
                    required={filteredSubCategories.length > 0}
                    disabled={!form.categoryId}
                    className="w-full border border-brand-light bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-sm disabled:bg-neutral-100 disabled:text-neutral-400 font-medium text-neutral-800"
                  >
                    <option value="">
                      {!form.categoryId ? '— Select Parent Category First —' : 'Select Subcategory'}
                    </option>
                    {filteredSubCategories.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Sub-Subcategory */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-neutral-700">
                    Sub-Subcategory (Optional)
                  </label>
                  {(form.subCategoryId || customSubCategoryName.trim()) && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomSubSubCategory(prev => !prev);
                        if (!isCustomSubSubCategory) setForm(p => ({ ...p, subSubCategoryId: '' }));
                      }}
                      className="text-[10px] font-bold text-brand-gold hover:underline flex items-center gap-1"
                    >
                      {isCustomSubSubCategory || filteredSubSubCategories.length === 0 ? (filteredSubSubCategories.length > 0 ? 'Select Existing' : 'Custom Mode') : '+ Add New'}
                    </button>
                  )}
                </div>

                {isCustomSubSubCategory || ((form.subCategoryId || customSubCategoryName.trim()) && filteredSubSubCategories.length === 0) ? (
                  <input
                    type="text"
                    value={customSubSubCategoryName}
                    onChange={e => setCustomSubSubCategoryName(e.target.value)}
                    disabled={!form.subCategoryId && !customSubCategoryName.trim()}
                    placeholder={(!form.subCategoryId && !customSubCategoryName.trim()) ? '— Select Subcategory First —' : 'Type new sub-subcategory name...'}
                    className="w-full border border-amber-400 px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-sm bg-amber-50/60 font-semibold text-amber-950 placeholder:text-amber-800/50"
                  />
                ) : (
                  <select
                    value={form.subSubCategoryId}
                    onChange={e => set('subSubCategoryId', e.target.value)}
                    disabled={!form.subCategoryId}
                    className="w-full border border-brand-light bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-sm disabled:bg-neutral-100 disabled:text-neutral-400 font-medium text-neutral-800"
                  >
                    <option value="">
                      {!form.subCategoryId ? '— Select Subcategory First —' : 'Select Sub-Subcategory'}
                    </option>
                    {filteredSubSubCategories.map(ss => (
                      <option key={ss.id} value={ss.id}>{ss.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: SHIPPING & PACKAGE DIMENSIONS */}
          <div className="bg-neutral-50 p-5 rounded-lg border border-brand-light space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-gold border-b border-neutral-200 pb-2">2. Shipping Specs & Package Dimensions</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.weight}
                  onChange={e => set('weight', e.target.value)}
                  placeholder="e.g. 1.25"
                  className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-sm bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Length (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.length}
                  onChange={e => set('length', e.target.value)}
                  placeholder="e.g. 30"
                  className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-sm bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Breadth / Width (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.width}
                  onChange={e => set('width', e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-sm bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Height (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.height}
                  onChange={e => set('height', e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-sm bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: DESCRIPTIONS */}
          <div className="bg-neutral-50 p-5 rounded-lg border border-brand-light space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-gold border-b border-neutral-200 pb-2">3. Descriptions</h3>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-neutral-700">Short Description (Cards/Listings)</label>
                <span className={`text-[11px] font-mono font-semibold ${form.shortDescription.length > 160 ? 'text-red-500' : 'text-neutral-500'}`}>
                  {form.shortDescription.length} / 160 chars
                </span>
              </div>
              <textarea
                rows={2}
                maxLength={200}
                value={form.shortDescription}
                onChange={e => set('shortDescription', e.target.value)}
                placeholder="Brief excerpt shown on product cards."
                className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-sm bg-white resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Long Description (Product Detail Page)</label>
              <div className="border border-brand-light rounded-sm bg-white overflow-hidden">
                <div className="flex items-center gap-1 p-2 bg-neutral-100 border-b border-brand-light text-xs font-semibold text-neutral-700">
                  <button type="button" onClick={() => applyRichTextCommand('bold')} className="px-2.5 py-1 bg-white border border-neutral-300 rounded font-bold">B</button>
                  <button type="button" onClick={() => applyRichTextCommand('italic')} className="px-2.5 py-1 bg-white border border-neutral-300 rounded italic">I</button>
                  <button type="button" onClick={() => applyRichTextCommand('underline')} className="px-2.5 py-1 bg-white border border-neutral-300 rounded underline">U</button>
                </div>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Detailed rich text description..."
                  className="w-full p-3 text-sm focus:outline-none resize-none font-sans"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: PRE-DETERMINED OPTION TYPES & COLOR PICKER */}
          <div className="bg-neutral-50 p-5 rounded-lg border border-brand-light space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-gold">4. Variant Options & Color Picker</h3>
                <p className="text-[11px] text-neutral-500">Select pre-determined options (Color, Size, Material) or type custom specs.</p>
              </div>
              <span className="text-xs font-bold text-neutral-600 bg-neutral-200 px-2 py-0.5 rounded">{optionRows.length} Options</span>
            </div>

            <div className="space-y-3">
              {optionRows.map((row) => {
                const isColor = row.optionName.toLowerCase() === 'color';
                return (
                  <div key={row.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 border border-brand-light rounded-sm shadow-sm">
                    {/* Option Type Custom Searchable Dropdown */}
                    <div className="w-full sm:w-1/3">
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-0.5">Option Type</label>
                      <OptionTypeSelect
                        value={row.optionName}
                        onChange={(newName) => updateOptionRow(row.id, 'optionName', newName)}
                        usedOptions={optionRows.map(r => r.optionName)}
                      />
                    </div>

                    {/* Option Value + Color Picker */}
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-0.5">Option Value</label>
                      <div className="flex items-center gap-2">
                        {isColor && (
                          <div className="flex items-center gap-1 bg-neutral-100 p-1 border border-neutral-300 rounded">
                            <input
                              type="color"
                              value={row.colorHex || '#8B0000'}
                              onChange={e => {
                                const hex = e.target.value;
                                updateOptionRow(row.id, 'colorHex', hex);
                                if (!row.optionValue) updateOptionRow(row.id, 'optionValue', hex);
                              }}
                              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                              title="Pick Hex Color"
                            />
                            <span className="text-[10px] font-mono font-bold uppercase text-neutral-700">{row.colorHex || '#8B0000'}</span>
                          </div>
                        )}
                        <input
                          type="text"
                          placeholder={isColor ? "Color Name (e.g. Royal Emerald)" : "Value (e.g. XL, 925 Silver)"}
                          value={row.optionValue}
                          onChange={e => updateOptionRow(row.id, 'optionValue', e.target.value)}
                          className="w-full border border-neutral-300 px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand-gold rounded-sm"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeOptionRow(row.id)}
                      className="self-center p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={addOptionRow}
                className="bg-brand-gold text-white text-xs px-4 py-2 font-semibold uppercase tracking-wider rounded-sm flex items-center gap-1.5 hover:bg-brand-gold/90 transition-colors"
              >
                <Plus size={14} /> Add Option
              </button>
            </div>
          </div>

          {/* SECTION 5: PRODUCT VARIANTS & STOCK MATRIX */}
          <div className="bg-neutral-50 p-5 rounded-lg border border-brand-light space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-neutral-200 pb-3 gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-gold">5. Product Variants & Stock Matrix</h3>
                <p className="text-[11px] text-neutral-500">Variant combinations auto-generated in real-time from Section 4 options with up to 10 images each.</p>
              </div>
            </div>

            {productVariants.length === 0 ? (
              <div className="bg-white p-6 rounded-md border border-dashed border-neutral-300 text-center space-y-2">
                <Box size={24} className="mx-auto text-neutral-400" />
                <p className="text-xs text-neutral-500 font-medium">No variants generated yet.</p>
                <p className="text-[11px] text-neutral-400">Add option types and values in Section 4 above to automatically generate variants!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {productVariants.map((v, vIdx) => {
                  const totalImgs = (v.existingImages?.length || 0) + (v.newFiles?.length || 0);
                  const attrKeys = optionRows.filter(r => r.optionName.trim() !== '').map(r => r.optionName.trim());

                  return (
                    <div key={v.id} className="bg-white p-4 border border-neutral-200 rounded-lg shadow-sm space-y-3 hover:border-brand-gold transition-colors">
                      {/* Top Header: Badge + Remove */}
                      <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded border border-neutral-200">
                            Variant #{vIdx + 1}
                          </span>
                          {Object.entries(v.attributes || {}).map(([k, val]) => (
                            <span key={k} className="text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
                              {k}: <strong className="font-bold">{val}</strong>
                            </span>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariantRow(v.id)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Remove Variant"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Attribute Selectors using OptionTypeSelect */}
                      {attrKeys.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-neutral-50/70 p-2.5 rounded-md border border-neutral-200">
                          {attrKeys.map(key => (
                            <div key={key}>
                              <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-0.5">{key}</label>
                              <OptionTypeSelect
                                value={v.attributes?.[key] || ''}
                                onChange={(val) => updateVariantAttribute(v.id, key, val)}
                                usedOptions={[]}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* SKU Code Input (Price & Stock Inherited from Section 1) */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-0.5">SKU Code</label>
                        <input
                          type="text"
                          value={v.sku}
                          onChange={e => updateVariantRow(v.id, 'sku', e.target.value)}
                          placeholder="SKU Code"
                          className="w-full border border-neutral-300 px-3 py-1.5 text-xs font-mono rounded focus:outline-none focus:border-brand-gold font-semibold text-neutral-800"
                        />
                      </div>

                      {/* Multi-Image Gallery per Variant (Up to 10 Images) */}
                      <div className="pt-2 border-t border-neutral-100 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="block text-[10px] font-bold uppercase text-neutral-600">Variant Images (Max 10)</label>
                          <span className="text-[10px] font-mono font-bold text-brand-gold">{totalImgs} / 10</span>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto py-1 custom-scrollbar">
                          {v.existingImages?.map((imgUrl, iIdx) => (
                            <div key={`exist-${iIdx}`} className="relative w-14 h-14 border border-neutral-300 rounded overflow-hidden flex-shrink-0 bg-neutral-100">
                              <img src={imgUrl} alt={`Variant ${iIdx + 1}`} className="w-full h-full object-cover" />
                              <span className="absolute top-0.5 left-0.5 bg-black/70 text-white text-[8px] font-bold px-1 rounded">#{iIdx + 1}</span>
                              <button
                                type="button"
                                onClick={() => removeVariantRowImage(v.id, false, iIdx)}
                                className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded-full opacity-90 hover:opacity-100 shadow"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                          {v.newFiles?.map((file, iIdx) => {
                            const globalPos = (v.existingImages?.length || 0) + iIdx + 1;
                            return (
                              <div key={`new-${iIdx}`} className="relative w-14 h-14 border-2 border-brand-gold/60 rounded overflow-hidden flex-shrink-0 bg-neutral-100">
                                <img src={file.preview} alt={`Upload ${globalPos}`} className="w-full h-full object-cover" />
                                <span className="absolute top-0.5 left-0.5 bg-brand-gold text-white text-[8px] font-bold px-1 rounded">#{globalPos}</span>
                                <button
                                  type="button"
                                  onClick={() => removeVariantRowImage(v.id, true, iIdx)}
                                  className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded-full opacity-90 hover:opacity-100 shadow"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            );
                          })}
                          {totalImgs < 10 && (
                            <label className="w-14 h-14 border-2 border-dashed border-neutral-300 hover:border-brand-gold flex flex-col items-center justify-center text-neutral-400 hover:text-brand-gold cursor-pointer rounded flex-shrink-0 bg-neutral-50 transition-colors">
                              <Plus size={16} />
                              <span className="text-[9px] font-semibold">Image</span>
                              <input
                                type="file"
                                multiple
                                accept="image/jpeg,image/png,image/webp"
                                onChange={e => handleVariantRowFilesSelect(v.id, e)}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 6: PRODUCT IMAGES */}
          <div className="bg-neutral-50 p-5 rounded-lg border border-brand-light space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-gold border-b border-neutral-200 pb-2">5. Product Images & Gallery</h3>

            {/* Default Listing Image */}
            <div className="bg-white p-4 border border-brand-light rounded-sm space-y-3">
              <label className="block text-xs font-bold text-neutral-800">Default Product Listing Image (Card View) *</label>

              <div className="flex items-center gap-4">
                {defaultProductImagePreview ? (
                  <div className="relative w-24 h-24 border border-brand-gold overflow-hidden rounded bg-neutral-100">
                    <img src={defaultProductImagePreview} alt="Default Thumbnail" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setDefaultProductImageFile(null); setDefaultProductImagePreview(null); }}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-90"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="w-24 h-24 border-2 border-dashed border-neutral-300 hover:border-brand-gold flex flex-col items-center justify-center text-neutral-400 hover:text-brand-gold cursor-pointer rounded transition-colors bg-neutral-50">
                    <Upload size={20} />
                    <span className="text-[10px] font-semibold mt-1">Upload</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleDefaultImageSelect} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* Gallery Grid */}
            <div className="bg-white p-4 border border-brand-light rounded-sm space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-neutral-800">Variant Gallery Images (Max 10)</label>
                <span className="text-xs font-mono font-semibold text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded">
                  {existingVariantImages.length + newVariantImageFiles.length} / 10
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {existingVariantImages.map((imgUrl, idx) => (
                  <div key={`existing-${idx}`} className="relative aspect-square border border-neutral-200 rounded overflow-hidden bg-neutral-100 shadow-sm">
                    <img src={imgUrl} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeExistingVariantImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-90"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {newVariantImageFiles.map((file, idx) => {
                  const globalPos = existingVariantImages.length + idx + 1;
                  return (
                    <div key={`new-${idx}`} className="relative aspect-square border-2 border-brand-gold/50 rounded overflow-hidden bg-neutral-100 shadow-sm">
                      <img src={file.preview} alt={`Upload ${globalPos}`} className="w-full h-full object-cover" />
                      <span className="absolute top-1 left-1 bg-brand-gold text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        #{globalPos}
                      </span>
                      <div className="absolute bottom-1 left-1 right-1 flex justify-between bg-black/60 p-0.5 rounded">
                        <button type="button" onClick={() => moveNewVariantFile(idx, -1)} disabled={idx === 0} className="p-0.5 text-white disabled:opacity-30"><ChevronLeft size={12} /></button>
                        <button type="button" onClick={() => moveNewVariantFile(idx, 1)} disabled={idx === newVariantImageFiles.length - 1} className="p-0.5 text-white disabled:opacity-30"><ChevronRight size={12} /></button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNewVariantFile(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-90"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}

                {existingVariantImages.length + newVariantImageFiles.length < 10 && (
                  <label className="aspect-square border-2 border-dashed border-neutral-300 hover:border-brand-gold flex flex-col items-center justify-center text-neutral-400 hover:text-brand-gold cursor-pointer rounded bg-neutral-50">
                    <Plus size={24} />
                    <span className="text-[10px] font-semibold mt-1">Add Image</span>
                    <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleVariantImagesSelect} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 6: MEDIA & 360° SPIN REORDERING & VIDEO PREVIEW */}
          <div className="bg-neutral-50 p-5 rounded-lg border border-brand-light space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-gold border-b border-neutral-200 pb-2">6. 360° Interactive View & Video Showcase</h3>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* 360° View Toggle & Reordering Grid */}
              <div className="bg-white p-4 border border-brand-light rounded-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800">Enable 360° Interactive View</span>
                  <Switch checked={form.has360View} onChange={checked => set('has360View', checked)} />
                </div>

                {form.has360View && (
                  <div className="pt-2 border-t border-neutral-200 space-y-3">
                    <label className="block text-[11px] font-semibold text-neutral-700">Upload 360° Frames ({combinedSpinPreviews.length} frames)</label>
                    <input type="file" multiple accept="image/*" onChange={handleSpinFileSelect} className="text-xs text-neutral-500" />

                    {/* Frame Reordering Grid */}
                    {combinedSpinPreviews.length > 0 && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 bg-neutral-100 rounded border border-neutral-200">
                          {existingSpinImages.map((src, i) => (
                            <div key={`expin-${i}`} className="relative aspect-square border border-neutral-300 rounded overflow-hidden bg-white group">
                              <img src={src} alt={`Spin ${i}`} className="w-full h-full object-cover" />
                              <span className="absolute top-0.5 left-0.5 bg-black/70 text-white text-[8px] px-1 rounded">#{i + 1}</span>
                              <div className="absolute bottom-0.5 left-0.5 right-0.5 flex justify-between bg-black/70 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                <button type="button" onClick={() => moveSpinFrame(i, -1, false)} disabled={i === 0} className="text-white disabled:opacity-30"><ChevronLeft size={10} /></button>
                                <button type="button" onClick={() => moveSpinFrame(i, 1, false)} disabled={i === existingSpinImages.length - 1} className="text-white disabled:opacity-30"><ChevronRight size={10} /></button>
                              </div>
                              <button type="button" onClick={() => removeSpinFrame(i, false)} className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded-full"><X size={8} /></button>
                            </div>
                          ))}
                          {newSpinImageFiles.map((f, i) => (
                            <div key={`newspin-${i}`} className="relative aspect-square border-2 border-brand-gold rounded overflow-hidden bg-white group">
                              <img src={f.preview} alt={`New Spin ${i}`} className="w-full h-full object-cover" />
                              <span className="absolute top-0.5 left-0.5 bg-brand-gold text-black text-[8px] font-bold px-1 rounded">#{existingSpinImages.length + i + 1}</span>
                              <div className="absolute bottom-0.5 left-0.5 right-0.5 flex justify-between bg-black/70 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                <button type="button" onClick={() => moveSpinFrame(i, -1, true)} disabled={i === 0} className="text-white disabled:opacity-30"><ChevronLeft size={10} /></button>
                                <button type="button" onClick={() => moveSpinFrame(i, 1, true)} disabled={i === newSpinImageFiles.length - 1} className="text-white disabled:opacity-30"><ChevronRight size={10} /></button>
                              </div>
                              <button type="button" onClick={() => removeSpinFrame(i, true)} className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded-full"><X size={8} /></button>
                            </div>
                          ))}
                        </div>

                        {/* Interactive Rotation Preview */}
                        <SpinViewerPreview images={combinedSpinPreviews} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Video Toggle & Live Video Preview */}
              <div className="bg-white p-4 border border-brand-light rounded-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800">Enable Showcase Video</span>
                  <Switch checked={form.hasVideo} onChange={checked => set('hasVideo', checked)} />
                </div>

                {form.hasVideo && (
                  <div className="pt-2 border-t border-neutral-200 space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-700 mb-1">Video URL (MP4 / WebM)</label>
                      <input
                        type="text"
                        value={form.videoUrl}
                        onChange={e => set('videoUrl', e.target.value)}
                        placeholder="https://example.com/video.mp4 or /uploads/..."
                        className="w-full border border-neutral-300 px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand-gold rounded-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-700 mb-1">Or Upload Video File</label>
                      <input type="file" accept="video/mp4,video/webm" onChange={e => setVideoFile(e.target.files?.[0] || null)} className="text-xs text-neutral-500" />
                    </div>

                    {/* Inline Video Player Preview */}
                    {(videoFile || form.videoUrl) && (
                      <div className="mt-2 space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase">Inline Video Preview</label>
                        <video
                          src={videoFile ? URL.createObjectURL(videoFile) : form.videoUrl}
                          controls
                          className="w-full max-h-48 rounded border border-neutral-300 bg-black object-contain"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 7: STATUS TOGGLES */}
          <div className="bg-neutral-50 p-5 rounded-lg border border-brand-light space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-gold border-b border-neutral-200 pb-2">7. Status & Storefront Toggles</h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <label className="flex items-center justify-between bg-white p-3 border border-brand-light rounded-sm cursor-pointer">
                <span className="text-xs font-semibold text-neutral-700">Featured</span>
                <Switch checked={form.isFeatured} onChange={checked => set('isFeatured', checked)} />
              </label>

              <label className="flex items-center justify-between bg-white p-3 border border-brand-light rounded-sm cursor-pointer">
                <span className="text-xs font-semibold text-neutral-700">New Arrival</span>
                <Switch checked={form.isNewArrival} onChange={checked => set('isNewArrival', checked)} />
              </label>

              <label className="flex items-center justify-between bg-white p-3 border border-brand-light rounded-sm cursor-pointer">
                <span className="text-xs font-semibold text-neutral-700">Best Seller</span>
                <Switch checked={form.isBestSeller} onChange={checked => set('isBestSeller', checked)} />
              </label>

              <label className="flex items-center justify-between bg-white p-3 border border-brand-light rounded-sm cursor-pointer">
                <span className="text-xs font-semibold text-neutral-700">Authenticity Badge</span>
                <Switch checked={form.hasAuthenticityBadge} onChange={checked => set('hasAuthenticityBadge', checked)} />
              </label>

              <label className="flex items-center justify-between bg-white p-3 border border-brand-light rounded-sm cursor-pointer">
                <span className="text-xs font-semibold text-neutral-700">Active (Visible)</span>
                <Switch checked={form.isActive} onChange={checked => set('isActive', checked)} />
              </label>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-brand-light">
            {/* Preview Product button commented out as requested */}
            {/* <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="px-4 py-2 text-xs font-bold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-sm transition-colors flex items-center gap-1.5 uppercase tracking-wider"
            >
              <Eye size={14} className="text-brand-gold" /> Preview Product
            </button> */}
            <div />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded-sm transition-colors uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-xs font-bold text-white bg-brand-gold hover:bg-brand-gold/90 rounded-sm transition-colors uppercase tracking-wider shadow-md"
              >
                {product ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>

      {/* Live Storefront Preview Modal */}
      <AnimatePresence>
        {previewOpen && (
          <ProductLivePreviewModal
            product={constructedPreviewProduct}
            onClose={() => setPreviewOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main Products Admin Page ────────────────────────────────────────────────
const ProductsAdminPage = () => {
  const dispatch = useDispatch();
  const { items, loading, total } = useSelector(s => s.products);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);

  useEffect(() => {
    dispatch(fetchAdminProducts({ search: search || undefined }));
  }, [search, dispatch]);

  const handleSave = async (form) => {
    try {
      if (editing) {
        await dispatch(updateProduct({ id: editing.id, data: form })).unwrap();
        toast.success('Product updated successfully');
      } else {
        await dispatch(createProduct(form)).unwrap();
        toast.success('Product created successfully');
      }
      setModalOpen(false);
      setEditing(null);
      dispatch(fetchAdminProducts({ search: search || undefined }));
    } catch (err) {
      const errMsg = typeof err === 'string' ? err : (err?.message || err?.error || 'Failed to save product');
      toast.error(errMsg);
    }
  };

  const executeDelete = async (id) => {
    try {
      await dispatch(deleteProduct(id)).unwrap();
      toast.success('Product deactivated successfully');
      dispatch(fetchAdminProducts({ search: search || undefined }));
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
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setPreviewProduct(product)} className="p-1.5 text-brand-grey hover:text-brand-gold transition-colors" title="Live Preview">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => { setEditing(product); setModalOpen(true); }} className="p-1.5 text-brand-grey hover:text-brand-gold transition-colors" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-1.5 text-brand-grey hover:text-red-400 transition-colors" title="Delete">
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
        {modalOpen && <ProductModal product={editing} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={handleSave} />}
        {previewProduct && <ProductLivePreviewModal product={previewProduct} onClose={() => setPreviewProduct(null)} />}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default ProductsAdminPage;