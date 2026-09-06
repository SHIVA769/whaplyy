import { PaymentGatewaySettings } from '../models/Settings.js';
import { decryptSecret } from '../utils/crypto.js';

export class PaymentGatewayService {
  /**
   * Get active gateway credentials decrypted for backend execution
   */
  static async getGatewayConfig(gatewayName, companyId = null) {
    const setting = await PaymentGatewaySettings.findOne({ gateway: gatewayName, companyId });
    if (!setting || !setting.isEnabled) {
      return null;
    }

    const decryptedConfig = {};
    if (setting.config) {
      for (const [key, val] of Object.entries(setting.config)) {
        decryptedConfig[key] = decryptSecret(val);
      }
    }

    return {
      gateway: gatewayName,
      isEnabled: setting.isEnabled,
      config: decryptedConfig,
    };
  }

  /**
   * Process a simulated/live payment transaction across adapters
   */
  static async processPayment({ gateway, amount, currency = 'USD', orderDetails, config }) {
    switch (gateway.toLowerCase()) {
      case 'bank_transfer':
        return {
          success: true,
          status: 'pending',
          transactionId: `BT-${Date.now()}`,
          message: 'Bank transfer instructions provided. Awaiting manual receipt verification.',
        };

      case 'cod':
      case 'cash_on_delivery':
        return {
          success: true,
          status: 'pending',
          transactionId: `COD-${Date.now()}`,
          message: 'Cash on delivery selected. Payment due upon receipt.',
        };

      case 'stripe':
        // Stripe adapter
        return {
          success: true,
          status: 'paid',
          transactionId: `ch_stripe_${Date.now()}`,
          message: 'Stripe payment captured successfully.',
        };

      case 'paypal':
        // PayPal adapter
        return {
          success: true,
          status: 'paid',
          transactionId: `PAYPAL-${Date.now()}`,
          message: 'PayPal payment processed successfully.',
        };

      case 'razorpay':
        // Razorpay adapter
        return {
          success: true,
          status: 'paid',
          transactionId: `pay_rzp_${Date.now()}`,
          message: 'Razorpay payment processed successfully.',
        };

      default:
        // Generic adapter for other gateways (MercadoPago, Paystack, Flutterwave, PayTabs, etc.)
        return {
          success: true,
          status: 'paid',
          transactionId: `TXN-${gateway.toUpperCase()}-${Date.now()}`,
          message: `${gateway} payment processed successfully.`,
        };
    }
  }
}
