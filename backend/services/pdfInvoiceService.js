import PDFDocument from 'pdfkit';

export const generateOrderInvoicePDF = (order, store, res) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  // Stream directly to response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Invoice-${order.orderNumber}.pdf`);
  doc.pipe(res);

  // Header / Brand
  doc.fillColor('#0284c7').fontSize(22).font('Helvetica-Bold').text(store?.name || 'WhatsStore', 40, 40);
  doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(store?.address?.street || 'Online Commerce Store', 40, 68);
  doc.text(`${store?.address?.city || ''} ${store?.address?.state || ''} ${store?.address?.country || ''}`, 40, 80);
  doc.text(`Email: ${store?.email || 'support@store.com'}`, 40, 92);

  // Invoice Title & Info
  doc.fillColor('#0f172a').fontSize(18).font('Helvetica-Bold').text('INVOICE', 400, 40, { align: 'right' });
  doc.fillColor('#475569').fontSize(10).font('Helvetica');
  doc.text(`Invoice #: ${order.orderNumber}`, 400, 65, { align: 'right' });
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 78, { align: 'right' });
  doc.text(`Status: ${order.paymentStatus?.toUpperCase()}`, 400, 91, { align: 'right' });

  doc.moveTo(40, 115).lineTo(555, 115).strokeColor('#e2e8f0').lineWidth(1).stroke();

  // Customer & Shipping Info
  doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Billed & Shipped To:', 40, 130);
  doc.fillColor('#334155').fontSize(10).font('Helvetica');
  doc.text(order.customerName || 'Customer', 40, 145);
  doc.text(order.customerEmail || '', 40, 158);
  doc.text(order.customerPhone || '', 40, 171);
  doc.text(`${order.shippingAddress?.street || ''}`, 40, 184);
  doc.text(`${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.country || ''}`, 40, 197);

  doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Payment & Fulfillment Details:', 340, 130);
  doc.fillColor('#334155').fontSize(10).font('Helvetica');
  doc.text(`Payment Method: ${order.paymentMethod}`, 340, 145);
  doc.text(`Fulfillment: ${order.fulfillmentStatus?.toUpperCase()}`, 340, 158);
  doc.text(`Shipping Method: ${order.shippingMethodName || 'Standard'}`, 340, 171);

  // Items Table Header
  const tableTop = 230;
  doc.rect(40, tableTop, 515, 24).fill('#f1f5f9');
  doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
  doc.text('Item Description', 50, tableTop + 7);
  doc.text('SKU', 250, tableTop + 7);
  doc.text('Price', 330, tableTop + 7);
  doc.text('Qty', 400, tableTop + 7);
  doc.text('Total', 480, tableTop + 7, { align: 'right', width: 65 });

  // Items List
  let y = tableTop + 30;
  doc.font('Helvetica').fontSize(9).fillColor('#334155');

  order.items.forEach((item) => {
    let itemTitle = item.productName;
    if (item.selectedVariant) {
      itemTitle += ` (${Object.values(item.selectedVariant).join(', ')})`;
    }

    doc.text(itemTitle, 50, y, { width: 190 });
    doc.text(item.sku || 'N/A', 250, y);
    doc.text(`$${Number(item.price).toFixed(2)}`, 330, y);
    doc.text(String(item.quantity), 400, y);
    doc.text(`$${Number(item.lineTotal).toFixed(2)}`, 480, y, { align: 'right', width: 65 });

    y += 24;
  });

  doc.moveTo(40, y + 10).lineTo(555, y + 10).strokeColor('#e2e8f0').lineWidth(1).stroke();

  // Summary Totals
  const totalsTop = y + 20;
  doc.font('Helvetica').fontSize(10).fillColor('#475569');
  
  doc.text('Subtotal:', 380, totalsTop);
  doc.text(`$${(order.subtotal || 0).toFixed(2)}`, 480, totalsTop, { align: 'right', width: 65 });

  doc.text('Tax:', 380, totalsTop + 16);
  doc.text(`$${(order.taxTotal || 0).toFixed(2)}`, 480, totalsTop + 16, { align: 'right', width: 65 });

  doc.text('Shipping:', 380, totalsTop + 32);
  doc.text(`$${(order.shippingCost || 0).toFixed(2)}`, 480, totalsTop + 32, { align: 'right', width: 65 });

  if (order.discount > 0) {
    doc.text('Discount:', 380, totalsTop + 48);
    doc.text(`-$${(order.discount || 0).toFixed(2)}`, 480, totalsTop + 48, { align: 'right', width: 65 });
  }

  doc.rect(370, totalsTop + 68, 185, 28).fill('#0284c7');
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#ffffff');
  doc.text('Total:', 380, totalsTop + 76);
  doc.text(`$${(order.total || 0).toFixed(2)}`, 480, totalsTop + 76, { align: 'right', width: 65 });

  // Footer Note
  doc.font('Helvetica').fontSize(9).fillColor('#94a3b8');
  doc.text('Thank you for your order! Powered by WhatsStore SaaS Platform.', 40, 760, { align: 'center', width: 515 });

  doc.end();
};
