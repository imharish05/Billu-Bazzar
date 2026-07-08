'use strict';
/**
 * ShiprocketService — local mock. Replace with real Shiprocket API before production.
 */
const { v4: uuidv4 } = require('uuid');

class ShiprocketService {
  createShipment(orderData) {
    return Promise.resolve({
      shipment_id: `SR${Date.now()}`,
      awb_code: `AWB${uuidv4().slice(0, 10).toUpperCase()}`,
      courier_name: 'Blue Dart Express',
      tracking_url: `https://shiprocket.co/tracking/AWB${Date.now()}`,
      estimated_delivery: new Date(Date.now() + 5 * 86400000).toISOString(),
    });
  }

  trackShipment(awbCode) {
    const statuses = ['Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];
    return Promise.resolve({
      awb_code: awbCode,
      current_status: statuses[Math.floor(Math.random() * statuses.length)],
      scans: [
        { date: new Date().toISOString(), activity: 'Shipment picked up', location: 'Mumbai Hub' },
        { date: new Date(Date.now() - 86400000).toISOString(), activity: 'In Transit', location: 'Delhi Hub' },
      ],
    });
  }

  cancelShipment(shipmentId) {
    return Promise.resolve({ success: true, message: 'Shipment cancelled', shipmentId });
  }
}

module.exports = new ShiprocketService();
