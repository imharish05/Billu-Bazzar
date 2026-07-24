/**
 * mockAccountData.js
 * ─────────────────────────────────────────────────────────────────────────
 * Hardcoded mock data for the /account/* page group. No Redux, no API calls —
 * lets the account frontend be built, reviewed, and demoed before the
 * backend endpoints exist. Swap each export for a real fetch/selector when
 * the API is ready; the shapes below are intentionally kept close to what
 * the real ordersSlice / wishlistSlice already use elsewhere in the app.
 */

export const mockCustomer = {
  id: 'cust_001',
  name: 'Ananya Sharma',
  email: 'ananya.sharma@example.com',
  phone: '+91 98765 43210',
  referralCode: 'BB-ANANYA24',
  memberSince: '2024-03-12',
  avatarInitial: 'A',
  loyaltyPoints: 0,
  loyaltyTier: 'Bronze',
  cashbackBalance: 0, // ₹
};

export const mockOrders = [];

export const mockWishlist = [
  { id: 'w1', slug: 'kanjeevaram-silk-saree-royal-blue', name: 'Kanjeevaram Silk Saree — Royal Blue', image: 'https://images.unsplash.com/photo-1610030181087-540f6942ea9c?w=400', price: 7999, comparePrice: 9999, inStock: true },
  { id: 'w2', slug: 'polki-diamond-earrings', name: 'Polki Diamond Earrings', image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=400', price: 15499, comparePrice: null, inStock: true },
  { id: 'w3', slug: 'oud-royale-perfume-100ml', name: 'Oud Royale Perfume 100ml', image: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=400', price: 5299, comparePrice: 5999, inStock: false },
  { id: 'w4', slug: 'hand-embroidered-clutch', name: 'Hand-Embroidered Clutch — Ivory', image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400', price: 2899, comparePrice: null, inStock: true },
];

export const mockLoyaltyLedger = [];

export const loyaltyEarnRules = [
  { action: 'Every ₹100 spent', points: '+1 point' },
  { action: 'Write a review', points: '+50 points' },
  { action: 'Refer a friend', points: '+200 points' },
  { action: 'Birthday bonus', points: '+500 points' },
];

export const mockSupportTickets = [
  { id: 'tk1', subject: 'Wrong size delivered', status: 'OPEN', createdAt: '2026-07-08', lastReply: 'Our team is arranging a replacement pickup.' },
  { id: 'tk2', subject: 'Refund not received for BB239887', status: 'RESOLVED', createdAt: '2026-05-20', lastReply: 'Refund of ₹2,499 credited to original payment method.' },
];

export const WHATSAPP_CONCIERGE_NUMBER = '+919876500000';