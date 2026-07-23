const config = require('../config');

// Initialize configuration
const email = config.shiprocketEmail;
const password = config.shiprocketPassword;

const isConfigured = !!(email && password);

if (!isConfigured) {
  console.warn('WARNING: Shiprocket credentials missing from environment configuration. Logistics service will operate in simulated demo mode.');
}

/**
 * Authenticates with Shiprocket API to retrieve a token
 */
const getAuthToken = async () => {
  if (!isConfigured) {
    return 'mock_shiprocket_jwt_token_xyz123';
  }

  try {
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok || !data.token) {
      throw new Error(data.message || 'Authentication failed');
    }

    return data.token;
  } catch (error) {
    console.error('Shiprocket Auth Error:', error);
    throw new Error(`Logistics authentication failed: ${error.message}`);
  }
};

/**
 * Creates an order in Shiprocket
 */
const createOrder = async (order, weightInKg = 0.5) => {
  // Validate Pincode
  const zip = order.shippingZip ? String(order.shippingZip).trim() : '';
  if (!/^\d{6}$/.test(zip)) {
    throw new Error(`Logistics validation failed: Pincode '${zip}' must be exactly 6 digits.`);
  }

  // Simulate unserviceable pincode edge case for testing
  if (zip === '999999' || zip === '000000') {
    throw new Error(`Logistics serviceability alert: Destination area pincode ${zip} is currently not serviceable by any shipping partners.`);
  }

  if (!isConfigured) {
    console.log(`[Mock Shiprocket] Creating order reference for #${order.orderNumber}`);
    const randomShipmentId = Math.floor(10000000 + Math.random() * 90000000);
    const randomOrderId = Math.floor(1000000 + Math.random() * 9000000);
    return {
      order_id: randomOrderId,
      shipment_id: randomShipmentId,
      status: 'NEW',
      isDemo: true,
    };
  }

  try {
    const token = await getAuthToken();
    
    // Parse order items for Shiprocket
    const orderItems = order.items.map((item) => ({
      name: item.name,
      sku: item.productId,
      units: item.quantity,
      selling_price: item.price,
    }));

    const payload = {
      order_id: order.orderNumber,
      order_date: new Date(order.createdAt).toISOString().slice(0, 19).replace('T', ' '),
      pickup_location: 'Elite Style Warehouse',
      billing_customer_name: order.shippingName.split(' ')[0] || 'Customer',
      billing_last_name: order.shippingName.split(' ').slice(1).join(' ') || 'Surname',
      billing_address: order.shippingStreet,
      billing_city: order.shippingCity,
      billing_pincode: order.shippingZip,
      billing_state: order.shippingState,
      billing_country: order.shippingCountry || 'India',
      billing_email: order.user?.email || 'customer@elitestyle.com',
      billing_phone: order.user?.phone || '9999999999',
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: order.isPaid ? 'Prepaid' : 'COD',
      sub_total: order.subtotal,
      length: 10,
      width: 10,
      height: 10,
      weight: weightInKg,
    };

    const response = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || !data.shipment_id) {
      throw new Error(data.message || 'Failed to create order in logistics portal');
    }

    return data;
  } catch (error) {
    console.error('Shiprocket Create Order Error:', error);
    throw new Error(`Logistics shipment creation failed: ${error.message}`);
  }
};

/**
 * Assigns an AWB (Air Waybill) tracking number to the shipment
 */
const assignAWB = async (shipmentId, carrier = 'Shiprocket') => {
  if (!isConfigured) {
    console.log(`[Mock Shiprocket] Assigning mock AWB for shipment ${shipmentId}`);
    const trackingSuffix = Math.floor(10000000 + Math.random() * 90000000);
    const trackingCode = `SR${trackingSuffix}IN`;
    return {
      awb_code: trackingCode,
      courier_name: 'Shiprocket Multi-Carrier Partner',
    };
  }

  try {
    const token = await getAuthToken();
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ shipment_id: shipmentId }),
    });

    const data = await response.json();
    
    // In case no specific courier could be assigned automatically, handle failure gracefully
    if (!response.ok || !data.response?.data?.awb_code) {
      throw new Error(data.message || 'AWB allocation refused by courier service provider');
    }

    return {
      awb_code: data.response.data.awb_code,
      courier_name: data.response.data.courier_name || 'Shiprocket Partner',
    };
  } catch (error) {
    console.error('Shiprocket AWB Assignment Error:', error);
    throw new Error(`Logistics waybill allocation failed: ${error.message}`);
  }
};

module.exports = {
  createOrder,
  assignAWB,
};
