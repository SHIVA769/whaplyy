import axios from 'axios';
import { CompanyMessagingSettings } from '../models/ECommerce.js';
import { decryptSecret } from '../utils/crypto.js';

export const sendTelegramMessage = async ({ companyId, messageHtml }) => {
  try {
    const settings = await CompanyMessagingSettings.findOne({ companyId });
    if (!settings || !settings.telegramEnabled || !settings.telegramBotToken || !settings.telegramChatId) {
      console.log('[Telegram] Telegram messaging disabled or unconfigured for this company.');
      return { success: false, reason: 'unconfigured' };
    }

    const botToken = decryptSecret(settings.telegramBotToken);
    const chatId = settings.telegramChatId;

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await axios.post(url, {
      chat_id: chatId,
      text: messageHtml,
      parse_mode: 'HTML',
    });

    console.log(`[Telegram] Message dispatched successfully to chat ${chatId}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[Telegram Error]', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};
