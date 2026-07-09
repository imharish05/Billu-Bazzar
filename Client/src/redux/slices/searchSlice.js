import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchAutocomplete = createAsyncThunk(
  'search/autocomplete',
  async (query, { rejectWithValue }) => {
    try {
      const res = await api.get('/search/autocomplete', { params: { q: query } });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchTrending = createAsyncThunk(
  'search/trending',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/search/trending');
      return res.data.trending;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const trackSearch = createAsyncThunk(
  'search/track',
  async (keyword, { rejectWithValue }) => {
    try {
      const res = await api.post('/search/track', { q: keyword });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState: {
    query: '',
    suggestions: [],
    products: [],
    trending: [],
    loading: false,
    error: null,
    isDropdownOpen: false,
  },
  reducers: {
    setQuery: (state, action) => {
      state.query = action.payload;
    },
    setDropdownOpen: (state, action) => {
      state.isDropdownOpen = action.payload;
    },
    clearSearch: (state) => {
      state.query = '';
      state.suggestions = [];
      state.products = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAutocomplete.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAutocomplete.fulfilled, (state, action) => {
        state.loading = false;
        state.suggestions = action.payload.suggestions || [];
        state.products = action.payload.products || [];
      })
      .addCase(fetchAutocomplete.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchTrending.fulfilled, (state, action) => {
        state.trending = action.payload || [];
      });
  }
});

export const { setQuery, setDropdownOpen, clearSearch } = searchSlice.actions;
export default searchSlice.reducer;
