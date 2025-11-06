/**
 * Generate Return Report PDF
 * Creates a formatted PDF return authorization request
 */

import { jsPDF } from 'jspdf';
import type { InventoryItem } from '../types/inventory.types';

interface ReportMetadata {
  reportNumber: string;
  date: string;
  accountNumber?: string;
  vendorName: string;
  contactEmail: string;
}

export async function generateReturnReportPDF(
  items: InventoryItem[],
  metadata: ReportMetadata
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter'
  });

  const pageWidth = 8.5;
  const pageHeight = 11;
  const margin = 0.5;
  const contentWidth = pageWidth - (margin * 2);

  let yPosition = margin;

  // Helper function to add text
  const addText = (text: string, x: number, y: number, options: any = {}) => {
    doc.setFontSize(options.fontSize || 10);
    doc.setFont(options.font || 'helvetica', options.style || 'normal');
    doc.text(text, x, y, options);
  };

  // Helper function to draw a line
  const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
    doc.setDrawColor(200, 200, 200);
    doc.line(x1, y1, x2, y2);
  };

  // Title
  doc.setFillColor(99, 102, 241); // Purple
  doc.rect(margin, yPosition, contentWidth, 0.6, 'F');
  addText('RETURN AUTHORIZATION REQUEST', pageWidth / 2, yPosition + 0.4, {
    fontSize: 18,
    style: 'bold',
    align: 'center',
    textColor: [255, 255, 255]
  });
  doc.setTextColor(0, 0, 0); // Reset to black
  yPosition += 0.8;

  // Header section
  drawLine(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 0.2;

  addText(`Report #: ${metadata.reportNumber}`, margin + 0.2, yPosition, { fontSize: 11 });
  yPosition += 0.25;
  addText(`Date: ${metadata.date}`, margin + 0.2, yPosition, { fontSize: 11 });
  yPosition += 0.25;
  if (metadata.accountNumber) {
    addText(`Account #: ${metadata.accountNumber}`, margin + 0.2, yPosition, { fontSize: 11 });
    yPosition += 0.25;
  }
  addText(`Vendor: ${metadata.vendorName}`, margin + 0.2, yPosition, { fontSize: 11, style: 'bold' });
  yPosition += 0.3;

  drawLine(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 0.3;

  // Items section header
  addText('ITEMS FOR RETURN', margin + 0.2, yPosition, { fontSize: 12, style: 'bold' });
  yPosition += 0.3;

  // Sort items by brand, then model
  const sortedItems = [...items].sort((a, b) => {
    const brandCompare = (a.brand || '').localeCompare(b.brand || '');
    if (brandCompare !== 0) return brandCompare;
    return (a.model || '').localeCompare(b.model || '');
  });

  // Draw items
  sortedItems.forEach((item, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 1.5) {
      doc.addPage();
      yPosition = margin;
    }

    // Item box
    const boxHeight = 0.9;
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 250, 250);
    doc.rect(margin + 0.2, yPosition, contentWidth - 0.4, boxHeight, 'FD');

    let itemY = yPosition + 0.2;
    addText(`Brand: ${item.brand || 'N/A'}`, margin + 0.4, itemY, { fontSize: 10, style: 'bold' });
    itemY += 0.18;
    addText(`Model: ${item.model || 'N/A'}`, margin + 0.4, itemY, { fontSize: 10 });
    itemY += 0.18;
    addText(`Color: ${item.color || 'N/A'}`, margin + 0.4, itemY, { fontSize: 10 });
    itemY += 0.18;
    addText(`Size: ${item.full_size || item.size || 'N/A'}`, margin + 0.4, itemY, { fontSize: 10 });
    itemY += 0.18;
    addText(`Quantity: ${item.quantity}`, margin + 0.4, itemY, { fontSize: 10, style: 'bold' });

    yPosition += boxHeight + 0.15;
  });

  // Total
  yPosition += 0.1;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  addText(`Total Items: ${totalQuantity}`, margin + 0.2, yPosition, { fontSize: 11, style: 'bold' });
  yPosition += 0.4;

  // Footer section
  drawLine(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 0.3;

  addText(
    'Please provide return authorization and shipping instructions for the above items.',
    margin + 0.2,
    yPosition,
    { fontSize: 10 }
  );
  yPosition += 0.25;
  addText(`Contact: ${metadata.contactEmail}`, margin + 0.2, yPosition, { fontSize: 10 });

  // Return as blob
  return doc.output('blob');
}

/**
 * Generate report number in format RR-YYYY-NNN
 */
export function generateReportNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900) + 100; // 3-digit number
  return `RR-${year}-${random}`;
}

/**
 * Format date for report
 */
export function formatReportDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Generate filename for return report
 */
export function generateReportFilename(vendorName: string, reportNumber: string): string {
  const cleanVendorName = vendorName.replace(/[^a-zA-Z0-9]/g, '_');
  return `Return_Report_${cleanVendorName}_${reportNumber}.pdf`;
}

/**
 * Download PDF blob as file
 */
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
