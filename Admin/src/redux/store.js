import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import dashboardReducer from './slices/dashboardSlice';
import productsReducer from './slices/productsSlice';
import ordersReducer from './slices/ordersSlice';
import customersReducer from './slices/customersSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    products: productsReducer,
    orders: ordersReducer,
    customers: customersReducer,
  },
});

export default store;
