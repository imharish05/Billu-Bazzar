import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchCategories = createAsyncThunk('categories/fetchTree', async (_, { rejectWithValue }) => {
  try { const res = await api.get('/categories/tree'); return res.data.categories; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => { state.loading = true; })
      .addCase(fetchCategories.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchCategories.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});
export default categoriesSlice.reducer;
