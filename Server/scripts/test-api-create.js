'use strict';
const axios = require('axios');

async function testApi() {
  try {
    // 1. Login as Admin
    console.log('Logging in as Admin...');
    const loginRes = await axios.post('http://[::1]:5000/api/auth/admin/login', {
      email: 'admin@billubazaar.com',
      password: 'Admin@123'
    });

    const token = loginRes.data.token;
    console.log('Login successful. Token acquired.');

    // 2. Try creating a product using JSON
    console.log('Creating product...');
    const newProductData = {
      name: 'API Test Product ' + Date.now(),
      price: 199.99,
      comparePrice: 299.99,
      stock: 25,
      categoryId: 25, // Electronics category id from previous test
      sku: 'APITEST-' + Date.now(),
      description: 'Created via API test script (JSON)',
      isFeatured: false,
      isNewArrival: false,
      isBestSeller: false,
      isActive: true
    };

    const createRes = await axios.post('http://[::1]:5000/api/products', newProductData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Product created successfully via API:', createRes.data);
  } catch (error) {
    if (error.response) {
      console.error('API Error Response:', error.response.status, error.response.data);
    } else {
      console.error('Network/Other Error:', error.message, error.stack);
    }
  }
}

testApi();
