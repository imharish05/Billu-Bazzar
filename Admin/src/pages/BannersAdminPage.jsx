import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, ToggleLeft, ToggleRight, Upload, AlertCircle, RefreshCw } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import Switch from '../components/Switch';
import api from '../services/api';
import toast from 'react-hot-toast';

const formatDatetimeLocal = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const checkImageDimensions = (fileOrUrl) => {
  return new Promise((resolve) => {
    if (!fileOrUrl) {
      resolve(null);
      return;
    }
    const img = new Image();
    if (typeof fileOrUrl === 'string') {
      img.crossOrigin = 'anonymous';
      img.src = fileOrUrl;
    } else if (fileOrUrl instanceof File) {
      img.src = URL.createObjectURL(fileOrUrl);
    } else {
      resolve(null);
      return;
    }
    img.onload = () => {
      if (fileOrUrl instanceof File) URL.revokeObjectURL(img.src);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      if (fileOrUrl instanceof File) URL.revokeObjectURL(img.src);
      resolve(null);
    };
  });
};

const BANNER_SPECS = {
  HERO: {
    label: 'HERO',
    recommended: '1920x1080px',
    aspectLabel: '16:9 Landscape',
    minWidth: 1200,
    minRatio: 1.60,
    maxRatio: 2.00,
  },
  EXCLUSIVE_DEAL: {
    label: 'EXCLUSIVE DEAL',
    recommended: '1920x640px',
    aspectLabel: '3:1 Ultra-Wide Landscape',
    minWidth: 1200,
    minRatio: 2.60,
    maxRatio: 3.40,
  },
  PROMO: {
    label: 'PROMO',
    recommended: '1080x1350px',
    aspectLabel: '4:5 Portrait',
    minWidth: 600,
    minRatio: 0.75,
    maxRatio: 0.85,
  },
  COUNTDOWN: {
    label: 'COUNTDOWN',
    recommended: '1080x1350px',
    aspectLabel: '4:5 Portrait',
    minWidth: 600,
    minRatio: 0.75,
    maxRatio: 0.85,
  },
};

const BannersAdminPage = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageInvalid, setImageInvalid] = useState(false);
  const [imageErrorMsg, setImageErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '', subtitle: '', type: 'HERO', ctaText: '', ctaLink: '',
    position: 1, isActive: true, badgeText: '', countdown: '',
  });

  useEffect(() => {
    if (!modalOpen) {
      setImageInvalid(false);
      setImageErrorMsg('');
      return;
    }
    const validateCurrentImage = async () => {
      const source = imageFile || imagePreview;
      if (!source) {
        setImageInvalid(false);
        setImageErrorMsg('');
        return;
      }
      const dims = await checkImageDimensions(source);
      if (!dims) {
        setImageInvalid(false);
        setImageErrorMsg('');
        return;
      }

      const spec = BANNER_SPECS[form.type];
      if (!spec) return;

      const ratio = dims.width / dims.height;

      if (dims.width < spec.minWidth) {
        setImageInvalid(true);
        setImageErrorMsg(`${spec.label} banner requires a ${spec.aspectLabel} image. Minimum required width is ${spec.minWidth}px. Your image is ${dims.width}x${dims.height}px.`);
        return;
      }

      if (ratio < spec.minRatio || ratio > spec.maxRatio) {
        setImageInvalid(true);
        setImageErrorMsg(`${spec.label} banner requires a ${spec.aspectLabel} image (${ratio.toFixed(2)}:1 aspect ratio looks off). Recommended size is ${spec.recommended} (${spec.aspectLabel}). Your image is ${dims.width}x${dims.height}px.`);
        return;
      }

      setImageInvalid(false);
      setImageErrorMsg('');
    };

    validateCurrentImage();
  }, [form.type, imageFile, imagePreview, modalOpen]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/banners?all=true');
      setBanners(res.data.banners || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openModal = (b = null) => {
    setEditing(b);
    setUploadProgress(null);
    setUploadError(null);
    setImagePreview(b?.image || null);
    setImageFile(null);
    setIsDragging(false);
    setForm(b
      ? { title: b.title || '', subtitle: b.subtitle || '', type: b.type, ctaText: b.ctaText || '', ctaLink: b.ctaLink || '', position: b.position, isActive: b.isActive, badgeText: b.badgeText || '', countdown: b.countdown ? formatDatetimeLocal(b.countdown) : '' }
      : { title: '', subtitle: '', type: 'HERO', ctaText: '', ctaLink: '', position: 1, isActive: true, badgeText: '', countdown: '' }
    );
    setModalOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (eOrFile) => {
    const file = eOrFile instanceof File ? eOrFile : eOrFile.target.files?.[0];
    if (!file) {
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(`File size exceeds 5MB limit. Your image is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
      return;
    }
    setUploadError(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setUploadProgress(0);
    setUploadError(null);

    // Validate HERO mandatory fields
    if (form.type === 'HERO') {
      if (!form.ctaLink?.trim()) {
        setUploadError('CTA Link is required for Hero banners.');
        setSaving(false); setUploadProgress(null); return;
      }
    }

    // Validate COUNTDOWN mandatory fields (ALL fields required)
    if (form.type === 'COUNTDOWN') {
      if (!form.title?.trim()) {
        setUploadError('Title is required for Countdown banner.');
        setSaving(false); setUploadProgress(null); return;
      }
      if (!form.subtitle?.trim()) {
        setUploadError('Subtitle is required for Countdown banner.');
        setSaving(false); setUploadProgress(null); return;
      }
      if (!form.ctaText?.trim()) {
        setUploadError('CTA Button Text is required for Countdown banner.');
        setSaving(false); setUploadProgress(null); return;
      }
      if (!form.ctaLink?.trim()) {
        setUploadError('CTA Link is required for Countdown banner.');
        setSaving(false); setUploadProgress(null); return;
      }
      if (!form.badgeText?.trim()) {
        setUploadError('Badge Text is required for Countdown banner.');
        setSaving(false); setUploadProgress(null); return;
      }
      if (!form.countdown) {
        setUploadError('Offer Ends At date & time is required for Countdown banner.');
        setSaving(false); setUploadProgress(null); return;
      }
      if (new Date(form.countdown).getTime() <= Date.now()) {
        setUploadError('Countdown date & time cannot be in the past.');
        setSaving(false); setUploadProgress(null); return;
      }
    }

    // Validate PROMO mandatory fields
    if (form.type === 'PROMO') {
      if (!form.title?.trim()) {
        setUploadError('Title is required for Promo banner.');
        setSaving(false); setUploadProgress(null); return;
      }
      if (!form.subtitle?.trim()) {
        setUploadError('Subtitle is required for Promo banner.');
        setSaving(false); setUploadProgress(null); return;
      }
      if (!form.ctaLink?.trim()) {
        setUploadError('CTA Link is required for Promo banner.');
        setSaving(false); setUploadProgress(null); return;
      }
    }

    // Validate EXCLUSIVE_DEAL mandatory fields (ALL fields required)
    if (form.type === 'EXCLUSIVE_DEAL') {
      if (!form.title?.trim()) {
        setUploadError('Title is required for Exclusive Deal.');
        setSaving(false); setUploadProgress(null); return;
      }
      if (!form.subtitle?.trim()) {
        setUploadError('Subtitle is required for Exclusive Deal.');
        setSaving(false); setUploadProgress(null); return;
      }
      if (!form.ctaText?.trim()) {
        setUploadError('CTA Button Text is required for Exclusive Deal.');
        setSaving(false); setUploadProgress(null); return;
      }
      if (!form.ctaLink?.trim()) {
        setUploadError('CTA Link is required for Exclusive Deal.');
        setSaving(false); setUploadProgress(null); return;
      }
      if (!form.badgeText?.trim()) {
        setUploadError('Badge Text is required for Exclusive Deal.');
        setSaving(false); setUploadProgress(null); return;
      }
    }

    try {
      if (imageInvalid) {
        setUploadError(imageErrorMsg || `Image does not match size requirements for ${form.type} banner.`);
        setSaving(false);
        setUploadProgress(null);
        return;
      }
      const file = imageFile || fileInputRef.current?.files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          setUploadError(`File size exceeds 5MB limit. Your image is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
          setSaving(false);
          setUploadProgress(null);
          return;
        }
      }
      if (file) {
        const dims = await checkImageDimensions(file);
        if (dims) {
          const spec = BANNER_SPECS[form.type];
          if (spec) {
            const ratio = dims.width / dims.height;
            if (dims.width < spec.minWidth) {
              setUploadError(`${spec.label} banner image too small. Minimum required width is ${spec.minWidth}px. Your image is ${dims.width}x${dims.height}px.`);
              setSaving(false); setUploadProgress(null); return;
            }
            if (ratio < spec.minRatio || ratio > spec.maxRatio) {
              setUploadError(`${spec.label} banner aspect ratio looks off (${ratio.toFixed(2)}:1). Recommended size is ${spec.recommended} (${spec.aspectLabel}). Your image is ${dims.width}x${dims.height}px.`);
              setSaving(false); setUploadProgress(null); return;
            }
          }
        }
      }
      const fd = new FormData();
      if (!file && !editing) {
        setUploadError('Please select an image file');
        setSaving(false);
        return;
      }
      fd.append('title', form.title);
      fd.append('subtitle', form.subtitle);
      fd.append('type', form.type);
      fd.append('ctaText', form.ctaText);
      fd.append('ctaLink', form.ctaLink);
      fd.append('position', String(form.position));
      fd.append('isActive', String(form.isActive));
      fd.append('badgeText', form.badgeText);
      fd.append('countdown', form.countdown || '');
      if (file) fd.append('image', file);

      const config = {
        onUploadProgress: (pe) => {
          const pct = Math.round((pe.loaded / pe.total) * 100);
          setUploadProgress(pct);
        },
      };

      if (editing) {
        await api.put(`/banners/${editing.id}`, fd, config);
      } else {
        await api.post('/banners', fd, config);
      }

      setModalOpen(false);
      load();
    } catch (err) {
      setUploadError(err.response?.data?.message || err.message || 'Upload failed. Please retry.');
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  const executeDelete = async (id) => {
    try {
      await api.delete(`/banners/${id}`);
      toast.success('Banner deleted successfully');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete banner');
      console.error(err);
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1">
        <p className="text-sm font-semibold text-neutral-800">Confirm Deletion</p>
        <p className="text-xs text-neutral-600">Are you sure you want to delete this banner?</p>
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

  const handleToggle = async (b) => {
    try {
      await api.put(`/banners/${b.id}`, { ...b, isActive: !b.isActive });
      toast.success(`Banner ${!b.isActive ? 'activated' : 'deactivated'}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update banner status');
      console.error(err);
    }
  };

  const filteredBanners = activeTab === 'All'
    ? banners
    : banners.filter(b => b.type === (activeTab === 'Exclusive Deal' ? 'EXCLUSIVE_DEAL' : activeTab.toUpperCase()));

  return (
    <AdminLayout title="Banners">
      {/* Tabs Nav Bar */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide" role="tablist">
        {['All', 'Hero', 'CountDown', 'Promo', 'Exclusive Deal'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            id={`banners-tab-${tab.toLowerCase()}`}
            className={`flex-shrink-0 px-4 py-2 text-xs font-medium rounded-lg border transition-all ${
              activeTab === tab
                ? 'bg-brand-gold border-brand-gold text-white'
                : 'bg-white border-brand-light text-brand-grey hover:bg-brand-light'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-brand-grey">{filteredBanners.length} banner{filteredBanners.length !== 1 ? 's' : ''}</p>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2" id="add-banner-btn">
          <Plus size={16} /> Add Banner
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBanners.map(banner => (
            <div key={banner.id} className="bg-white rounded-xl shadow-sm overflow-hidden group">
              <div className="relative h-40 bg-brand-light">
                {banner.image ? (
                  <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-grey text-xs">No image</div>
                )}
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <span className="bg-brand-gold text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    {banner.type === 'EXCLUSIVE_DEAL' ? 'EXCLUSIVE DEAL' : banner.type}
                  </span>
                  <span className="bg-white/90 text-brand-text text-[10px] font-bold px-2 py-0.5 rounded">Pos: {banner.position}</span>
                  {!banner.isActive && (
                    <span className="bg-red-400 text-white text-[10px] font-bold px-2 py-0.5 rounded">Inactive</span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <p className="font-medium text-sm mb-1 line-clamp-1">{banner.title}</p>
                <p className="text-xs text-brand-grey line-clamp-1">{banner.subtitle}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center">
                    <Switch
                      checked={banner.isActive}
                      onChange={() => handleToggle(banner)}
                      id={`toggle-banner-${banner.id}`}
                    />
                  </div>
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
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-light sticky top-0 bg-white z-10">
                <h2 className="font-playfair text-lg font-semibold">{editing ? 'Edit Banner' : 'Add Banner'}</h2>
                <button onClick={() => setModalOpen(false)} className="p-1.5 hover:text-brand-gold"><X size={18} /></button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                {/* Type + Position (Placed at top so specs update first) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-grey mb-1.5" htmlFor="ban-type">Banner Type *</label>
                    <select id="ban-type" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold bg-white rounded-sm font-medium">
                      <option value="HERO">HERO</option>
                      <option value="EXCLUSIVE_DEAL">EXCLUSIVE DEAL</option>
                      <option value="PROMO">PROMO</option>
                      <option value="COUNTDOWN">COUNTDOWN</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-grey mb-1.5" htmlFor="ban-pos">Position (order)</label>
                    <input id="ban-pos" type="number" value={form.position} onChange={e => setForm(p => ({ ...p, position: Number(e.target.value) }))} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-sm" />
                  </div>
                </div>

                {/* Image upload — file input only, no URL */}
                <div>
                  <label className="block text-xs font-semibold text-brand-grey mb-1.5">Banner Image *</label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                      imageInvalid
                        ? 'border-red-500 bg-red-50/40'
                        : isDragging
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
                        handleFileSelect(file);
                      }
                    }}
                  >
                    {imagePreview ? (
                      <div className="relative">
                        <img src={imagePreview} alt="Preview" className="max-h-36 mx-auto object-contain rounded" />
                        <button type="button" onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute top-1 right-1 bg-white/80 p-0.5 rounded hover:bg-white"><X size={14} /></button>
                      </div>
                    ) : (
                      <div className="py-6">
                        <Upload size={28} className="mx-auto text-brand-grey mb-2" />
                        <p className="text-sm text-brand-grey font-medium">Drag & drop image here, or click to upload</p>
                        <p className="text-xs text-brand-grey mt-1">JPEG, PNG, WebP — max 5MB</p>
                        <p className="text-[11px] text-brand-gold font-semibold mt-1.5">
                          Recommended size for {form.type}: <span className="underline">{BANNER_SPECS[form.type]?.recommended}</span>
                        </p>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />

                  {/* Red Note for Image Size Mismatch */}
                  {imageInvalid && (
                    <div className="mt-2.5 p-3 bg-red-50 border border-red-300 rounded-lg text-red-700 text-xs flex items-start gap-2 shadow-2xs">
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-600" />
                      <div className="flex-1 font-medium leading-relaxed">
                        {imageErrorMsg}
                      </div>
                    </div>
                  )}
                </div>

                {/* Countdown Time */}
                {form.type === 'COUNTDOWN' && (
                  <div>
                    <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="ban-countdown">Offer Ends At (Date & Time) *</label>
                    <input id="ban-countdown" type="datetime-local" min={formatDatetimeLocal(new Date().toISOString())} value={form.countdown} onChange={e => setForm(p => ({ ...p, countdown: e.target.value }))} required className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
                  </div>
                )}

                {/* CTA */}
                <div>
                  <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="ban-ctaText">CTA Button Text {(form.type === 'EXCLUSIVE_DEAL' || form.type === 'COUNTDOWN') && '*'}</label>
                  <input id="ban-ctaText" type="text" value={form.ctaText} onChange={e => setForm(p => ({ ...p, ctaText: e.target.value }))} required={form.type === 'EXCLUSIVE_DEAL' || form.type === 'COUNTDOWN'} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
                </div>
                 <div>
                  <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="ban-ctaLink">CTA Link *</label>
                  <input id="ban-ctaLink" type="text" value={form.ctaLink} onChange={e => setForm(p => ({ ...p, ctaLink: e.target.value }))} required className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
                </div>

                {/* Badge + Active */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-brand-grey mb-1.5" htmlFor="ban-badge">Badge Text {(form.type === 'EXCLUSIVE_DEAL' || form.type === 'COUNTDOWN') && '*'}</label>
                    <input id="ban-badge" type="text" value={form.badgeText} onChange={e => setForm(p => ({ ...p, badgeText: e.target.value }))} required={form.type === 'EXCLUSIVE_DEAL' || form.type === 'COUNTDOWN'} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none" htmlFor="ban-active">
                      <Switch checked={form.isActive} onChange={val => setForm(p => ({ ...p, isActive: typeof val === 'boolean' ? val : val?.target?.checked }))} id="ban-active" />
                      Active
                    </label>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2 border-t border-brand-light">
                  <button type="button" onClick={() => setModalOpen(false)} className="btn-outline flex-1" id="ban-cancel" disabled={saving}>Cancel</button>
                  <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" id="ban-save" disabled={saving || uploadProgress !== null || imageInvalid}>
                    {saving ? (
                      <><RefreshCw size={14} className="animate-spin" /> {uploadProgress !== null ? `${uploadProgress}%` : 'Saving...'}</>
                    ) : (
                      editing ? 'Update Banner' : 'Save Banner'
                    )}
                  </button>
                </div>

                {uploadError && (
                  <button type="button" onClick={handleSave} className="w-full text-sm text-brand-gold hover:underline flex items-center justify-center gap-1">
                    <RefreshCw size={14} /> Retry Upload
                  </button>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};
export default BannersAdminPage;
