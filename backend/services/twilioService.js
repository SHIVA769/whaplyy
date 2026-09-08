import { CompanyMessagingSettings } from '../models/ECommerce.js';
import { decryptSecret } from '../utils/crypto.js';

export const sendTwilioSms = async ({ companyId, to, message }) => {
  try {
    const settings = await CompanyMessagingSettings.findOne({ companyId });
    if (!settings || !settings.twilioEnabled || !settings.twilioSid || !settings.twilioAuthToken) {
      console.log('[Twilio] SMS disabled or unconfigured for this company.');
      return { success: false, reason: 'unconfigured' };
    }

    let twilioModule;
    try {
      twilioModule = await import('twilio');
    } catch {
      console.warn('[Twilio Warning] twilio SDK module not installed or unavailable.');
      return { success: false, reason: 'sdk_missing' };
    }

    const twilio = twilioModule.default || twilioModule;
    const authToken = decryptSecret(settings.twilioAuthToken);
    const client = twilio(settings.twilioSid, authToken);

    const result = await client.messages.create({
      body: message,
      from: settings.twilioFromNumber,
      to: to,
    });

    console.log(`[Twilio SMS] Sent to ${to}: SID ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('[Twilio SMS Error]', error.message);
    return { success: false, error: error.message };
  }
};
