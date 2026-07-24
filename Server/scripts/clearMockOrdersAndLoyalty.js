const { sequelize, Order, OrderItem, LoyaltyLedger, Customer } = require('../models');

async function clearMockData() {
  try {
    console.log('🧹 Clearing mock Orders and Loyalty Ledger...');
    await sequelize.authenticate();
    
    // Delete all OrderItems & LoyaltyLedgers first due to foreign key constraints
    await OrderItem.destroy({ where: {}, truncate: false });
    await LoyaltyLedger.destroy({ where: {}, truncate: false });
    await Order.destroy({ where: {}, truncate: false });
    
    // Reset loyalty points for all customers
    await Customer.update({ loyaltyPoints: 0 }, { where: {} });
    
    console.log('✅ Successfully cleared all mock Orders, Order Items, and Loyalty Ledgers!');
    console.log('✅ Reset all Customer loyalty points to 0.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing mock data:', err);
    process.exit(1);
  }
}

clearMockData();
