import { createSlice } from '@reduxjs/toolkit';

const currencySlice = createSlice({
  name: 'currency',
  initialState: {
    code: localStorage.getItem('bb_currency') || 'INR',
    rate: 25.926, // 1 AED = 25.926 INR (so 4999 INR = 192.82 AED)
  },
  reducers: {
    setCurrency: (state, action) => {
      state.code = action.payload;
      localStorage.setItem('bb_currency', action.payload);
    },
  },
});

export const { setCurrency } = currencySlice.actions;
export default currencySlice.reducer;
