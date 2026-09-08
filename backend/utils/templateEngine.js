/**
 * Dynamic Template Engine for Email, WhatsApp, and Telegram messaging.
 */

export const interpolateVariables = (templateStr, data = {}) => {
  if (!templateStr || typeof templateStr !== 'string') return '';

  let result = templateStr;
  Object.keys(data).forEach((key) => {
    const value = data[key] !== undefined && data[key] !== null ? String(data[key]) : '';
    const regex = new RegExp(`\\{${key}\\}`, 'gi');
    result = result.replace(regex, value);
  });

  return result;
};

export const renderOrderMessage = ({
  template,
  itemFormat,
  orderData,
  items = [],
  channel = 'whatsapp' // 'whatsapp' | 'telegram' | 'email' | 'sms'
}) => {
  // 1. Render item lines
  let renderedItems = '';
  if (itemFormat && Array.isArray(items)) {
    const lines = items.map((item) => {
      return interpolateVariables(itemFormat, {
        sku: item.sku || 'N/A',
        quantity: item.quantity || 1,
        product_name: item.name || item.productName || 'Product',
        variant_name: item.variantName || (item.selectedVariant ? Object.values(item.selectedVariant).join(', ') : 'Standard'),
        item_tax: (item.tax || 0).toFixed(2),
        item_total: ((item.price || 0) * (item.quantity || 1)).toFixed(2),
      });
    });
    renderedItems = lines.join('\n');
  }

  // 2. Aggregate order level data
  const mergedData = {
    store_name: orderData.storeName || '',
    order_no: orderData.orderNumber || orderData.orderNo || orderData._id || '',
    customer_name: orderData.customerName || `${orderData.billingAddress?.firstName || ''} ${orderData.billingAddress?.lastName || ''}`.trim(),
    customer_email: orderData.customerEmail || '',
    customer_phone: orderData.customerPhone || '',
    shipping_address: orderData.shippingAddress?.street || orderData.shippingAddress?.address || '',
    shipping_country: orderData.shippingAddress?.country || '',
    shipping_state: orderData.shippingAddress?.state || '',
    shipping_city: orderData.shippingAddress?.city || '',
    shipping_postalcode: orderData.shippingAddress?.postalCode || '',
    item_variable: renderedItems,
    qty_total: orderData.totalQuantity || items.reduce((acc, i) => acc + (i.quantity || 1), 0),
    sub_total: (orderData.subtotal || 0).toFixed(2),
    discount_amount: (orderData.discount || 0).toFixed(2),
    shipping_amount: (orderData.shippingCost || 0).toFixed(2),
    total_tax: (orderData.taxTotal || 0).toFixed(2),
    final_total: (orderData.total || 0).toFixed(2),
    payment_method: orderData.paymentMethod || 'Cash on Delivery',
    order_url: orderData.orderUrl || '',
    app_name: orderData.appName || 'WhatsStore',
  };

  let rendered = interpolateVariables(template, mergedData);

  if (channel === 'whatsapp') {
    // WhatsApp format: strip HTML tags if any, convert common tags to markdown
    rendered = rendered
      .replace(/<b>(.*?)<\/b>/gi, '*$1*')
      .replace(/<strong>(.*?)<\/strong>/gi, '*$1*')
      .replace(/<i>(.*?)<\/i>/gi, '_$1_')
      .replace(/<em>(.*?)<\/em>/gi, '_$1_')
      .replace(/<code>(.*?)<\/code>/gi, '```$1```')
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<[^>]+>/g, '');
  }

  return rendered;
};
