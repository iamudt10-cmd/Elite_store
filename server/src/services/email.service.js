const nodemailer = require('nodemailer');
const config = require('../config');

let transporter;
if (config.smtp.user && config.smtp.pass) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
} else {
  console.warn('WARNING: SMTP email configurations are missing. Email notifications will be logged to the console instead.');
}

const sendEmail = async ({ to, subject, html }) => {
  if (!transporter) {
    console.log(`[SIMULATED EMAIL]
To: ${to}
Subject: ${subject}
Content: ${html.substring(0, 300)}... (truncated)`);
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Elite Style" <${config.smtp.user}>`,
      to,
      subject,
      html,
    });
    return info;
  } catch (error) {
    console.error('Email Send Error:', error);
    // Don't crash the server if email fails
    return false;
  }
};

const sendOrderConfirmation = async (order, user) => {
  const itemsList = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name} (${item.size || 'N/A'}/${item.color || 'N/A'})</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toLocaleString('en-IN')}</td>
    </tr>`
    )
    .join('');

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #8b5cf6; text-align: center;">Order Confirmed!</h2>
      <p>Dear ${user.name},</p>
      <p>Thank you for shopping at <strong>Elite Style</strong>. Your order has been placed and is currently <strong>PENDING</strong> administrator review.</p>
      
      <div style="background-color: #f5f0ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <h4 style="margin-top: 0;">Order Number: ${order.orderNumber}</h4>
        <p style="margin-bottom: 0;">Status: ${order.status}</p>
      </div>

      <h3>Order Summary</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f9f9f9;">
            <th style="padding: 8px; text-align: left;">Item</th>
            <th style="padding: 8px; text-align: center;">Qty</th>
            <th style="padding: 8px; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsList}
        </tbody>
      </table>

      <div style="text-align: right; margin-top: 20px; font-size: 16px;">
        <p>Subtotal: ₹${order.subtotal.toLocaleString('en-IN')}</p>
        ${order.discount > 0 ? `<p style="color: #f15080;">Discount: -₹${order.discount.toLocaleString('en-IN')}</p>` : ''}
        <p>Shipping: ₹${order.shippingCost.toLocaleString('en-IN')}</p>
        <p style="font-weight: bold; font-size: 18px; color: #8b5cf6;">Total: ₹${order.total.toLocaleString('en-IN')}</p>
      </div>

      <p style="font-size: 12px; color: #666; text-align: center; margin-top: 40px;">
        This is an automated receipt from Elite Style. If you have any questions, please contact us at support@elitestyle.com.
      </p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: `Elite Style Order Confirmation - ${order.orderNumber}`,
    html,
  });
};

module.exports = {
  sendEmail,
  sendOrderConfirmation,
};
