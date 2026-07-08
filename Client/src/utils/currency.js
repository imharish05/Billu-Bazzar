import currencyJs from 'currency.js';

export const formatPrice = (value, currencyCode = 'INR', rate = 22.7) => {
  const numVal = Number(value || 0);
  if (currencyCode === 'AED') {
    const converted = numVal / rate;
    return currencyJs(converted, { symbol: 'AED ', precision: 2, formatWithSymbol: true }).format();
  }
  // Default to INR
  return currencyJs(numVal, { symbol: '₹', precision: 0, formatWithSymbol: true }).format();
};
