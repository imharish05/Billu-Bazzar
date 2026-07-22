const { Order } = require('./models');
const RazorpayService = require('./services/RazorpayService');
require('dotenv').config();

async function test() {
  try {
    const order = await Order.findOne({ where: { id: 60 } });
    if (!order) {
      console.log('Order #60 not found');
      return;
    }

    const amount = parseFloat(order.totalAmount);
    const currency = order.currency;
    const receipt = order.orderNumber;

    console.log('Testing createOrder with valid order 60:');
    const result = await RazorpayService.createOrder({
      amount,
      currency,
      receipt
    });
    console.log('Result:', result.success, result.gatewayRef);

    console.log('\nTesting createOrder with forced DNS error to verify interceptor:');
    const instance = RazorpayService._getInstance();
    instance.api.rq.defaults.baseURL = 'https://does-not-exist-at-all-dns-failure.razorpay.com/v1';
    
    // We call the raw instance.orders.create to verify it propagates through normalizeError cleanly
    await instance.orders.create({
      amount: 100,
      currency: 'INR',
      receipt: 'test_dns_error',
    });
  } catch (err) {
    console.log('Caught expected error:');
    console.log('Raw Error:', err);
  }
}

test();
