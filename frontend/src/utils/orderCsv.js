export function downloadOrderCsv(order = {}, filename = 'order.csv') {
  try {
    const items = order.items || [];

    const headers = ['Product', 'Quantity', 'Unit Price', 'Line Total'];
    const rows = items.map((it) => [
      (it.productName || it.name || '').replace(/\r?\n|,/g, ' '),
      it.quantity || 0,
      (it.price != null ? Number(it.price).toFixed(2) : ''),
      (it.lineTotal != null ? Number(it.lineTotal).toFixed(2) : ''),
    ]);

    // Add summary rows
    rows.push([]);
    rows.push(['Subtotal', '', '', order.subtotal != null ? Number(order.subtotal).toFixed(2) : '']);
    rows.push(['Tax', '', '', order.taxTotal != null ? Number(order.taxTotal).toFixed(2) : '']);
    rows.push(['Shipping', '', '', order.shippingCost != null ? Number(order.shippingCost).toFixed(2) : '']);
    rows.push(['Total', '', '', order.total != null ? Number(order.total).toFixed(2) : '']);

    const escapeRow = (r) => r.map((c) => {
      if (c == null) return '';
      const s = String(c);
      if (s.includes(',') || s.includes('\n') || s.includes('"')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }).join(',');

    const csv = [headers.join(','), ...rows.map(escapeRow)].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `order-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    // Fallback: copy simple text to clipboard
    try {
      const txt = JSON.stringify(order, null, 2);
      navigator.clipboard?.writeText(txt);
      alert('Unable to generate CSV; order JSON copied to clipboard.');
    } catch (e) {
      // ignore
    }
  }
}

export default downloadOrderCsv;
