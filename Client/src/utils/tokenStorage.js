/**
 * Secure token storage utility.
 * Obfuscates keys and values in localStorage using a XOR + Base64 encoding.
 * This prevents plain-text JWT tokens from being directly readable via browser console or extensions.
 */

const SECRET_KEY = 'BilluBazzarSecuredTokenHashKey_987#@!';

/**
 * Encrypts/decrypts input string using a XOR cipher with a secret key.
 */
const xorCipher = (input, key) => {
  let output = '';
  for (let i = 0; i < input.length; i++) {
    const charCode = input.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    output += String.fromCharCode(charCode);
  }
  return output;
};

/**
 * Encrypts and saves a value to localStorage
 */
const setSecureItem = (key, value) => {
  if (!value) {
    localStorage.removeItem(key);
    return;
  }
  try {
    // 1. Convert value to Base64
    const base64Str = btoa(value);
    // 2. XOR with secret key
    const xored = xorCipher(base64Str, SECRET_KEY);
    // 3. Convert xored string to Base64 for safe storage
    const encrypted = btoa(xored);
    localStorage.setItem(key, encrypted);
  } catch (error) {
    console.error('Error securing token in localStorage:', error);
  }
};

/**
 * Decrypts and retrieves a value from localStorage
 */
const getSecureItem = (key) => {
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  try {
    // 1. Decode from Base64
    const xored = atob(stored);
    // 2. Reverse XOR
    const base64Str = xorCipher(xored, SECRET_KEY);
    // 3. Decode from Base64 to original value
    return atob(base64Str);
  } catch (error) {
    // If decryption fails (e.g. data corrupted or tampered), clear it
    localStorage.removeItem(key);
    return null;
  }
};

export const saveAccessToken = (token) => {
  setSecureItem('bb_access_token', token);
};

export const getAccessToken = () => {
  return getSecureItem('bb_access_token');
};

export const saveRefreshToken = (token) => {
  setSecureItem('bb_refresh_token', token);
};

export const getRefreshToken = () => {
  return getSecureItem('bb_refresh_token');
};

export const clearTokens = () => {
  localStorage.removeItem('bb_access_token');
  localStorage.removeItem('bb_refresh_token');
};
