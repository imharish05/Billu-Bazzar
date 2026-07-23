import { createSlice } from '@reduxjs/toolkit';
import { DEFAULT_AED_RATE } from '../../utils/currency';

const currencySlice = createSlice({
  name: 'currency',
  initialState: {
    code: localStorage.getItem('bb_currency') || 'INR',
    rate: DEFAULT_AED_RATE, // 1 AED = 22.7 INR (so 4999 INR = 220.22 AED)
  },
  reducers: {
    setCurrency: (state, action) => {
      state.code = action.payload;
      localStorage.setItem('bb_currency', action.payload);
    },
    setRate: (state, action) => {
      state.rate = action.payload;
    }
  },
});

export const { setCurrency, setRate } = currencySlice.actions;
export default currencySlice.reducer;
