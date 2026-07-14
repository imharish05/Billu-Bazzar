import { createSlice } from '@reduxjs/toolkit';

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { items: [], loading: false },
  reducers: {
    setWishlist: (state, action) => { state.items = action.payload; },
    toggleItem: (state, action) => {
      const product = action.payload;
      const id = product.id || product;
      const idx = state.items.findIndex(item => (item.id || item) === id);
      if (idx > -1) {
        state.items.splice(idx, 1);
      } else {
        // Map product object to a unified format
        const unified = {
          id: product.id || id,
          name: product.name || 'Product',
          slug: product.slug || '',
          image: product.images?.[0] || product.image || '',
          price: product.price || 0,
          comparePrice: product.comparePrice || null,
          inStock: product.inStock !== false,
          categoryName: product.category?.name || product.categoryName || 'Lifestyle',
          rating: product.rating || 4.5,
          reviewCount: product.reviewCount || 10
        };
        state.items.push(unified);
      }
    },
  },
});
export const { setWishlist, toggleItem } = wishlistSlice.actions;
export default wishlistSlice.reducer;
