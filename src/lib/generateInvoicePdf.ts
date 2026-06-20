// src/lib/generateInvoicePdf.ts
// Client-side invoice PDF generation. There used to be a call to a Supabase
// edge function ('generate-invoice-pdf') for this, but that function was
// never written or deployed, so "Download PDF" always failed. This builds
// the PDF directly in the browser from the invoice detail data we already
// have, with no backend involved.
import jsPDF from 'jspdf';
import { InvoiceDetail } from '@/types/invoice';

function formatMoney(amount: number | null | undefined) {
  return `${(amount ?? 0).toFixed(2)} MAD`;
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-MA');
}

export function generateInvoicePdf(invoice: InvoiceDetail): Blob {
  const doc = new jsPDF();
  const left = 14;
  let y = 18;

  doc.setFontSize(18);
  doc.text('DEALTOCK', left, y);
  doc.setFontSize(11);
  doc.text(`Invoice ${invoice.invoice_number}`, 196, y, { align: 'right' });
  y += 6;
  doc.setFontSize(9);
  doc.text(`Order #${invoice.order_number}  ·  ${formatDate(invoice.invoice_date)}`, 196, y, { align: 'right' });
  y += 12;

  doc.setDrawColor(200);
  doc.line(left, y, 196, y);
  y += 8;

  doc.setFontSize(11);
  doc.text('Seller', left, y);
  y += 5;
  doc.setFontSize(9);
  const sellerName = invoice.seller_info?.full_name || invoice.seller_name || '-';
  doc.text(sellerName, left, y);
  y += 5;
  if (invoice.seller_info?.company) {
    doc.text(invoice.seller_info.company, left, y);
    y += 5;
  }
  const sellerEmail = invoice.seller_info?.email || invoice.seller_email;
  if (sellerEmail) {
    doc.text(sellerEmail, left, y);
    y += 5;
  }

  y += 6;
  doc.setFontSize(11);
  doc.text('Financial breakdown', left, y);
  y += 7;

  const fs = invoice.financial_summary || {
    product_price: 0, delivery_fee: 0, subtotal: 0,
    dealtock_commission: 0, dropshipper_commission: 0, seller_net: 0, total: 0
  };

  const rows: [string, string][] = [
    ['Product price', formatMoney(fs.product_price)],
    ['Delivery fee', formatMoney(fs.delivery_fee)],
    ['Subtotal', formatMoney(fs.subtotal)],
    ['Dealtock commission', `-${formatMoney(fs.dealtock_commission)}`],
  ];
  if (fs.dropshipper_commission) {
    rows.push(['Dropshipper commission', `-${formatMoney(fs.dropshipper_commission)}`]);
  }
  rows.push(['Seller net', formatMoney(fs.seller_net)]);

  doc.setFontSize(9);
  rows.forEach(([label, value], i) => {
    const isTotal = label === 'Seller net';
    doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
    doc.text(label, left, y);
    doc.text(value, 196, y, { align: 'right' });
    y += 6;
    if (isTotal) {
      doc.setDrawColor(220);
      doc.line(left, y - 4.5, 196, y - 4.5);
    }
  });
  doc.setFont('helvetica', 'normal');

  if (invoice.lines && invoice.lines.length > 0) {
    y += 8;
    doc.setFontSize(11);
    doc.text('Line items', left, y);
    y += 7;
    doc.setFontSize(9);
    invoice.lines.forEach((line) => {
      doc.text(`${line.description}  x${line.quantity}`, left, y);
      doc.text(formatMoney(line.total_price), 196, y, { align: 'right' });
      y += 6;
    });
  }

  y += 10;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Status: ${invoice.invoice_status?.toUpperCase()}`, left, y);

  return doc.output('blob');
}

export function downloadInvoicePdf(invoice: InvoiceDetail) {
  const blob = generateInvoicePdf(invoice);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${invoice.invoice_number}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
