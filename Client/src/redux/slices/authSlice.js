import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import {
  saveAccessToken,
  saveRefreshToken,
  getAccessToken,
  clearTokens
} from '../../utils/tokenStorage';

export const loginCustomer = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', credentials);
    saveAccessToken(res.data.token);
    saveRefreshToken(res.data.refreshToken);
    // Fetch profile details from the new /getme endpoint using the updated access token
    const profileRes = await api.get('/auth/getme');
    return {
      token: res.data.token,
      refreshToken: res.data.refreshToken,
      customer: profileRes.data.customer
    };
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Login failed'); }
});

export const registerCustomer = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register', data);
    saveAccessToken(res.data.token);
    saveRefreshToken(res.data.refreshToken);
    // Fetch profile details from the new /getme endpoint using the updated access token
    const profileRes = await api.get('/auth/getme');
    return {
      token: res.data.token,
      refreshToken: res.data.refreshToken,
      customer: profileRes.data.customer
    };
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Registration failed'); }
});

export const fetchProfile = createAsyncThunk('auth/profile', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/auth/getme');
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    customer: null,
    token: getAccessToken() || null,
    loading: false,
    error: null,
    isAuthenticated: !!getAccessToken(),
  },
  reducers: {
    logout: (state) => {
      state.customer = null;
      state.token = null;
      state.isAuthenticated = false;
      clearTokens();
    },
    updateAccessToken: (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
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

export const { logout, updateAccessToken, clearError } = authSlice.actions;
export default authSlice.reducer;
