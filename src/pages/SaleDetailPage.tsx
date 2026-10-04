import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { db } from '../db/database';
import { Sale } from '../types';
import { t } from '../i18n';
import { formatCurrency, formatDateTime, formatDate, formatTime } from '../utils/format';
import { ArrowLeft, Printer, Download, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { settings } = useSettingsStore();
  const lang = settings?.language || 'uz';
  const currency = settings?.currency || "so'm";

  const [sale, setSale] = useState<Sale | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser || !id) return;
    loadSale();
  }, [currentUser, id]);

  async function loadSale() {
    if (!id) return;
    const s = await db.sales.get(id);
    if (s) setSale(s);
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current || !sale) return;
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
      pdf.save(`receipt-${sale.saleNumber}.pdf`);
    } catch (e) {
      console.error('PDF error:', e);
    }
  };

  const handleDownloadImage = async () => {
    if (!receiptRef.current || !sale) return;
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `receipt-${sale.saleNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Image error:', e);
    }
  };

  const handleShare = async () => {
    if (!receiptRef.current || !sale) return;
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: '#ffffff' });
      canvas.toBlob(async (blob) => {
        if (blob && navigator.share) {
          const file = new File([blob], `receipt-${sale.saleNumber}.png`, { type: 'image/png' });
          await navigator.share({
            title: `Chek - ${sale.saleNumber}`,
            files: [file],
          });
        }
      });
    } catch (e) {
      console.error('Share error:', e);
    }
  };

  if (!sale) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('general.loading', lang)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 no-print">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{sale.saleNumber}</h1>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 no-print flex-wrap">
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
          <Printer size={16} /> {t('general.print', lang)}
        </button>
        <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
          <Download size={16} /> PDF
        </button>
        <button onClick={handleDownloadImage} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
          <Download size={16} /> PNG
        </button>
        <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
          <Share2 size={16} /> Share
        </button>
      </div>

      {/* Receipt */}
      <div ref={receiptRef} className="bg-white rounded-xl border border-gray-200 p-6 max-w-md mx-auto">
        <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
          <h2 className="text-xl font-bold text-gray-900">HISSOB PRO</h2>
          <p className="text-sm text-gray-500 mt-1">{t('receipt.title', lang)}</p>
        </div>

        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-500">{t('receipt.saleId', lang)}:</span>
            <span className="font-medium">{sale.saleNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('receipt.date', lang)}:</span>
            <span className="font-medium">{formatDate(sale.createdAt, lang)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('receipt.time', lang)}:</span>
            <span className="font-medium">{formatTime(sale.createdAt)}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-300 pt-4 mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs">
                <th className="text-left pb-2">{t('receipt.product', lang)}</th>
                <th className="text-center pb-2">{t('receipt.qty', lang)}</th>
                <th className="text-right pb-2">{t('receipt.price', lang)}</th>
                <th className="text-right pb-2">{t('receipt.total', lang)}</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="py-2 text-left">{item.productNameSnapshot}</td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right">{formatCurrency(item.salePrice, currency)}</td>
                  <td className="py-2 text-right font-medium">{formatCurrency(item.itemTotal, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-dashed border-gray-300 pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">{t('sales.subtotal', lang)}:</span>
            <span>{formatCurrency(sale.subtotal, currency)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between text-orange-600">
              <span>{t('sales.discount', lang)}:</span>
              <span>-{formatCurrency(sale.discount, currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
            <span>{t('sales.finalTotal', lang)}:</span>
            <span>{formatCurrency(sale.finalTotal, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('sales.payment', lang)}:</span>
            <span>{formatCurrency(sale.payment, currency)}</span>
          </div>
          {sale.change > 0 && (
            <div className="flex justify-between text-green-600">
              <span>{t('sales.change', lang)}:</span>
              <span>{formatCurrency(sale.change, currency)}</span>
            </div>
          )}
        </div>

        <div className="text-center mt-6 pt-4 border-t border-dashed border-gray-300">
          <p className="text-sm text-gray-500">{t('receipt.thankYou', lang)}</p>
        </div>
      </div>
    </div>
  );
}
