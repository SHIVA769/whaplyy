import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import { AuthLayout } from './layouts/AuthLayout';
import { SuperAdminLayout } from './layouts/SuperAdminLayout';
import { CompanyLayout } from './layouts/CompanyLayout';
import { StorefrontLayout } from './layouts/StorefrontLayout';

// Public Landing
const LandingPage = lazy(() => import('./pages/LandingPage').then((module) => ({ default: module.LandingPage })));

// Auth Pages
const Login = lazy(() => import('./pages/auth/Login').then((module) => ({ default: module.Login })));
const Register = lazy(() => import('./pages/auth/Register').then((module) => ({ default: module.Register })));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword').then((module) => ({ default: module.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword').then((module) => ({ default: module.ResetPassword })));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail').then((module) => ({ default: module.VerifyEmail })));
const ManageLanguages = lazy(() => import('./pages/auth/ManageLanguages').then((module) => ({ default: module.ManageLanguages })));

// Super Admin Pages
const SuperAdminDashboard = lazy(() => import('./pages/superAdmin/Dashboard').then((module) => ({ default: module.SuperAdminDashboard })));
const Companies = lazy(() => import('./pages/superAdmin/Companies').then((module) => ({ default: module.Companies })));
const Advertisements = lazy(() => import('./pages/superAdmin/Advertisements').then((module) => ({ default: module.Advertisements })));
const Plans = lazy(() => import('./pages/superAdmin/Plans').then((module) => ({ default: module.Plans })));
const PlatformCoupons = lazy(() => import('./pages/superAdmin/PlatformCoupons').then((module) => ({ default: module.PlatformCoupons })));
const Currencies = lazy(() => import('./pages/superAdmin/Currencies').then((module) => ({ default: module.Currencies })));
const ReferralProgram = lazy(() => import('./pages/superAdmin/ReferralProgram').then((module) => ({ default: module.ReferralProgram })));
const EmailTemplates = lazy(() => import('./pages/superAdmin/EmailTemplates').then((module) => ({ default: module.EmailTemplates })));
const NotificationTemplates = lazy(() => import('./pages/superAdmin/NotificationTemplates').then((module) => ({ default: module.NotificationTemplates })));
const SuperAdminSettings = lazy(() => import('./pages/superAdmin/Settings').then((module) => ({ default: module.Settings })));

// Company Owner Pages
const CompanyDashboard = lazy(() => import('./pages/company/Dashboard').then((module) => ({ default: module.CompanyDashboard })));
const Stores = lazy(() => import('./pages/company/Stores').then((module) => ({ default: module.Stores })));
const Products = lazy(() => import('./pages/company/Products').then((module) => ({ default: module.Products })));
const Categories = lazy(() => import('./pages/company/Categories').then((module) => ({ default: module.Categories })));
const Tax = lazy(() => import('./pages/company/Tax').then((module) => ({ default: module.Tax })));
const Orders = lazy(() => import('./pages/company/Orders').then((module) => ({ default: module.Orders })));
const Customers = lazy(() => import('./pages/company/Customers').then((module) => ({ default: module.Customers })));
const StoreCoupons = lazy(() => import('./pages/company/StoreCoupons').then((module) => ({ default: module.StoreCoupons })));
const Shipping = lazy(() => import('./pages/company/Shipping').then((module) => ({ default: module.Shipping })));
const Analytics = lazy(() => import('./pages/company/Analytics').then((module) => ({ default: module.Analytics })));
const StaffManagement = lazy(() => import('./pages/company/StaffManagement').then((module) => ({ default: module.StaffManagement })));
const CompanyPlans = lazy(() => import('./pages/company/CompanyPlans').then((module) => ({ default: module.CompanyPlans })));
const CompanyReferrals = lazy(() => import('./pages/company/CompanyReferrals').then((module) => ({ default: module.CompanyReferrals })));
const CompanySettings = lazy(() => import('./pages/company/CompanySettings').then((module) => ({ default: module.CompanySettings })));

// Storefront Pages
const StorefrontHome = lazy(() => import('./pages/storefront/StorefrontHome').then((module) => ({ default: module.StorefrontHome })));
const StorefrontCheckout = lazy(() => import('./pages/storefront/StorefrontCheckout').then((module) => ({ default: module.StorefrontCheckout })));
const StorefrontPayment = lazy(() => import('./pages/storefront/StorefrontPayment').then((module) => ({ default: module.StorefrontPayment })));
const OrderSuccess = lazy(() => import('./pages/storefront/OrderSuccess').then((module) => ({ default: module.OrderSuccess })));
const StoreCustomerAccount = lazy(() => import('./pages/storefront/StoreCustomerAccount').then((module) => ({ default: module.StoreCustomerAccount })));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500">
    Loading...
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/manage-languages" element={<ManageLanguages />} />
        </Route>

        {/* Super Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute><SuperAdminLayout /></ProtectedRoute>}>
          <Route index element={<SuperAdminDashboard />} />
          <Route path="companies" element={<Companies />} />
          <Route path="advertisements" element={<Advertisements />} />
          <Route path="plans" element={<Plans />} />
          <Route path="coupons" element={<PlatformCoupons />} />
          <Route path="currencies" element={<Currencies />} />
          <Route path="referrals" element={<ReferralProgram />} />
          <Route path="templates/email" element={<EmailTemplates />} />
          <Route path="templates/notification" element={<NotificationTemplates />} />
          <Route path="settings" element={<SuperAdminSettings />} />
        </Route>

        {/* Company / Merchant Routes */}
        <Route path="/company" element={<ProtectedRoute><CompanyLayout /></ProtectedRoute>}>
          <Route index element={<CompanyDashboard />} />
          <Route path="stores" element={<Stores />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="tax" element={<Tax />} />
          <Route path="orders" element={<Orders />} />
          <Route path="customers" element={<Customers />} />
          <Route path="coupons" element={<StoreCoupons />} />
          <Route path="shipping" element={<Shipping />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="staff" element={<StaffManagement />} />
          <Route path="plans" element={<CompanyPlans />} />
          <Route path="referrals" element={<CompanyReferrals />} />
          <Route path="settings" element={<CompanySettings />} />
        </Route>

        {/* Storefront Routes */}
        <Route path="/store/:slug" element={<StorefrontLayout />}>
          <Route index element={<StorefrontHome />} />
          <Route path="preview" element={<StorefrontHome />} />
          <Route path="checkout" element={<StorefrontCheckout />} />
          <Route path="payment/:orderNumber" element={<StorefrontPayment />} />
          <Route path="order-success/:orderId" element={<OrderSuccess />} />
          <Route path="customer/login" element={<StoreCustomerAccount />} />
          <Route path="customer/profile" element={<StoreCustomerAccount />} />
          <Route path="customer/orders" element={<StoreCustomerAccount />} />
        </Route>

        {/* Fallback wildcard route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
