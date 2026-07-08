import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchBanners = createAsyncThunk(
  'banners/fetchBanners',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/banners')
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch banners.')
    }
  }
)

export const createBanner = createAsyncThunk(
  'banners/createBanner',
  async (bannerData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/banners', bannerData)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create banner.')
    }
  }
)

export const updateBanner = createAsyncThunk(
  'banners/updateBanner',
  async ({ id, ...bannerData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/banners/${id}`, bannerData)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update banner.')
    }
  }
)

export const deleteBanner = createAsyncThunk(
  'banners/deleteBanner',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/banners/${id}`)
      return id
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete banner.')
    }
  }
)

const bannersSlice = createSlice({
  name: 'banners',
  initialState: {
    items: [],
    loading: false,
    error: null,
    actionLoading: false,
  },
  reducers: {
    clearBannerError: (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBanners.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchBanners.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.banners || action.payload
      })
      .addCase(fetchBanners.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(createBanner.pending, (state) => { state.actionLoading = true })
      .addCase(createBanner.fulfilled, (state, action) => {
        state.actionLoading = false
        state.items.unshift(action.payload.banner || action.payload)
      })
      .addCase(createBanner.rejected, (state, action) => { state.actionLoading = false; state.error = action.payload })
      .addCase(updateBanner.fulfilled, (state, action) => {
        const updated = action.payload.banner || action.payload
        const idx = state.items.findIndex((b) => b.id === updated.id)
        if (idx !== -1) state.items[idx] = updated
      })
      .addCase(deleteBanner.fulfilled, (state, action) => {
        state.items = state.items.filter((b) => b.id !== action.payload)
      })
  },
})

export const { clearBannerError } = bannersSlice.actions
export default bannersSlice.reducer
