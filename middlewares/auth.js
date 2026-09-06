import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { sendError } from '../utils/response.js';
import { ROLES } from '../config/constants.js';

const JWT_SECRET = process.env.JWT_SECRET || 'whatsstore_super_jwt_secret_key_2026';

export const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

/**
 * Authentication Middleware: Extracts Bearer JWT from headers and attaches user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return sendError(res, 'Authentication required. No token provided.', 401);
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return sendError(res, 'Invalid or expired authentication token.', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { customRole: true },
    });

    if (!user) {
      return sendError(res, 'User account no longer exists.', 401);
    }

    if (user.status === 'disabled' || user.status === 'inactive') {
      return sendError(res, 'This user account has been disabled.', 403);
    }

    req.user = {
      ...user,
      _id: user.id,
      roleId: user.customRole ? { permissions: user.customRole.permissions } : null,
    };

    if (user.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: user.companyId },
        include: { plan: true },
      });

      if (company) {
        if (!company.enableLogin && user.role !== ROLES.SUPER_ADMIN) {
          return sendError(res, 'Login is currently disabled for this company.', 403);
        }
        req.company = company;
      }
    }

    if (decoded.impersonatedCompanyId) {
      req.impersonatedCompanyId = decoded.impersonatedCompanyId;
    }

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return sendError(res, 'Authentication failed.', 500);
  }
};

/**
 * Role-Based Access Control Middleware
 */
export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthorized.', 401);
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    return sendError(res, `Forbidden. Requires one of roles: ${allowedRoles.join(', ')}`, 403);
  };
};

/**
 * Ensures request has tenant scope (companyId)
 */
export const requireCompanyScope = (req, res, next) => {
  if (req.user.role === ROLES.SUPER_ADMIN) {
    return next();
  }

  const effectiveCompanyId = req.impersonatedCompanyId || req.user.companyId;
  if (!effectiveCompanyId) {
    return sendError(res, 'Tenant company context required for this operation.', 403);
  }

  req.effectiveCompanyId = effectiveCompanyId;
  next();
};

/**
 * Granular Permission Check Middleware (§13.2)
 */
export const requirePermission = (permissionKey) => {
  return (req, res, next) => {
    if (req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.COMPANY_OWNER) {
      return next();
    }

    const rolePermissions = req.user.roleId?.permissions || [];
    if (rolePermissions.includes(permissionKey) || rolePermissions.includes('*')) {
      return next();
    }

    return sendError(res, `Forbidden. Missing required permission: '${permissionKey}'`, 403);
  };
};
