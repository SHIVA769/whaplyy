import axios from 'axios';
import crypto from 'crypto';
import { WebhookConfig } from '../models/ECommerce.js';

export const dispatchWebhook = async ({ companyId, module, event, payload }) => {
  try {
    const webhooks = await WebhookConfig.find({ companyId, module, isActive: true });
    if (!webhooks || webhooks.length === 0) return;

    for (const webhook of webhooks) {
      const timestamp = Date.now();
      const payloadString = JSON.stringify({ event, data: payload, timestamp });
      
      const headers = {
        'Content-Type': 'application/json',
        'X-WhatsStore-Event': event,
        'X-WhatsStore-Delivery': `${webhook._id}-${timestamp}`,
      };

      if (webhook.secret) {
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(payloadString)
          .digest('hex');
        headers['X-WhatsStore-Signature'] = signature;
      }

      try {
        let res;
        if (webhook.method === 'GET') {
          res = await axios.get(webhook.url, { headers, timeout: 8000 });
        } else {
          res = await axios.post(webhook.url, payloadString, { headers, timeout: 8000 });
        }

        webhook.logs.unshift({
          event,
          status: 'success',
          responseCode: res.status,
          attemptAt: new Date(),
          payloadSummary: `Dispatched ${event} successfully with HTTP ${res.status}`,
        });
      } catch (err) {
        webhook.logs.unshift({
          event,
          status: 'failed',
          responseCode: err.response?.status || 500,
          attemptAt: new Date(),
          payloadSummary: `Failed: ${err.message}`,
        });
      }

      // Keep only recent 20 logs
      if (webhook.logs.length > 20) {
        webhook.logs = webhook.logs.slice(0, 20);
      }

      await webhook.save();
    }
  } catch (error) {
    console.error('[Webhook Dispatcher Error]', error);
  }
};
