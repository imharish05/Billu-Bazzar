'use strict';
/**
 * TwilioService — local mock. Replace with real Twilio SDK before production.
 * Generates and verifies OTP codes for checkout flow.
 */
const otpStore = new Map(); // In-memory OTP store (dev only)

class TwilioService {
  sendOtp(phone) {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    otpStore.set(phone, { otp, expires: Date.now() + 10 * 60 * 1000 });
    console.log(`[TwilioMock] OTP for ${phone}: ${otp}`); // printed to terminal in dev
    return Promise.resolve({ success: true, message: `OTP sent to ${phone}` });
  }

  verifyOtp(phone, inputOtp) {
    const record = otpStore.get(phone);
    if (!record) return Promise.resolve({ success: false, message: 'OTP not found' });
    if (Date.now() > record.expires) return Promise.resolve({ success: false, message: 'OTP expired' });
    const valid = record.otp === String(inputOtp);
    if (valid) otpStore.delete(phone);
    return Promise.resolve({ success: valid, message: valid ? 'OTP verified' : 'Invalid OTP' });
  }

  sendWhatsApp(phone, message) {
    console.log(`[TwilioMock] WhatsApp to ${phone}: ${message}`);
    return Promise.resolve({ success: true });
  }
}

module.exports = new TwilioService();
