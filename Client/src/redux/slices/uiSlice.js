import { createSlice } from '@reduxjs/toolkit';

// Global UI state — modal, overlays, quick-view
const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    quickViewProduct: null,  // product object for quick-view modal
    isQuickViewOpen: false,
    searchOpen: false,
    mobileMenuOpen: false,
    toast: null,
  },
  reducers: {
    openQuickView: (state, action) => { state.quickViewProduct = action.payload; state.isQuickViewOpen = true; },
    closeQuickView: (state) => { state.isQuickViewOpen = false; state.quickViewProduct = null; },
    toggleSearch: (state) => { state.searchOpen = !state.searchOpen; },
    toggleMobileMenu: (state) => { state.mobileMenuOpen = !state.mobileMenuOpen; },
    closeMobileMenu: (state) => { state.mobileMenuOpen = false; },
    showToast: (state, action) => { state.toast = action.payload; },
    clearToast: (state) => { state.toast = null; },
  },
});
export const { openQuickView, closeQuickView, toggleSearch, toggleMobileMenu, closeMobileMenu, showToast, clearToast } = uiSlice.actions;
export default uiSlice.reducer;
