import api from '../api/axios';

export async function downloadOrderPdf(slug, orderNumber) {
  const response = await api.get(`/storefront/${encodeURIComponent(slug)}/orders/${encodeURIComponent(orderNumber)}/invoice`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoice-${orderNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default downloadOrderPdf;
