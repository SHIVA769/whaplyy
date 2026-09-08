import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const hasSmtpConfig = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getSmtpTransport = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE || 'true') === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
};

/**
 * Verify Email Service at server startup.
 */
export const verifySMTPConnection = async () => {
  try {
    if (hasSmtpConfig()) {
      await getSmtpTransport().verify();
      console.log('=============================================');
      console.log('[Email Service] SMTP configured and connection verified!');
      console.log(`  Provider: ${process.env.SMTP_HOST}`);
      console.log(`  From:     ${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}`);
      console.log('=============================================');
      return true;
    }

    const resend = getResendClient();
    if (!resend) {
      console.log('[Email Service] ℹ️  RESEND_API_KEY is not configured in .env. Email sending will be inactive.');
      return false;
    }

    const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    console.log(`=============================================`);
    console.log(`[Email Service] ✅ Resend API configured and active!`);
    console.log(`  Provider: Resend (https://resend.com)`);
    console.log(`  From:     ${fromAddress}`);
    console.log(`=============================================`);
    return true;
  } catch (error) {
    console.error(`[Email Service Error] ❌ Provider initialization failed:`, error.message);
    return false;
  }
};

/**
 * Send an email using Resend API.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (hasSmtpConfig()) {
      const recipient = Array.isArray(to) ? to : [to];
      const info = await getSmtpTransport().sendMail({
        from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
        to: recipient,
        subject,
        html: html || `<p>${text || ''}</p>`,
        text: text || (html ? html.replace(/<[^>]+>/g, '') : ''),
      });

      console.log(`[Email Service] Email dispatched via SMTP to ${recipient.join(', ')} (${info.messageId})`);
      return { success: true, messageId: info.messageId };
    }

    const resend = getResendClient();
    if (!resend) {
      console.warn(`[Email Service] Cannot send email to ${to}: RESEND_API_KEY is not set in .env.`);
      return { success: false, error: 'Email service is not configured. Please set RESEND_API_KEY in .env.' };
    }

    const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const recipient = Array.isArray(to) ? to : [to];

    const { data, error } = await resend.emails.send({
      from,
      to: recipient,
      subject,
      html: html || `<p>${text || ''}</p>`,
      text: text || (html ? html.replace(/<[^>]+>/g, '') : ''),
    });

    if (error) {
      console.error(`[Email Service Error] Failed to send email to ${recipient.join(', ')}:`, error);
      return {
        success: false,
        error: error.message || 'Resend email dispatch error',
        details: error,
      };
    }

    console.log(`[Email Service] ✉️  Email dispatched via Resend to ${recipient.join(', ')} (ID: ${data?.id})`);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error(`[Email Service Error] Unexpected error sending email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

