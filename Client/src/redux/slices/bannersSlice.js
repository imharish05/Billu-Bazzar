import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchBanners = createAsyncThunk('banners/fetch', async (type, { rejectWithValue }) => {
  try { const res = await api.get('/banners', { params: type ? { type } : {} }); return res.data.banners; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const bannersSlice = createSlice({
  name: 'banners', initialState: { items: [], loading: false, error: null }, reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchBanners.pending, (state) => { state.loading = true; })
      .addCase(fetchBanners.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchBanners.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});
export default bannersSlice.reducer;
