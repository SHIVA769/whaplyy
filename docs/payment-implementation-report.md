# Payment Implementation Report

## 0. Shop Owner Website Report

The shop owner website is the authenticated merchant portal used to configure stores, manage products, receive orders, control customer information, and configure payment instructions.

### Merchant portal entry points

| Area | Route | Purpose |
| --- | --- | --- |
| Merchant dashboard | `/company` | Business summary, revenue, orders, and product activity |
| Store management | `/company/stores` | Create stores, edit branding, payment settings, QR sharing, and storefront links |
| Product catalog | `/company/products` | Create and manage products, prices, stock, variants, images, SEO, and specifications |
| Categories | `/company/categories` | Organize products into active or inactive categories |
| Tax rules | `/company/tax` | Configure percentage or fixed tax rules |
| Orders | `/company/orders` | Review orders, payment status, fulfillment status, and invoices |
| Customers | `/company/customers` | Manage customer profiles, addresses, contact details, and order history |
| Store coupons | `/company/coupons` | Create and manage discount codes |
| Shipping methods | `/company/shipping` | Configure delivery methods, cost, zones, and delivery estimates |
| Analytics | `/company/analytics` | Review sales, orders, customers, and product performance |
| Staff and roles | `/company/staff` | Add staff and assign permissions |
| Plans and billing | `/company/plans` | Review subscription plans and billing activity |
| Referrals | `/company/referrals` | Manage referral activity and payout requests |
| Company settings | `/company/settings` | Configure account, communication, and messaging settings |

### Merchant workflow

1. Sign in as a company owner or authorized staff member.
2. Select the active store from the merchant sidebar.
3. Configure store identity, theme, address, WhatsApp, payment, and PWA settings.
4. Add categories, taxes, products, inventory, shipping methods, and coupons.
5. Open the public storefront link or download the store QR code.
6. Receive customer orders through the dashboard and WhatsApp notifications.
7. Verify payment, update fulfillment status, and download invoices.

### Access control

The merchant website uses authenticated routes and role-based permissions. Company owners have full company access. Staff members receive only the modules and actions granted to their role.

The API validates the authenticated user, company scope, role, and permission before protected merchant requests are processed.

## 0.1 Store Owner Store Setup

From the Stores screen, the owner can configure:

- Store name and URL slug
- Logo, banner, favicon, and welcome message
- Store theme blueprint
- Address and contact information
- Social links
- WhatsApp floating widget and phone number
- UPI and bank transfer payment details
- PWA name, colors, and install behavior
- Custom CSS and JavaScript
- Active or inactive store status

Each store has its own catalog, categories, taxes, shipping methods, coupons, customers, and orders while remaining linked to the owner's company.

## 0.2 Product Management

The product catalog supports:

- Product name and SKU
- Store assignment
- Category and tax assignment
- Short and rich descriptions
- Regular, sale, and cost prices
- Stock quantity and low-stock threshold
- Product badges
- Product variants and options
- Thumbnail and multi-image gallery
- SEO title and description
- Custom specification fields
- Active, inactive, and draft status
- Display visibility on the public storefront

Product image URLs are reused in storefront cards, quick view, cart items, invoices, and WhatsApp order messages when the image is publicly reachable.

## 0.3 Order Management

The owner can review:

- Order number
- Customer information
- Store and order items
- Product quantities and variants
- Subtotal, tax, shipping, discount, and total
- Payment method and payment status
- Fulfillment status
- Customer notes
- Order timeline
- Invoice download

Fulfillment statuses are:

```text
pending -> processing -> shipped -> delivered
```

An order can also be cancelled. Payment statuses are `pending`, `paid`, `failed`, or `refunded`.

## 0.4 Customer and Communication Management

The owner can view customer contact information, delivery addresses, order totals, order count, status, language preference, and communication preferences.

The system can send or prepare:

- WhatsApp order messages
- Email confirmations
- Telegram notifications when configured
- SMS notifications when configured
- Webhook events for connected systems

## 0.5 Public Shop Website

Each store has a public website at:

```text
/store/:slug
```

The public website includes:

- Store branding and logo
- Store theme and hero section
- Search and category filtering
- Product listing cards
- Product quick view
- Product variants
- Cart drawer
- Coupon application
- Address and shipping checkout
- Payment selection
- UPI QR payment page
- Order success page
- Customer account and order tracking
- Newsletter and contact sections
- WhatsApp floating contact button
- Store QR link for offline promotion

The public storefront does not require merchant authentication. Customers can browse and place guest orders.

## 1. Overview

The store payment system supports shop-owner-configured UPI payments, QR-code checkout, bank transfer instructions, Indian Rupee display, and WhatsApp order communication.

The payment flow is manual-confirmation based. The customer pays through a UPI app, confirms payment on the website, and the order is marked as paid. The shop owner should still verify the payment in their bank or UPI application.

## 2. Shop Owner Configuration

Shop owners configure payment details from:

`Company Portal -> Stores -> Edit Store -> Payments`

### UPI settings

| Field | Purpose |
| --- | --- |
| Accept UPI payments | Enables or disables the UPI option at checkout |
| UPI ID | Payment address used to create the UPI payment link and QR code |
| Account name | Name displayed to customers |
| UPI QR code | Optional uploaded QR image or public image URL |

### Bank transfer settings

| Field | Purpose |
| --- | --- |
| Bank name | Receiving bank name |
| Account name | Beneficiary name |
| Account number | Receiving bank account number |
| IFSC code | Indian bank branch identifier |

These values are stored in the store's `paymentSettings` object.

## 3. Store Data Structure

The store model contains:

```js
paymentSettings: {
  upiEnabled: Boolean,
  upiId: String,
  accountName: String,
  qrCodeImage: String,
  bankName: String,
  accountNumber: String,
  ifscCode: String,
}
```

The public storefront endpoint returns these payment instructions through:

`GET /api/storefront/:slug`

Only payment instructions intended for customers are returned.

## 4. Customer Website Flow

### Standard payment methods

The checkout page supports:

- Cash on Delivery
- WhatsApp order
- Bank Transfer
- Stripe label/payment option already present in the existing checkout
- UPI Payment when the owner has enabled UPI and entered a UPI ID

### UPI checkout flow

1. Customer adds products to the cart.
2. Customer enters contact and delivery details.
3. Customer selects **UPI Payment**.
4. The website creates the order with `paymentStatus: pending`.
5. The customer is redirected to:

   `/store/:slug/payment/:orderNumber`

6. The payment screen displays:
   - Owner-uploaded QR image, when configured
   - Otherwise a locally generated QR code using the UPI payment URI
   - UPI ID
   - Account name
   - Order amount in Indian Rupees
   - Bank transfer details, when configured
   - Ten-minute payment countdown
7. Customer scans the QR code and pays using a UPI application.
8. Customer clicks **I Have Paid, Confirm Order**.
9. The website confirms the payment and redirects to the order success page.

## 5. UPI QR Generation

When no uploaded QR image is available, the website generates a QR code from this structure:

```text
upi://pay?pa=UPI_ID&pn=ACCOUNT_NAME&am=ORDER_AMOUNT&cu=INR
```

The QR is generated in the browser using `qrcode.react`.

The amount is formatted as Indian Rupees and the payment currency parameter is `INR`.

## 6. Backend Payment Routes

### Create order

```http
POST /api/storefront/:slug/checkout
```

The request includes:

```js
{
  contactInfo,
  items,
  shippingMethodId,
  couponCode,
  paymentMethod: "UPI",
  notes,
  isGuest
}
```

### Confirm UPI payment

```http
POST /api/storefront/:slug/orders/:orderNumber/payment-confirmation
```

The backend verifies:

- Store exists and is active
- Order belongs to the store
- Order payment method is `UPI`

Then it changes:

```text
paymentStatus: pending -> paid
```

A `Payment Confirmed` timeline event is added to the order.

## 7. Order Status Behavior

| Payment method | Initial payment status |
| --- | --- |
| Cash on Delivery | `pending` |
| WhatsApp | `pending` |
| Bank Transfer | `pending` |
| UPI | `pending` |
| Other integrated/simulated methods | Existing behavior applies |

UPI orders remain pending until the customer confirms payment. The store owner should verify the transaction before fulfilling the order.

## 8. WhatsApp Order Message

After order creation, the WhatsApp message includes:

- Order number
- Customer details
- Product lines
- Order totals
- Product image URLs when publicly reachable
- UPI ID and account name for UPI orders
- Public UPI QR image URL, when available
- Bank name
- Account name
- Account number
- IFSC code

Product image paths beginning with `/` are converted to absolute links using `APP_URL` so WhatsApp can open them.

A normal WhatsApp URL can send image links and previews, but it cannot attach local or base64 image files directly.

## 9. Indian Currency Support

Customer-facing storefront amounts use a shared formatter based on the Indian locale:

```js
formatCurrency(1299.5)
// ₹1,299.50
```

INR formatting is applied to:

- Product cards
- Product quick view
- Cart drawer
- Checkout totals
- Shipping prices
- Coupons and discounts
- Order success page
- Customer order history
- WhatsApp order messages
- UPI payment screen

The backend currency default and seeded default currency are set to:

```text
Code: INR
Symbol: ₹
Name: Indian Rupee
```

Existing numeric prices are not automatically exchanged from USD to INR. A stored value of `100` is displayed as `₹100.00`.

## 10. Main Files

### Frontend

- `frontend/src/pages/company/Stores.jsx`
- `frontend/src/pages/storefront/StorefrontCheckout.jsx`
- `frontend/src/pages/storefront/StorefrontPayment.jsx`
- `frontend/src/pages/storefront/OrderSuccess.jsx`
- `frontend/src/pages/storefront/CartDrawer.jsx`
- `frontend/src/pages/storefront/StorefrontHome.jsx`
- `frontend/src/pages/storefront/StorefrontSections.jsx`
- `frontend/src/pages/storefront/QuickViewModal.jsx`
- `frontend/src/pages/storefront/StoreCustomerAccount.jsx`
- `frontend/src/utils/currency.js`

### Backend

- `backend/models/Store.js`
- `backend/controllers/storefrontController.js`
- `backend/routes/storefrontRoutes.js`
- `backend/models/Settings.js`
- `backend/seeds/seedData.js`

## 11. Verification Checklist

- [ ] Shop owner enables UPI.
- [ ] Shop owner enters a valid UPI ID.
- [ ] Shop owner optionally uploads a QR image.
- [ ] Shop owner enters bank details if bank transfer instructions are required.
- [ ] Customer sees UPI at checkout.
- [ ] Customer sees the correct UPI ID and amount.
- [ ] QR code scans successfully.
- [ ] Ten-minute timer is visible.
- [ ] Customer confirmation redirects to order success.
- [ ] Order payment status changes to `paid`.
- [ ] WhatsApp message contains product image links and payment details.
- [ ] Storefront amounts display with `₹`.

## 12. Important Production Recommendation

Customer confirmation alone does not prove that money was received. For production use, connect a payment provider such as Razorpay, Cashfree, PhonePe, or another UPI-capable provider and process verified webhooks before automatically changing an order to `paid`.
