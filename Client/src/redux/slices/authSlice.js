import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const loginCustomer = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', credentials);
    localStorage.setItem('bb_token', res.data.token);
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Login failed'); }
});

export const registerCustomer = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('bb_token', res.data.token);
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Registration failed'); }
});

export const fetchProfile = createAsyncThunk('auth/profile', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/auth/profile');
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    customer: null,
    token: localStorage.getItem('bb_token') || null,
    loading: false,
    error: null,
    isAuthenticated: !!localStorage.getItem('bb_token'),
  },
  reducers: {
    logout: (state) => {
      state.customer = null; state.token = null; state.isAuthenticated = false;
      localStorage.removeItem('bb_token');
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginCustomer.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginCustomer.fulfilled, (state, action) => { state.loading = false; state.token = action.payload.token; state.customer = action.payload.customer; state.isAuthenticated = true; })
      .addCase(loginCustomer.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(registerCustomer.fulfilled, (state, action) => { state.token = action.payload.token; state.customer = action.payload.customer; state.isAuthenticated = true; })
      .addCase(fetchProfile.fulfilled, (state, action) => { state.customer = action.payload.customer; });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
