import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit2, ArrowRightLeft, ShieldAlert, CheckCircle2, ChevronRight, X, Sliders } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import Switch from '../components/Switch';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const EMPTY_WAREHOUSE_FORM = {
  name: '', code: '', contactName: '', contactPhone: '',
  city: '', state: '', pincode: '', address: {},
  isFulfillment: false, isActive: true
};

const WarehousesAdminPage = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [warehouseForm, setWarehouseForm] = useState({ ...EMPTY_WAREHOUSE_FORM });

  // Selected warehouse for inventory view
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [warehouseStock, setWarehouseStock] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockSearch, setStockSearch] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Adjust stock modal state
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [adjustMode, setAdjustMode] = useState('add'); // 'add' | 'reduce' | 'level'
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustAlertLevel, setAdjustAlertLevel] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // Stock Transfer state
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    productId: '',
    variantId: '',
    quantity: ''
  });
  const [transferring, setTransferring] = useState(false);
  const [allProductsList, setAllProductsList] = useState([]);

  // Load Warehouses
  const loadWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/warehouses');
      if (res.data.success) {
        setWarehouses(res.data.warehouses || []);
      }
    } catch (err) {
      toast.error('Failed to load warehouses: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, []);

  // Load selected warehouse stock
  const loadWarehouseStock = useCallback(async (warehouseId) => {
    try {
      setStockLoading(true);
      const res = await api.get(`/warehouses/${warehouseId}/stock`);
      if (res.data.success) {
        setWarehouseStock(res.data.stocks || []);
      }
    } catch (err) {
      toast.error('Failed to load warehouse stock: ' + (err.response?.data?.message || err.message));
    } finally {
      setStockLoading(false);
    }
  }, []);

  // Load all products (for transfer dropdown selection)
  const loadProducts = useCallback(async () => {
    try {
      const res = await api.get('/products?limit=1000');
      if (res.data.success) {
        setAllProductsList(res.data.products || []);
      }
    } catch (err) {
      console.error('Failed to load products list', err);
    }
  }, []);

  useEffect(() => {
    loadWarehouses();
    loadProducts();
  }, [loadWarehouses, loadProducts]);

  // Handle warehouse inventory click
  const handleSelectWarehouse = (wh) => {
    setSelectedWarehouse(wh);
    loadWarehouseStock(wh.id);
  };

  // Open Add/Edit warehouse modal
  const openWarehouseModal = (wh = null) => {
    if (wh) {
      setEditingWarehouse(wh);
      setWarehouseForm({
        name: wh.name,
        code: wh.code || '',
        contactName: wh.contactName || '',
        contactPhone: wh.contactPhone || '',
        city: wh.city || '',
        state: wh.state || '',
        pincode: wh.pincode || '',
        address: wh.address || {},
        isFulfillment: !!wh.isFulfillment,
        isActive: !!wh.isActive
      });
    } else {
      setEditingWarehouse(null);
      setWarehouseForm({ ...EMPTY_WAREHOUSE_FORM });
    }
    setModalOpen(true);
  };

  // Save warehouse (Create / Update)
  const handleSaveWarehouse = async (e) => {
    e.preventDefault();
    try {
      if (editingWarehouse) {
        const res = await api.put(`/warehouses/${editingWarehouse.id}`, warehouseForm);
        if (res.data.success) {
          toast.success('Warehouse updated successfully');
        }
      } else {
        const res = await api.post('/warehouses', warehouseForm);
        if (res.data.success) {
          toast.success('Warehouse created successfully');
        }
      }
      setModalOpen(false);
      loadWarehouses();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save warehouse');
    }
  };

  // Open adjust stock modal
  const openAdjustStockModal = (stockItem) => {
    setSelectedStockItem(stockItem);
    setAdjustAlertLevel(stockItem.reorderLevel || '10');
    setAdjustQty('');
    setAdjustMode('add');
    setAdjustModalOpen(true);
  };

  // Save stock adjustment
  const handleAdjustStockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStockItem) return;
    setAdjusting(true);

    try {
      let finalQuantity = selectedStockItem.quantity;
      if (adjustMode === 'add') {
        finalQuantity += parseInt(adjustQty, 10) || 0;
      } else if (adjustMode === 'reduce') {
        const deduct = parseInt(adjustQty, 10) || 0;
        if (deduct > selectedStockItem.quantity) {
          toast.error('Cannot reduce more than available stock.');
          setAdjusting(false);
          return;
        }
        finalQuantity -= deduct;
      }

      const res = await api.post(`/warehouses/${selectedWarehouse.id}/stock/upsert`, {
        productId: selectedStockItem.productId,
        variantId: selectedStockItem.variantId,
        quantity: finalQuantity,
        reorderLevel: parseInt(adjustAlertLevel, 10) || 10
      });

      if (res.data.success) {
        toast.success('Stock adjusted successfully');
        setAdjustModalOpen(false);
        loadWarehouseStock(selectedWarehouse.id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to adjust stock');
    } finally {
      setAdjusting(false);
    }
  };

  // Open transfer stock modal
  const openTransferModal = (stockItem = null) => {
    setTransferForm({
      fromWarehouseId: selectedWarehouse ? selectedWarehouse.id : '',
      toWarehouseId: '',
      productId: stockItem ? stockItem.productId : '',
      variantId: stockItem ? (stockItem.variantId || '') : '',
      quantity: ''
    });
    setSelectedStockItem(stockItem);
    setTransferModalOpen(true);
  };

  // Save stock transfer
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferForm.fromWarehouseId || !transferForm.toWarehouseId || !transferForm.productId || !transferForm.quantity) {
      toast.error('Please fill in all required fields');
      return;
    }
    setTransferring(true);

    try {
      const res = await api.post('/warehouses/transfer', {
        fromWarehouseId: parseInt(transferForm.fromWarehouseId, 10),
        toWarehouseId: parseInt(transferForm.toWarehouseId, 10),
        productId: parseInt(transferForm.productId, 10),
        variantId: transferForm.variantId ? parseInt(transferForm.variantId, 10) : null,
        quantity: parseInt(transferForm.quantity, 10)
      });

      if (res.data.success) {
        toast.success('Stock transferred successfully');
        setTransferModalOpen(false);
        if (selectedWarehouse) {
          loadWarehouseStock(selectedWarehouse.id);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to transfer stock');
    } finally {
      setTransferring(false);
    }
  };

  // Helper to format attributes JSON
  const renderAttributes = (attributes) => {
    if (!attributes) return '';
    const parsed = typeof attributes === 'string' ? JSON.parse(attributes) : attributes;
    return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(' · ');
  };

  // Filtered Stock list
  const filteredStock = warehouseStock.filter(item => {
    const productName = item.product?.name || '';
    const variantSku = item.variant?.sku || item.product?.sku || '';
    const matchSearch = productName.toLowerCase().includes(stockSearch.toLowerCase()) || variantSku.toLowerCase().includes(stockSearch.toLowerCase());
    
    if (onlyLowStock) {
      return matchSearch && item.quantity <= item.reorderLevel;
    }
    return matchSearch;
  });

  return (
    <AdminLayout title="Multi-Warehouse & Fulfillment Inventory">
      {/* Overview Cards */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Warehouses Configuration</h2>
          <p className="text-xs text-brand-grey">Setup procurement hubs and shipping centers</p>
        </div>
        <button
          onClick={() => openWarehouseModal()}
          className="px-4 py-2 bg-neutral-950 text-white hover:bg-neutral-800 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-sm rounded-none"
        >
          <Plus size={14} /> Add Warehouse
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {warehouses.map(w => (
            <div
              key={w.id}
              className={`bg-white border transition-all relative overflow-hidden ${
                selectedWarehouse?.id === w.id ? 'border-brand-gold ring-1 ring-brand-gold/30' : 'border-neutral-200 hover:border-neutral-350'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-base text-neutral-900">{w.name}</h3>
                    <p className="text-xs font-mono font-medium text-brand-gold mt-0.5">{w.code}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 ${w.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-150 text-gray-500'}`}>
                      {w.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {w.isFulfillment && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-brand-gold/10 text-brand-gold">
                        Fulfillment Hub
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-xs text-brand-grey mb-4">
                  <p>📍 {w.city}, {w.state} {w.pincode}</p>
                  <p>📞 {w.contactName} ({w.contactPhone})</p>
                </div>

                <div className="pt-4 border-t border-brand-light flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold text-neutral-900">
                      {w.stocks?.reduce((acc, curr) => acc + (curr.quantity || 0), 0).toLocaleString('en-IN') || 0}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-brand-grey">Total Units in Stock</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openWarehouseModal(w)}
                      className="px-2.5 py-1.5 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-[11px] font-semibold uppercase tracking-wider transition-all"
                    >
                      Configure
                    </button>
                    <button
                      onClick={() => handleSelectWarehouse(w)}
                      className="px-2.5 py-1.5 bg-neutral-900 text-white hover:bg-neutral-800 text-[11px] font-semibold uppercase tracking-wider transition-all flex items-center gap-1"
                    >
                      Manage Stock <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Warehouse Stock Details */}
      {selectedWarehouse && (
        <div className="bg-white border border-neutral-200 p-6 mb-8 transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-brand-light">
            <div>
              <h3 className="text-base font-semibold text-neutral-950 flex items-center gap-2">
                📦 Stock Inventory: <span className="text-brand-gold">{selectedWarehouse.name}</span>
              </h3>
              <p className="text-xs text-brand-grey mt-0.5">Manage quantities, custom reorder levels, and transfers</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey" />
                <input
                  type="text"
                  placeholder="Search SKU or name..."
                  value={stockSearch}
                  onChange={e => setStockSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-brand-light text-xs focus:outline-none focus:border-brand-gold max-w-[200px]"
                />
              </div>

              {/* Low Stock Toggle */}
              <label className="flex items-center gap-2 text-xs font-semibold text-neutral-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyLowStock}
                  onChange={e => setOnlyLowStock(e.target.checked)}
                  className="rounded border-neutral-300 text-brand-gold focus:ring-brand-gold accent-brand-gold"
                />
                Low Stock Only
              </label>

              {/* Actions */}
              <button
                onClick={() => openTransferModal()}
                className="px-3 py-1.5 bg-brand-gold text-white hover:bg-[#a8712a] text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 rounded-none"
              >
                <ArrowRightLeft size={13} /> Stock Transfer
              </button>
            </div>
          </div>

          {stockLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-gold" />
            </div>
          ) : filteredStock.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-brand-light bg-neutral-50/50">
              <p className="text-sm text-brand-grey font-medium">No stock records found matching your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" aria-label="Warehouse Stock list">
                <thead>
                  <tr className="bg-neutral-50 border-b border-brand-light text-brand-grey font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">Variant Details</th>
                    <th className="px-4 py-3">SKU Code</th>
                    <th className="px-4 py-3 text-center">Qty in Hand</th>
                    <th className="px-4 py-3 text-center">Alert Level</th>
                    <th className="px-4 py-3 text-center">Inventory Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStock.map(item => {
                    const isLow = item.quantity <= item.reorderLevel;
                    const prodName = item.product?.name || 'N/A';
                    const isVar = !!item.variantId;
                    const variantDetails = isVar ? renderAttributes(item.variant?.attributes) : 'Default (No Variants)';
                    const skuCode = isVar ? (item.variant?.sku || 'N/A') : (item.product?.sku || 'N/A');

                    return (
                      <tr key={item.id} className="border-b border-brand-light hover:bg-neutral-50/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-neutral-900">{prodName}</td>
                        <td className="px-4 py-3 text-brand-grey font-medium">{variantDetails}</td>
                        <td className="px-4 py-3 font-mono font-medium text-neutral-800">{skuCode}</td>
                        <td className="px-4 py-3 text-center font-bold text-sm text-neutral-900">{item.quantity}</td>
                        <td className="px-4 py-3 text-center font-semibold text-brand-grey">{item.reorderLevel}</td>
                        <td className="px-4 py-3 text-center">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                              <ShieldAlert size={10} /> Low Stock Alert
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                              <CheckCircle2 size={10} /> In Stock
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => openAdjustStockModal(item)}
                              className="px-2 py-1 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-semibold uppercase tracking-wider text-[10px]"
                            >
                              Adjust Qty
                            </button>
                            <button
                              onClick={() => openTransferModal(item)}
                              className="px-2 py-1 bg-neutral-900 text-white hover:bg-neutral-800 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1"
                            >
                              Ship / Transfer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Warehouse Add/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white border border-neutral-200 w-full max-w-lg shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-light bg-neutral-50">
                <h3 className="font-playfair text-base font-semibold">{editingWarehouse ? 'Edit Warehouse Parameters' : 'Register New Warehouse'}</h3>
                <button onClick={() => setModalOpen(false)} className="text-brand-grey hover:text-brand-gold transition-colors"><X size={18} /></button>
              </div>
              <form onSubmit={handleSaveWarehouse} className="p-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-brand-grey mb-1">Warehouse Name *</label>
                    <input
                      type="text"
                      required
                      value={warehouseForm.name}
                      onChange={e => setWarehouseForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full border border-brand-light px-3 py-2 text-xs focus:outline-none focus:border-brand-gold rounded-none"
                      placeholder="e.g. Mumbai Fulfillment Center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-brand-grey mb-1">Unique Code *</label>
                    <input
                      type="text"
                      required
                      value={warehouseForm.code}
                      onChange={e => setWarehouseForm(f => ({ ...f, code: e.target.value.toUpperCase().trim() }))}
                      className="w-full border border-brand-light px-3 py-2 text-xs focus:outline-none focus:border-brand-gold rounded-none font-mono"
                      placeholder="e.g. IND-FULFILL"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-brand-grey mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={warehouseForm.contactName}
                      onChange={e => setWarehouseForm(f => ({ ...f, contactName: e.target.value }))}
                      className="w-full border border-brand-light px-3 py-2 text-xs focus:outline-none focus:border-brand-gold rounded-none"
                      placeholder="e.g. Vikram Sharma"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-brand-grey mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={warehouseForm.contactPhone}
                      onChange={e => setWarehouseForm(f => ({ ...f, contactPhone: e.target.value }))}
                      className="w-full border border-brand-light px-3 py-2 text-xs focus:outline-none focus:border-brand-gold rounded-none"
                      placeholder="e.g. +91 9988776655"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-brand-grey mb-1">City</label>
                    <input
                      type="text"
                      value={warehouseForm.city}
                      onChange={e => setWarehouseForm(f => ({ ...f, city: e.target.value }))}
                      className="w-full border border-brand-light px-3 py-2 text-xs focus:outline-none focus:border-brand-gold rounded-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-brand-grey mb-1">State</label>
                    <input
                      type="text"
                      value={warehouseForm.state}
                      onChange={e => setWarehouseForm(f => ({ ...f, state: e.target.value }))}
                      className="w-full border border-brand-light px-3 py-2 text-xs focus:outline-none focus:border-brand-gold rounded-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-brand-grey mb-1">Pincode</label>
                    <input
                      type="text"
                      value={warehouseForm.pincode}
                      onChange={e => setWarehouseForm(f => ({ ...f, pincode: e.target.value }))}
                      className="w-full border border-brand-light px-3 py-2 text-xs focus:outline-none focus:border-brand-gold rounded-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-neutral-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={warehouseForm.isFulfillment}
                      onChange={e => setWarehouseForm(f => ({ ...f, isFulfillment: e.target.checked }))}
                      className="rounded border-neutral-350 text-brand-gold focus:ring-brand-gold accent-brand-gold"
                    />
                    Mark as direct Fulfillment Warehouse (customer orders will ship from here)
                  </label>

                  <div className="flex items-center justify-between bg-neutral-50 p-3 border border-brand-light">
                    <span className="text-xs font-semibold text-neutral-700">Warehouse Status (Active)</span>
                    <Switch
                      checked={warehouseForm.isActive}
                      onChange={val => setWarehouseForm(f => ({ ...f, isActive: val }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-brand-light">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-xs font-semibold uppercase tracking-wider transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-neutral-950 text-white hover:bg-neutral-800 text-xs font-semibold uppercase tracking-wider transition-all"
                  >
                    Save Warehouse
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Adjust Stock Qty / Low-Stock Alerts Modal */}
      <AnimatePresence>
        {adjustModalOpen && selectedStockItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setAdjustModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white border border-neutral-200 w-full max-w-md shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-light bg-neutral-50">
                <h3 className="font-playfair text-base font-semibold">Adjust Stock / Configure Alert</h3>
                <button onClick={() => setAdjustModalOpen(false)} className="text-brand-grey hover:text-brand-gold transition-colors"><X size={18} /></button>
              </div>
              <form onSubmit={handleAdjustStockSubmit} className="p-6 space-y-4">
                <div className="bg-neutral-50 p-4 border border-brand-light text-xs space-y-1 text-brand-grey mb-2">
                  <p className="font-semibold text-neutral-900">{selectedStockItem.product?.name}</p>
                  {selectedStockItem.variantId && (
                    <p>Variant: <span className="font-semibold">{renderAttributes(selectedStockItem.variant?.attributes)}</span></p>
                  )}
                  <p>SKU: <span className="font-mono">{selectedStockItem.variant?.sku || selectedStockItem.product?.sku}</span></p>
                  <p className="pt-2 text-neutral-900 font-semibold text-sm">Current Warehouse Stock: <span className="text-brand-gold">{selectedStockItem.quantity} units</span></p>
                </div>

                {/* Adjust Mode Selection */}
                <div className="flex gap-2 mb-4">
                  {['add', 'reduce', 'level'].map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setAdjustMode(mode)}
                      className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider text-center border transition-all ${
                        adjustMode === mode
                          ? 'border-brand-gold bg-brand-gold/10 text-brand-gold'
                          : 'border-neutral-200 text-brand-grey hover:bg-neutral-50'
                      }`}
                    >
                      {mode === 'add' ? '＋ Receive / Add' : mode === 'reduce' ? '－ Ship / Deduct' : '⚙️ Reorder level'}
                    </button>
                  ))}
                </div>

                {adjustMode !== 'level' ? (
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-brand-grey mb-1">
                      {adjustMode === 'add' ? 'Quantity to add *' : 'Quantity to subtract *'}
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={adjustQty}
                      onChange={e => setAdjustQty(e.target.value)}
                      className="w-full border border-brand-light px-3 py-2 text-xs focus:outline-none focus:border-brand-gold rounded-none"
                      placeholder="e.g. 50"
                    />
                  </div>
                ) : null}

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-brand-grey mb-1">
                    Configurable Low-Stock Alert Level (Reorder Level)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={adjustAlertLevel}
                    onChange={e => setAdjustAlertLevel(e.target.value)}
                    className="w-full border border-brand-light px-3 py-2 text-xs focus:outline-none focus:border-brand-gold rounded-none"
                    placeholder="e.g. 10"
                  />
                  <p className="text-[10px] text-brand-grey mt-1">Triggers low stock warnings in admin panel when inventory falls below this limit.</p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-brand-light">
                  <button
                    type="button"
                    onClick={() => setAdjustModalOpen(false)}
                    className="px-4 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-xs font-semibold uppercase tracking-wider transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adjusting || (adjustMode !== 'level' && (!adjustQty || parseInt(adjustQty, 10) <= 0))}
                    className="px-4 py-2 bg-neutral-950 text-white hover:bg-neutral-800 text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
                  >
                    {adjusting ? 'Updating Stock...' : 'Apply Stock Update'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stock Transfer Modal */}
      <AnimatePresence>
        {transferModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setTransferModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white border border-neutral-200 w-full max-w-lg shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-light bg-neutral-50">
                <h3 className="font-playfair text-base font-semibold flex items-center gap-2">
                  <ArrowRightLeft size={16} /> Inter-Warehouse Stock Transfer
                </h3>
                <button onClick={() => setTransferModalOpen(false)} className="text-brand-grey hover:text-brand-gold transition-colors"><X size={18} /></button>
              </div>
              <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* From Warehouse */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-brand-grey mb-1">Source Warehouse (From) *</label>
                    <select
                      required
                      value={transferForm.fromWarehouseId}
                      onChange={e => setTransferForm(f => ({ ...f, fromWarehouseId: e.target.value }))}
                      className="w-full border border-brand-light bg-white px-3 py-2 text-xs focus:outline-none focus:border-brand-gold rounded-none"
                    >
                      <option value="">Select Source Warehouse</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                      ))}
                    </select>
                  </div>

                  {/* To Warehouse */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-brand-grey mb-1">Target Warehouse (To) *</label>
                    <select
                      required
                      value={transferForm.toWarehouseId}
                      onChange={e => setTransferForm(f => ({ ...f, toWarehouseId: e.target.value }))}
                      className="w-full border border-brand-light bg-white px-3 py-2 text-xs focus:outline-none focus:border-brand-gold rounded-none"
                    >
                      <option value="">Select Target Warehouse</option>
                      {warehouses
                        .filter(w => String(w.id) !== String(transferForm.fromWarehouseId))
                        .map(w => (
                          <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Product */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-brand-grey mb-1">Select Product *</label>
                    <select
                      required
                      value={transferForm.productId}
                      onChange={e => {
                        const prodId = e.target.value;
                        setTransferForm(f => ({ ...f, productId: prodId, variantId: '' }));
                      }}
                      className="w-full border border-brand-light bg-white px-3 py-2 text-xs focus:outline-none focus:border-brand-gold rounded-none"
                    >
                      <option value="">Choose Product</option>
                      {allProductsList.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Variant */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-brand-grey mb-1">Select Variant (Optional)</label>
                    <select
                      value={transferForm.variantId}
                      onChange={e => setTransferForm(f => ({ ...f, variantId: e.target.value }))}
                      disabled={!transferForm.productId}
                      className="w-full border border-brand-light bg-white px-3 py-2 text-xs focus:outline-none focus:border-brand-gold rounded-none disabled:bg-neutral-50"
                    >
                      <option value="">Select Variant (or Default Product)</option>
                      {allProductsList
                        .find(p => String(p.id) === String(transferForm.productId))
                        ?.variants?.map(v => (
                          <option key={v.id} value={v.id}>{v.sku} ({renderAttributes(v.attributes)})</option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Transfer Quantity */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-brand-grey mb-1">Transfer Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={transferForm.quantity}
                    onChange={e => setTransferForm(f => ({ ...f, quantity: e.target.value }))}
                    className="w-full border border-brand-light px-3 py-2 text-xs focus:outline-none focus:border-brand-gold rounded-none"
                    placeholder="Number of units to transfer"
                  />
                  <p className="text-[10px] text-brand-grey mt-1">Transfers the selected quantity, creating an audit log and deducting stock at source and incrementing at target.</p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-brand-light">
                  <button
                    type="button"
                    onClick={() => setTransferModalOpen(false)}
                    className="px-4 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-xs font-semibold uppercase tracking-wider transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={transferring}
                    className="px-4 py-2 bg-brand-gold text-white hover:bg-[#a8712a] text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
                  >
                    {transferring ? 'Executing Transfer...' : 'Complete Stock Transfer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default WarehousesAdminPage;
