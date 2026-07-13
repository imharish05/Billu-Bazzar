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
  loyaltyPoints: 1840,
  loyaltyTier: 'Gold',
  cashbackBalance: 620, // ₹
};

export const mockOrders = [
  {
    id: 'ord_1001',
    orderNumber: 'BB240921',
    createdAt: '2026-06-28T10:30:00Z',
    status: 'DELIVERED',
    paymentMethod: 'UPI',
    totalAmount: 8499,
    items: [
      { id: 'p1', name: 'Banarasi Silk Saree — Emerald', image: 'https://images.unsplash.com/photo-1610030181087-540f6942ea9c?w=300', qty: 1, price: 6499 },
      { id: 'p2', name: 'Kundan Choker Necklace', image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=300', qty: 1, price: 2000 },
    ],
    shippingAddress: '14 Lakeview Residency, Bandra West, Mumbai, MH 400050',
    tracking: [
      { label: 'Order Placed', date: '2026-06-28', done: true },
      { label: 'Shipped', date: '2026-06-29', done: true },
      { label: 'Out for Delivery', date: '2026-07-01', done: true },
      { label: 'Delivered', date: '2026-07-01', done: true },
    ],
  },
  {
    id: 'ord_1002',
    orderNumber: 'BB240988',
    createdAt: '2026-07-04T15:12:00Z',
    status: 'SHIPPED',
    paymentMethod: 'Credit Card',
    totalAmount: 3299,
    items: [
      { id: 'p3', name: 'Oudh Amber Perfume 50ml', image: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=300', qty: 1, price: 3299 },
    ],
    shippingAddress: '14 Lakeview Residency, Bandra West, Mumbai, MH 400050',
    tracking: [
      { label: 'Order Placed', date: '2026-07-04', done: true },
      { label: 'Shipped', date: '2026-07-05', done: true },
      { label: 'Out for Delivery', date: '', done: false },
      { label: 'Delivered', date: '', done: false },
    ],
  },
  {
    id: 'ord_1003',
    orderNumber: 'BB241050',
    createdAt: '2026-07-09T09:05:00Z',
    status: 'PROCESSING',
    paymentMethod: 'COD',
    totalAmount: 5199,
    items: [
      { id: 'p4', name: 'Embroidered Juttis — Rose Gold', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300', qty: 1, price: 1899 },
      { id: 'p5', name: 'Zardozi Clutch Bag', image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=300', qty: 1, price: 3300 },
    ],
    shippingAddress: '14 Lakeview Residency, Bandra West, Mumbai, MH 400050',
    tracking: [
      { label: 'Order Placed', date: '2026-07-09', done: true },
      { label: 'Shipped', date: '', done: false },
      { label: 'Out for Delivery', date: '', done: false },
      { label: 'Delivered', date: '', done: false },
    ],
  },
  {
    id: 'ord_1004',
    orderNumber: 'BB239887',
    createdAt: '2026-05-18T18:40:00Z',
    status: 'CANCELLED',
    paymentMethod: 'UPI',
    totalAmount: 2499,
    items: [
      { id: 'p6', name: 'Chiffon Party Wear Gown', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300', qty: 1, price: 2499 },
    ],
    shippingAddress: '14 Lakeview Residency, Bandra West, Mumbai, MH 400050',
    tracking: [
      { label: 'Order Placed', date: '2026-05-18', done: true },
      { label: 'Cancelled', date: '2026-05-19', done: true },
    ],
  },
  {
    id: 'ord_1005',
    orderNumber: 'BB238710',
    createdAt: '2026-04-02T12:00:00Z',
    status: 'DELIVERED',
    paymentMethod: 'Net Banking',
    totalAmount: 12999,
    items: [
      { id: 'p7', name: 'Designer Lehenga — Wine Red', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300', qty: 1, price: 12999 },
    ],
    shippingAddress: '14 Lakeview Residency, Bandra West, Mumbai, MH 400050',
    tracking: [
      { label: 'Order Placed', date: '2026-04-02', done: true },
      { label: 'Shipped', date: '2026-04-03', done: true },
      { label: 'Out for Delivery', date: '2026-04-06', done: true },
      { label: 'Delivered', date: '2026-04-06', done: true },
    ],
  },
];

export const mockWishlist = [
  { id: 'w1', slug: 'kanjeevaram-silk-saree-royal-blue', name: 'Kanjeevaram Silk Saree — Royal Blue', image: 'https://images.unsplash.com/photo-1610030181087-540f6942ea9c?w=400', price: 7999, comparePrice: 9999, inStock: true },
  { id: 'w2', slug: 'polki-diamond-earrings', name: 'Polki Diamond Earrings', image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=400', price: 15499, comparePrice: null, inStock: true },
  { id: 'w3', slug: 'oud-royale-perfume-100ml', name: 'Oud Royale Perfume 100ml', image: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=400', price: 5299, comparePrice: 5999, inStock: false },
  { id: 'w4', slug: 'hand-embroidered-clutch', name: 'Hand-Embroidered Clutch — Ivory', image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400', price: 2899, comparePrice: null, inStock: true },
];

export const mockLoyaltyLedger = [
  { id: 'lt1', date: '2026-07-09', label: 'Order BB241050', points: 52, type: 'earn' },
  { id: 'lt2', date: '2026-07-04', label: 'Order BB240988', points: 33, type: 'earn' },
  { id: 'lt3', date: '2026-06-30', label: 'Wrote a review', points: 50, type: 'earn' },
  { id: 'lt4', date: '2026-06-28', label: 'Order BB240921', points: 85, type: 'earn' },
  { id: 'lt5', date: '2026-06-15', label: 'Redeemed on Order BB239887', points: -200, type: 'redeem' },
  { id: 'lt6', date: '2026-05-01', label: 'Referral bonus — Priya M.', points: 200, type: 'earn' },
];

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