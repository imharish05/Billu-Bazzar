import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Fetch product reviews & summary
export const fetchProductReviews = createAsyncThunk(
  'reviews/fetchProductReviews',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/reviews/product/${productId}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch reviews');
    }
  }
);

// Fetch customer's delivered items eligible for review
export const fetchMyDeliveredItems = createAsyncThunk(
  'reviews/fetchMyDeliveredItems',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/reviews/my-delivered-items');
      return response.data.items;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch delivered items');
    }
  }
);

// Create review
export const createReview = createAsyncThunk(
  'reviews/createReview',
  async (reviewData, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/reviews', reviewData);
      if (reviewData.productId) {
        dispatch(fetchProductReviews(reviewData.productId));
      }
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to submit review');
    }
  }
);

// Update review
export const updateReview = createAsyncThunk(
  'reviews/updateReview',
  async ({ id, rating, title, body, productId }, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.put(`/reviews/${id}`, { rating, title, body });
      if (productId) {
        dispatch(fetchProductReviews(productId));
      }
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update review');
    }
  }
);

// Delete review
export const deleteReview = createAsyncThunk(
  'reviews/deleteReview',
  async ({ id, productId }, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.delete(`/reviews/${id}`);
      if (productId) {
        dispatch(fetchProductReviews(productId));
      }
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete review');
    }
  }
);

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState: {
    productId: null,
    reviews: [],
    averageRating: 0,
    totalCount: 0,
    ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    userCanReview: false,
    userReview: null,
    eligibleOrderId: null,
    deliveredItems: [],
    loading: false,
    submitting: false,
    error: null,
  },
  reducers: {
    clearReviewsState: (state) => {
      state.productId = null;
      state.reviews = [];
      state.averageRating = 0;
      state.totalCount = 0;
      state.ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      state.userCanReview = false;
      state.userReview = null;
      state.eligibleOrderId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProductReviews
      .addCase(fetchProductReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.productId = action.payload.productId;
        state.reviews = action.payload.reviews || [];
        state.averageRating = action.payload.averageRating || 0;
        state.totalCount = action.payload.totalCount || 0;
        state.ratingBreakdown = action.payload.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        state.userCanReview = action.payload.userCanReview || false;
        state.userReview = action.payload.userReview || null;
        state.eligibleOrderId = action.payload.eligibleOrderId || null;
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchMyDeliveredItems
      .addCase(fetchMyDeliveredItems.fulfilled, (state, action) => {
        state.deliveredItems = action.payload || [];
      })

      // createReview
      .addCase(createReview.pending, (state) => {
        state.submitting = true;
      })
      .addCase(createReview.fulfilled, (state) => {
        state.submitting = false;
      })
      .addCase(createReview.rejected, (state) => {
        state.submitting = false;
      })

      // updateReview
      .addCase(updateReview.pending, (state) => {
        state.submitting = true;
      })
      .addCase(updateReview.fulfilled, (state) => {
        state.submitting = false;
      })
      .addCase(updateReview.rejected, (state) => {
        state.submitting = false;
      })

      // deleteReview
      .addCase(deleteReview.pending, (state) => {
        state.submitting = true;
      })
      .addCase(deleteReview.fulfilled, (state) => {
        state.submitting = false;
      })
      .addCase(deleteReview.rejected, (state) => {
        state.submitting = false;
      });
  },
});

export const { clearReviewsState } = reviewsSlice.actions;
export default reviewsSlice.reducer;
