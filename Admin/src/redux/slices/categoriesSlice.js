import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/categories')
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch categories.')
    }
  }
)

export const createCategory = createAsyncThunk(
  'categories/createCategory',
  async (categoryData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/categories', categoryData)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create category.')
    }
  }
)

export const updateCategory = createAsyncThunk(
  'categories/updateCategory',
  async ({ id, ...categoryData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/categories/${id}`, categoryData)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update category.')
    }
  }
)

export const deleteCategory = createAsyncThunk(
  'categories/deleteCategory',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/categories/${id}`)
      return id
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete category.')
    }
  }
)

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    items: [],
    loading: false,
    error: null,
    actionLoading: false,
  },
  reducers: {
    clearCategoryError: (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.categories || action.payload
      })
      .addCase(fetchCategories.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(createCategory.pending, (state) => { state.actionLoading = true })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.actionLoading = false
        state.items.push(action.payload.category || action.payload)
      })
      .addCase(createCategory.rejected, (state, action) => { state.actionLoading = false; state.error = action.payload })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const updated = action.payload.category || action.payload
        const idx = state.items.findIndex((c) => c._id === updated._id)
        if (idx !== -1) state.items[idx] = updated
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c._id !== action.payload)
      })
  },
})

export const { clearCategoryError } = categoriesSlice.actions
export default categoriesSlice.reducer
