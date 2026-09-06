import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Download } from 'lucide-react';
import { Modal } from './Modal';

export const QRCodeModal = ({ isOpen, onClose, storeName, storeUrl }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('store-qr-code');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${storeName || 'store'}-qr-code.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Store QR Code & Share Link" maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center">
        <p className="text-xs text-slate-500 mb-4">
          Customers can scan this QR code on packaging, counter stands, or flyers to instantly open your WhatsApp storefront.
        </p>

        {/* QR Box */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm mb-5">
          <QRCodeSVG id="store-qr-code" value={storeUrl} size={200} level="H" includeMargin />
        </div>

        <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{storeName}</p>
        <p className="text-xs text-slate-400 font-mono break-all mb-5 px-4">{storeUrl}</p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={handleCopy}
            className="flex-1 inline-flex items-center justify-center py-2.5 px-4 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl transition-colors"
          >
            {copied ? <Check className="w-4 h-4 mr-1.5 text-emerald-600" /> : <Copy className="w-4 h-4 mr-1.5" />}
            {copied ? 'Link Copied!' : 'Copy Link'}
          </button>
          <button
            onClick={handleDownloadQR}
            className="flex-1 inline-flex items-center justify-center py-2.5 px-4 text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-sm transition-colors"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Download QR
          </button>
        </div>
      </div>
    </Modal>
  );
};
