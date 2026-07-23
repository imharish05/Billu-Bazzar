'use strict';
const { LoyaltyLedger, Customer, Order } = require('../models');

const getLedger = async (req, res) => {
  try {
    const ledger = await LoyaltyLedger.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'email'] },
        { model: Order, as: 'order', attributes: ['id', 'orderNumber'] }
      ]
    });
    res.json({ success: true, ledger });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getLedger };
