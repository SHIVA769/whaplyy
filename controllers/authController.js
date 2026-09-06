import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { generateToken } from '../middlewares/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { sendEmail } from '../services/mailer.js';
import { ROLES } from '../config/constants.js';

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

const buildPermissions = (user) => {
  if (user?.customRole?.permissions?.length) {
    return user.customRole.permissions;
  }

  if (user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.COMPANY_OWNER) {
    return ['*'];
  }

  return [];
};

const sanitizeUser = (user, company = null) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  phone: user.phone || '',
  companyId: user.companyId,
  company: company ? { id: company.id, name: company.name, plan: company.plan || null, referralCode: company.referralCode || null } : null,
  permissions: buildPermissions(user),
  preferredLanguage: user.preferredLanguage || 'en',
  emailVerified: user.emailVerified,
});

export const register = async (req, res) => {
  try {
    const { name, email, password, companyName } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 'Name, email, and password are required.', 400);
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return sendError(res, 'An account with this email already exists.', 400);
    }

    const systemSettings = await prisma.settings.findFirst({ where: { companyId: null } });
    if (systemSettings && systemSettings.userRegistrationEnabled === false) {
      return sendError(res, 'Public user registration is currently disabled by administrator.', 403);
    }

    const defaultPlan = await prisma.plan.findFirst({ where: { isDefault: true, isActive: true } })
      ?? await prisma.plan.findFirst({ where: { isActive: true } });

    const verificationToken = crypto.randomBytes(24).toString('hex');
    const requiresVerification = systemSettings?.emailVerification || false;
    const hashedPassword = await bcrypt.hash(password, 10);

    const { company, user } = await prisma.$transaction(async (tx) => {
      const referralCode = `WS-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const createdCompany = await tx.company.create({
        data: {
          name: companyName || `${name}'s Company`,
          email: normalizedEmail,
          planId: defaultPlan?.id || null,
          planBillingCycle: 'monthly',
          referralCode,
          status: 'active',
          enableLogin: true,
        },
      });

      const createdUser = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          password: hashedPassword,
          role: ROLES.COMPANY_OWNER,
          companyId: createdCompany.id,
          emailVerified: !requiresVerification,
          verificationToken: requiresVerification ? verificationToken : null,
          status: 'active',
        },
      });

      return { company: createdCompany, user: createdUser };
    });

    if (requiresVerification) {
      const verifyUrl = `${process.env.APP_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
      await sendEmail({
        to: user.email,
        subject: 'Verify Your WhatsStore Account',
        html: `<h2>Welcome to WhatsStore!</h2><p>Please verify your email address by clicking below:</p><a href="${verifyUrl}">Verify Account</a>`,
      });
    }

    const token = generateToken({ userId: user.id, role: user.role, companyId: company.id });

    return sendSuccess(
      res,
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          companyId: company.id,
          companyName: company.name,
          emailVerified: user.emailVerified,
        },
      },
      'Account created successfully.',
      201
    );
  } catch (error) {
    console.error('Register error:', error);
    return sendError(res, error.message, 500);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required.', 400);
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { customRole: true },
    });

    if (!user) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    if (user.status === 'disabled' || user.status === 'inactive') {
      return sendError(res, 'Your account is disabled. Please contact administrator.', 403);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    let company = null;
    if (user.companyId) {
      company = await prisma.company.findUnique({
        where: { id: user.companyId },
        include: { plan: true },
      });

      if (company && !company.enableLogin && user.role !== ROLES.SUPER_ADMIN) {
        return sendError(res, 'Login is disabled for your company.', 403);
      }
    }

    const token = generateToken({ userId: user.id, role: user.role, companyId: user.companyId });

    return sendSuccess(
      res,
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          companyId: user.companyId,
          company: company ? { id: company.id, name: company.name, plan: company.plan } : null,
          permissions: buildPermissions(user),
        },
      },
      'Logged in successfully.'
    );
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, error.message, 500);
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { customRole: true },
    });

    let company = null;
    if (user?.companyId) {
      company = await prisma.company.findUnique({
        where: { id: user.companyId },
        include: { plan: true },
      });
    }

    return sendSuccess(res, {
      user: sanitizeUser(user, company),
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email, avatar, phone, preferredLanguage } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { id: req.user.id } });

    const data = {};
    if (name) data.name = name;
    if (avatar !== undefined) data.avatar = avatar;
    if (phone !== undefined) data.phone = phone;
    if (preferredLanguage) data.preferredLanguage = preferredLanguage;

    if (email && normalizeEmail(email) !== existingUser.email) {
      const conflict = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
      if (conflict) {
        return sendError(res, 'Email already in use by another user.', 400);
      }
      data.email = normalizeEmail(email);
    }

    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data,
      include: { customRole: true },
    });

    return sendSuccess(res, { user: sanitizeUser(updatedUser) }, 'Profile updated successfully.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return sendError(res, 'Current password and new password are required.', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return sendError(res, 'Current password does not match.', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return sendSuccess(res, null, 'Password updated successfully.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 'Email is required.', 400);

    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return sendSuccess(res, null, 'If this email exists, a password reset link has been dispatched.');
    }

    const token = crypto.randomBytes(24).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: new Date(Date.now() + 3600000),
      },
    });

    const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 8px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #0284c7 0%, #06b6d4 100%); padding: 30px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
            .content { padding: 30px; background: white; }
            .message { margin-bottom: 24px; }
            .message p { margin: 0 0 12px 0; color: #555; }
            .button-wrapper { text-align: center; margin: 30px 0; }
            .reset-button { display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #06b6d4 100%); color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; }
            .reset-button:hover { opacity: 0.9; }
            .link-text { color: #999; font-size: 12px; word-break: break-all; }
            .footer { background: #f3f4f6; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e5e7eb; }
            .warning { background: #fef3c7; border-left: 4px solid #fbbf24; padding: 12px; margin-top: 20px; border-radius: 4px; color: #92400e; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <div class="message">
                <p>Hi <strong>${user.name || 'there'}</strong>,</p>
                <p>We received a request to reset the password associated with your WhatsStore account. Click the button below to set a new password:</p>
              </div>
              <div class="button-wrapper">
                <a href="${resetUrl}" class="reset-button">Reset Your Password</a>
              </div>
              <p style="text-align: center; color: #999; font-size: 12px;">Or paste this link in your browser:</p>
              <p style="text-align: center; word-break: break-all;"><span class="link-text">${resetUrl}</span></p>
              <div class="warning">
                <strong>⏱️ This link expires in 1 hour</strong><br>
                If you didn't request this reset, please ignore this email. Your account remains secure.
              </div>
              <p style="margin-top: 24px; color: #666; font-size: 13px;">
                If you need help, reply to this email or contact our support team at <a href="mailto:support@whatsstore.io" style="color: #0284c7; text-decoration: none;">support@whatsstore.io</a>
              </p>
            </div>
            <div class="footer">
              <p style="margin: 0;">© 2026 WhatsStore. All rights reserved.<br>WhatsStore — SaaS E-commerce Platform for WhatsApp</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail({
      to: user.email,
      subject: '🔐 Password Reset Request — WhatsStore',
      html: emailHTML,
    });

    return sendSuccess(res, null, 'If this email exists, a password reset link has been dispatched.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return sendError(res, 'Token and new password are required.', 400);
    }

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return sendError(res, 'Invalid or expired password reset link.', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return sendSuccess(res, null, 'Password has been reset successfully. Please sign in with your new password.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const impersonateCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return sendError(res, 'Company not found.', 404);
    }

    const ownerUser = await prisma.user.findFirst({ where: { companyId, role: ROLES.COMPANY_OWNER } })
      ?? await prisma.user.findFirst({ where: { companyId } });

    if (!ownerUser) {
      return sendError(res, 'No user found for this company.', 404);
    }

    const token = generateToken({
      userId: ownerUser.id,
      role: ownerUser.role,
      companyId: company.id,
      impersonatedCompanyId: company.id,
    }, '1h');

    return sendSuccess(res, { token, company, user: ownerUser }, `Logged in as company ${company.name}`);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
