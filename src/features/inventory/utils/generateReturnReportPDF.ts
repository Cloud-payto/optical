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
  const margin = 0.6;
  const contentWidth = pageWidth - (margin * 2);

  // Professional color palette
  const colors = {
    primary: [99, 102, 241],      // Purple - primary brand
    primaryLight: [224, 231, 255], // Light purple
    accent: [79, 70, 229],         // Deeper purple for contrast
    dark: [30, 41, 59],            // Slate for headings
    text: [51, 65, 85],            // Slate for body text
    textLight: [100, 116, 139],    // Light slate for secondary text
    border: [226, 232, 240],       // Light border
    background: [248, 250, 252],   // Subtle background
    white: [255, 255, 255]
  };

  let yPosition = margin;

  // Helper to set color
  const setColor = (color: number[], type: 'fill' | 'draw' | 'text') => {
    if (type === 'fill') doc.setFillColor(...color);
    else if (type === 'draw') doc.setDrawColor(...color);
    else doc.setTextColor(...color);
  };

  // Helper function to add text with color support
  const addText = (text: string, x: number, y: number, options: any = {}) => {
    doc.setFontSize(options.fontSize || 10);
    doc.setFont(options.font || 'helvetica', options.style || 'normal');
    if (options.color) setColor(options.color, 'text');
    doc.text(text, x, y, options);
    if (options.color) setColor(colors.text, 'text'); // Reset to default
  };

  // ============================================================================
  // HEADER SECTION - Professional masthead with brand accent
  // ============================================================================

  // Top accent bar - thin modern line
  setColor(colors.primary, 'fill');
  doc.rect(0, 0, pageWidth, 0.15, 'F');

  // Header background - subtle gradient effect using layered rectangles
  setColor(colors.white, 'fill');
  doc.rect(margin, 0.15, contentWidth, 1.4, 'F');
  setColor(colors.primaryLight, 'fill');
  doc.rect(margin, 0.15, contentWidth, 0.05, 'F');

  yPosition = 0.45;

  // Document title - bold and prominent
  addText('RETURN AUTHORIZATION REQUEST', margin, yPosition, {
    fontSize: 20,
    style: 'bold',
    color: colors.dark
  });
  yPosition += 0.3;

  // Subtitle line for context
  addText('Vendor Return Request for Authorization', margin, yPosition, {
    fontSize: 9,
    color: colors.textLight
  });

  // Right-aligned report metadata box
  const metaBoxX = pageWidth - margin - 2.2;
  const metaBoxY = 0.35;
  const metaBoxWidth = 2.2;
  const metaBoxHeight = 0.85;

  // Metadata box with border
  setColor(colors.border, 'draw');
  setColor(colors.background, 'fill');
  doc.setLineWidth(0.01);
  doc.roundedRect(metaBoxX, metaBoxY, metaBoxWidth, metaBoxHeight, 0.05, 0.05, 'FD');

  // Report metadata content
  let metaY = metaBoxY + 0.22;
  addText('REPORT NUMBER', metaBoxX + 0.15, metaY, {
    fontSize: 7,
    style: 'bold',
    color: colors.textLight
  });
  metaY += 0.14;
  addText(metadata.reportNumber, metaBoxX + 0.15, metaY, {
    fontSize: 11,
    style: 'bold',
    color: colors.primary
  });
  metaY += 0.22;
  addText('DATE ISSUED', metaBoxX + 0.15, metaY, {
    fontSize: 7,
    style: 'bold',
    color: colors.textLight
  });
  metaY += 0.14;
  addText(metadata.date, metaBoxX + 0.15, metaY, {
    fontSize: 9,
    color: colors.text
  });

  yPosition = 1.7;

  // ============================================================================
  // VENDOR INFORMATION SECTION - Prominent and clear
  // ============================================================================

  // Section divider line
  setColor(colors.border, 'draw');
  doc.setLineWidth(0.015);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 0.35;

  // Vendor information card
  const vendorCardHeight = metadata.accountNumber ? 0.85 : 0.68;
  setColor(colors.primaryLight, 'fill');
  setColor(colors.primary, 'draw');
  doc.setLineWidth(0.02);
  doc.roundedRect(margin, yPosition, contentWidth, vendorCardHeight, 0.08, 0.08, 'FD');

  let vendorY = yPosition + 0.25;

  // Vendor label
  addText('VENDOR', margin + 0.25, vendorY, {
    fontSize: 8,
    style: 'bold',
    color: colors.accent,
    letterSpacing: 0.05
  });
  vendorY += 0.18;

  // Vendor name - large and prominent
  addText(metadata.vendorName.toUpperCase(), margin + 0.25, vendorY, {
    fontSize: 14,
    style: 'bold',
    color: colors.dark
  });

  // Account number if available - right side
  if (metadata.accountNumber) {
    const accountX = pageWidth - margin - 0.25;
    let accountY = yPosition + 0.25;
    addText('ACCOUNT NUMBER', accountX, accountY, {
      fontSize: 8,
      style: 'bold',
      color: colors.accent,
      align: 'right'
    });
    accountY += 0.18;
    addText(metadata.accountNumber, accountX, accountY, {
      fontSize: 12,
      style: 'bold',
      color: colors.dark,
      align: 'right'
    });
  }

  yPosition += vendorCardHeight + 0.45;

  // ============================================================================
  // ITEMS SECTION - Clean table layout
  // ============================================================================

  // Section header
  addText('ITEMS REQUESTED FOR RETURN', margin, yPosition, {
    fontSize: 11,
    style: 'bold',
    color: colors.dark
  });
  yPosition += 0.08;

  // Decorative underline
  setColor(colors.primary, 'draw');
  doc.setLineWidth(0.025);
  doc.line(margin, yPosition, margin + 1.8, yPosition);
  yPosition += 0.35;

  // Table header
  const tableX = margin + 0.15;
  const colWidths = {
    brand: 1.2,    // Reduced from 1.4
    model: 1.5,    // Reduced from 1.8
    color: 1.4,    // Increased from 1.2
    size: 1.1,     // Increased from 0.9
    qty: 0.9       // Increased from 0.7 and moved to right
  };

  // Header background
  setColor(colors.dark, 'fill');
  doc.roundedRect(tableX, yPosition - 0.15, contentWidth - 0.3, 0.25, 0.04, 0.04, 'F');

  // Column headers
  let colX = tableX + 0.12;
  addText('BRAND', colX, yPosition, {
    fontSize: 8,
    style: 'bold',
    color: colors.white
  });
  colX += colWidths.brand;
  addText('MODEL', colX, yPosition, {
    fontSize: 8,
    style: 'bold',
    color: colors.white
  });
  colX += colWidths.model;
  addText('COLOR', colX, yPosition, {
    fontSize: 8,
    style: 'bold',
    color: colors.white
  });
  colX += colWidths.color;
  addText('SIZE', colX, yPosition, {
    fontSize: 8,
    style: 'bold',
    color: colors.white
  });
  colX += colWidths.size;
  addText('QTY', colX + colWidths.qty - 0.12, yPosition, {
    fontSize: 8,
    style: 'bold',
    color: colors.white,
    align: 'right'
  });

  yPosition += 0.32;

  // Sort items by brand, then model
  const sortedItems = [...items].sort((a, b) => {
    const brandCompare = (a.brand || '').localeCompare(b.brand || '');
    if (brandCompare !== 0) return brandCompare;
    return (a.model || '').localeCompare(b.model || '');
  });

  // Draw items in table rows
  sortedItems.forEach((item, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 1.8) {
      doc.addPage();
      yPosition = margin;

      // Add page header
      addText('RETURN AUTHORIZATION REQUEST (CONTINUED)', margin, yPosition, {
        fontSize: 10,
        color: colors.textLight
      });
      addText(`Report: ${metadata.reportNumber}`, pageWidth - margin, yPosition, {
        fontSize: 10,
        color: colors.textLight,
        align: 'right'
      });
      yPosition += 0.4;
    }

    // Alternating row colors for readability
    const rowHeight = 0.28;
    if (index % 2 === 0) {
      setColor(colors.background, 'fill');
      doc.rect(tableX, yPosition - 0.18, contentWidth - 0.3, rowHeight, 'F');
    }

    // Row border for definition
    setColor(colors.border, 'draw');
    doc.setLineWidth(0.005);
    doc.line(tableX, yPosition + 0.1, tableX + contentWidth - 0.3, yPosition + 0.1);

    // Item data
    let colX = tableX + 0.12;
    addText(item.brand || 'N/A', colX, yPosition, {
      fontSize: 9,
      style: 'bold',
      color: colors.dark
    });
    colX += colWidths.brand;
    addText(item.model || 'N/A', colX, yPosition, {
      fontSize: 9,
      color: colors.text
    });
    colX += colWidths.model;
    addText(item.color || 'N/A', colX, yPosition, {
      fontSize: 9,
      color: colors.text
    });
    colX += colWidths.color;
    addText(item.full_size || item.size || 'N/A', colX, yPosition, {
      fontSize: 9,
      color: colors.text
    });
    colX += colWidths.size;
    addText(String(item.quantity), colX + colWidths.qty - 0.12, yPosition, {
      fontSize: 9,
      style: 'bold',
      color: colors.accent,
      align: 'right'
    });

    yPosition += rowHeight;
  });

  // Bottom border of table
  setColor(colors.dark, 'draw');
  doc.setLineWidth(0.02);
  doc.line(tableX, yPosition, tableX + contentWidth - 0.3, yPosition);
  yPosition += 0.25;

  // ============================================================================
  // SUMMARY SECTION
  // ============================================================================

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  // Summary box
  const summaryBoxX = pageWidth - margin - 2.5;
  setColor(colors.accent, 'fill');
  doc.roundedRect(summaryBoxX, yPosition, 2.5, 0.45, 0.06, 0.06, 'F');

  addText('TOTAL ITEMS TO RETURN', summaryBoxX + 0.2, yPosition + 0.2, {
    fontSize: 8,
    style: 'bold',
    color: colors.white
  });
  addText(String(totalQuantity), summaryBoxX + 2.1, yPosition + 0.35, {
    fontSize: 16,
    style: 'bold',
    color: colors.white,
    align: 'right'
  });

  yPosition += 0.7;

  // ============================================================================
  // FOOTER SECTION - Instructions and contact
  // ============================================================================

  // Check if we need space for footer
  if (yPosition > pageHeight - 1.5) {
    doc.addPage();
    yPosition = margin;
  }

  // Footer divider
  setColor(colors.border, 'draw');
  doc.setLineWidth(0.015);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 0.35;

  // Return instructions header
  addText('RETURN INSTRUCTIONS', margin, yPosition, {
    fontSize: 10,
    style: 'bold',
    color: colors.dark
  });
  yPosition += 0.25;

  // Instructions text
  const instructionText = 'Please review the items listed above and provide return authorization along with shipping instructions. ' +
    'Once approved, we will process the return according to your specifications.';

  const instructionLines = doc.splitTextToSize(instructionText, contentWidth - 0.4);
  addText(instructionLines, margin + 0.2, yPosition, {
    fontSize: 9,
    color: colors.text
  });
  yPosition += (instructionLines.length * 0.18) + 0.3;

  // Contact information box
  setColor(colors.background, 'fill');
  setColor(colors.border, 'draw');
  doc.setLineWidth(0.01);
  doc.roundedRect(margin, yPosition, contentWidth, 0.45, 0.05, 0.05, 'FD');

  yPosition += 0.2;
  addText('CONTACT INFORMATION', margin + 0.2, yPosition, {
    fontSize: 8,
    style: 'bold',
    color: colors.textLight
  });
  yPosition += 0.18;
  addText(metadata.contactEmail, margin + 0.2, yPosition, {
    fontSize: 10,
    color: colors.primary
  });

  // ============================================================================
  // PAGE FOOTER - Branding element
  // ============================================================================

  const footerY = pageHeight - 0.35;
  setColor(colors.border, 'draw');
  doc.setLineWidth(0.005);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  addText('Return Authorization Request', margin, footerY + 0.15, {
    fontSize: 7,
    color: colors.textLight
  });
  addText(`Generated: ${new Date().toLocaleDateString('en-US')}`, pageWidth - margin, footerY + 0.15, {
    fontSize: 7,
    color: colors.textLight,
    align: 'right'
  });

  // Bottom accent bar
  setColor(colors.primary, 'fill');
  doc.rect(0, pageHeight - 0.15, pageWidth, 0.15, 'F');

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
