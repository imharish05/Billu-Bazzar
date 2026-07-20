import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try { const res = await api.get('/cart'); return res.data.cart; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const addToCart = createAsyncThunk('cart/add', async (item, { rejectWithValue, dispatch }) => {
  try { await api.post('/cart/add', item); dispatch(fetchCart()); }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const syncCart = createAsyncThunk('cart/sync', async (items, { rejectWithValue }) => {
  try {
    const res = await api.post('/cart/sync', { items });
    return res.data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});


export const updateCartItem = createAsyncThunk('cart/update', async ({ itemId, quantity }, { rejectWithValue, dispatch }) => {
  try { await api.put(`/cart/item/${itemId}`, { quantity }); dispatch(fetchCart()); }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const removeFromCart = createAsyncThunk('cart/remove', async (itemId, { rejectWithValue, dispatch }) => {
  try { await api.delete(`/cart/item/${itemId}`); dispatch(fetchCart()); }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

// ── Local cart (guest — before auth) ─────────────────────────────────────────
const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    subtotal: 0,
    isOpen: false,   // cart drawer open state
    loading: false,
    error: null,
  },
  reducers: {
    openCart: (state) => { state.isOpen = true; },
    closeCart: (state) => { state.isOpen = false; },
    toggleCart: (state) => { state.isOpen = !state.isOpen; },
    // Guest cart — local only
    addLocal: (state, action) => {
      const existing = state.items.find(i => i.productId === action.payload.productId);
      if (existing) { existing.quantity += action.payload.quantity || 1; }
      else state.items.push({ ...action.payload, quantity: action.payload.quantity || 1 });
      state.subtotal = state.items.reduce((s, i) => s + i.priceAtAdd * i.quantity, 0);
    },
    removeLocal: (state, action) => {
      state.items = state.items.filter(i => i.productId !== action.payload);
      state.subtotal = state.items.reduce((s, i) => s + i.priceAtAdd * i.quantity, 0);
    },
    clearLocal: (state) => { state.items = []; state.subtotal = 0; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => { state.loading = true; })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.items || [];
        state.subtotal = action.payload?.subtotal || 0;
      })
      .addCase(syncCart.fulfilled, (state, action) => {
        state.items = action.payload?.items || [];
        state.subtotal = action.payload?.subtotal || 0;
      })
      .addCase(fetchCart.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

  },
});

export const { openCart, closeCart, toggleCart, addLocal, removeLocal, clearLocal } = cartSlice.actions;
export default cartSlice.reducer;
