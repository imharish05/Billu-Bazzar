import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import productsReducer from './slices/productsSlice';
import categoriesReducer from './slices/categoriesSlice';
import bannersReducer from './slices/bannersSlice';
import wishlistReducer from './slices/wishlistSlice';
import ordersReducer from './slices/ordersSlice';
import uiReducer from './slices/uiSlice';
import currencyReducer from './slices/currencySlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    products: productsReducer,
    categories: categoriesReducer,
    banners: bannersReducer,
    wishlist: wishlistReducer,
    orders: ordersReducer,
    ui: uiReducer,
    currency: currencyReducer,
  },
});

export default store;
