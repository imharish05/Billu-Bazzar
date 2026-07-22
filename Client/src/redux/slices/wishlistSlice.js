import { createSlice } from '@reduxjs/toolkit';

const areVariantsEqual = (varA, varB) => {
  const a = varA || {};
  const b = varB || {};
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();
  if (keysA.length !== keysB.length) return false;
  return keysA.every(k => String(a[k]).toLowerCase() === String(b[k]).toLowerCase());
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { items: [], loading: false },
  reducers: {
    setWishlist: (state, action) => { state.items = action.payload; },
    toggleItem: (state, action) => {
      const payload = action.payload || {};
      const targetProductId = payload.productId || payload.id || payload;
      const targetVariantId = payload.variantId || null;
      const targetSelectedVariant = payload.selectedVariant || null;

      const idx = state.items.findIndex(item => {
        const sameProd = Number(item.productId || item.id) === Number(targetProductId);
        if (!sameProd) return false;
        if (targetVariantId || item.variantId) {
          return Number(item.variantId) === Number(targetVariantId);
        }
        if (targetSelectedVariant || item.selectedVariant) {
          return areVariantsEqual(item.selectedVariant, targetSelectedVariant);
        }
        return true;
      });

      if (idx > -1) {
        state.items.splice(idx, 1);
      } else {
        // Map product object to a unified format
        const price = payload.variantPrice || payload.priceAtAdd || payload.price || payload.product?.price || 0;
        const comparePrice = payload.comparePrice || payload.product?.comparePrice || null;
        const image = payload.image || payload.productImage || payload.product?.image || (payload.images && payload.images[0]) || (payload.product?.images && payload.product.images[0]) || '';
        
        const unified = {
          id: targetProductId,
          productId: targetProductId,
          variantId: targetVariantId,
          selectedVariant: targetSelectedVariant || {},
          name: payload.name || payload.productName || payload.product?.name || 'Product',
          slug: payload.slug || payload.product?.slug || '',
          image,
          price: parseFloat(price),
          comparePrice: comparePrice ? parseFloat(comparePrice) : null,
          inStock: payload.inStock !== false,
          categoryName: payload.category?.name || payload.categoryName || 'Lifestyle',
          rating: payload.rating || 4.5,
          reviewCount: payload.reviewCount || 10
        };
        state.items.push(unified);
      }
    },
  },
});
export const { setWishlist, toggleItem } = wishlistSlice.actions;
export default wishlistSlice.reducer;
