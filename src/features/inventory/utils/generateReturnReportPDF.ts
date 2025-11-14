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

interface ColumnWidths {
  brand: number;
  model: number;
  color: number;
  size: number;
  qty: number;
}

interface ColumnConstraints {
  min: number;
  max: number;
  priority: number; // Lower number = higher priority to maintain width
}

interface CellContent {
  text: string;
  lines: string[];
  height: number;
}

export async function generateReturnReportPDF(
  items: InventoryItem[],
  metadata: ReportMetadata,
  options?: { debug?: boolean }
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

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Measure optimal column widths based on actual content
   */
  const measureColumnWidths = (items: InventoryItem[], doc: jsPDF): ColumnWidths => {
    // Define constraints for each column
    const constraints: Record<keyof ColumnWidths, ColumnConstraints> = {
      brand: { min: 0.7, max: 1.5, priority: 2 },
      model: { min: 0.8, max: 2.0, priority: 1 },
      color: { min: 0.9, max: 2.5, priority: 1 },
      size: { min: 0.5, max: 1.2, priority: 3 },
      qty: { min: 0.5, max: 0.7, priority: 4 }
    };

    const fontSize = 9;
    const headerFontSize = 8;
    const padding = 0.24; // Padding per column (0.12 on each side)

    // Track maximum width needed for each column
    const maxWidths: ColumnWidths = {
      brand: 0,
      model: 0,
      color: 0,
      size: 0,
      qty: 0
    };

    // Measure header widths first
    doc.setFontSize(headerFontSize);
    doc.setFont('helvetica', 'bold');
    maxWidths.brand = Math.max(maxWidths.brand, doc.getTextWidth('BRAND'));
    maxWidths.model = Math.max(maxWidths.model, doc.getTextWidth('MODEL'));
    maxWidths.color = Math.max(maxWidths.color, doc.getTextWidth('COLOR'));
    maxWidths.size = Math.max(maxWidths.size, doc.getTextWidth('SIZE'));
    maxWidths.qty = Math.max(maxWidths.qty, doc.getTextWidth('QTY'));

    // Measure content widths
    items.forEach(item => {
      // Brand (bold)
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'bold');
      const brandWidth = doc.getTextWidth(item.brand || 'N/A');
      maxWidths.brand = Math.max(maxWidths.brand, brandWidth);

      // Model, Color, Size (normal)
      doc.setFont('helvetica', 'normal');
      const modelWidth = doc.getTextWidth(item.model || 'N/A');
      maxWidths.model = Math.max(maxWidths.model, modelWidth);

      const colorWidth = doc.getTextWidth(item.color || 'N/A');
      maxWidths.color = Math.max(maxWidths.color, colorWidth);

      const sizeText = item.full_size || item.size || 'N/A';
      const sizeWidth = doc.getTextWidth(sizeText);
      maxWidths.size = Math.max(maxWidths.size, sizeWidth);

      // Quantity (bold)
      doc.setFont('helvetica', 'bold');
      const qtyWidth = doc.getTextWidth(String(item.quantity));
      maxWidths.qty = Math.max(maxWidths.qty, qtyWidth);
    });

    // Add padding to each measurement
    Object.keys(maxWidths).forEach(key => {
      maxWidths[key as keyof ColumnWidths] += padding;
    });

    // Apply constraints (min/max)
    Object.keys(maxWidths).forEach(key => {
      const k = key as keyof ColumnWidths;
      maxWidths[k] = Math.max(constraints[k].min, Math.min(constraints[k].max, maxWidths[k]));
    });

    // Calculate total width needed
    const totalNeeded = Object.values(maxWidths).reduce((sum, w) => sum + w, 0);
    const availableWidth = contentWidth - 0.3; // Account for table margins

    // If we fit perfectly or have extra space, distribute proportionally
    if (totalNeeded <= availableWidth) {
      const extraSpace = availableWidth - totalNeeded;

      // Distribute extra space to columns that can grow (not at max), prioritizing lower priority columns
      const canGrow = Object.entries(maxWidths).filter(([key, width]) =>
        width < constraints[key as keyof ColumnWidths].max
      );

      if (canGrow.length > 0) {
        const spacePerColumn = extraSpace / canGrow.length;
        canGrow.forEach(([key]) => {
          const k = key as keyof ColumnWidths;
          maxWidths[k] = Math.min(constraints[k].max, maxWidths[k] + spacePerColumn);
        });
      }
    } else {
      // Need to shrink columns - prioritize by priority value (higher priority = shrink first)
      const deficit = totalNeeded - availableWidth;

      // Sort columns by priority (descending) to shrink lower priority columns first
      const sortedColumns = (Object.keys(maxWidths) as Array<keyof ColumnWidths>)
        .sort((a, b) => constraints[b].priority - constraints[a].priority);

      let remainingDeficit = deficit;

      for (const key of sortedColumns) {
        if (remainingDeficit <= 0) break;

        const currentWidth = maxWidths[key];
        const minWidth = constraints[key].min;
        const canShrink = currentWidth - minWidth;

        if (canShrink > 0) {
          const shrinkAmount = Math.min(canShrink, remainingDeficit);
          maxWidths[key] = currentWidth - shrinkAmount;
          remainingDeficit -= shrinkAmount;
        }
      }
    }

    return maxWidths;
  };

  /**
   * Wrap text to fit within a specific width
   */
  const wrapText = (text: string, maxWidth: number, doc: jsPDF): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = doc.getTextWidth(testLine);

      if (testWidth <= maxWidth - 0.24) { // Account for padding
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });

    if (currentLine) lines.push(currentLine);
    return lines.length > 0 ? lines : [text];
  };

  /**
   * Prepare cell content with wrapping if needed
   */
  const prepareCellContent = (
    text: string,
    maxWidth: number,
    doc: jsPDF,
    fontSize: number
  ): CellContent => {
    doc.setFontSize(fontSize);
    const lines = wrapText(text, maxWidth, doc);
    const lineHeight = 0.15; // inches per line
    const height = lines.length * lineHeight;

    return { text, lines, height };
  };

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
  // ITEMS SECTION - Clean table layout with dynamic column widths
  // ============================================================================

  // Sort items by brand, then model (before measuring)
  const sortedItems = [...items].sort((a, b) => {
    const brandCompare = (a.brand || '').localeCompare(b.brand || '');
    if (brandCompare !== 0) return brandCompare;
    return (a.model || '').localeCompare(b.model || '');
  });

  // Calculate optimal column widths based on content
  const colWidths = measureColumnWidths(sortedItems, doc);

  // Debug logging (optional)
  if (options?.debug) {
    console.log('=== PDF Column Width Calculation ===');
    console.log('Available width:', contentWidth - 0.3);
    console.log('Calculated widths:', colWidths);
    console.log('Total width used:', Object.values(colWidths).reduce((sum, w) => sum + w, 0));
    console.log('Item count:', sortedItems.length);
  }

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

  // Draw items in table rows with dynamic heights
  sortedItems.forEach((item, index) => {
    // Prepare all cell contents with wrapping
    const cellFontSize = 9;
    doc.setFont('helvetica', 'bold');
    const brandContent = prepareCellContent(item.brand || 'N/A', colWidths.brand, doc, cellFontSize);

    doc.setFont('helvetica', 'normal');
    const modelContent = prepareCellContent(item.model || 'N/A', colWidths.model, doc, cellFontSize);
    const colorContent = prepareCellContent(item.color || 'N/A', colWidths.color, doc, cellFontSize);
    const sizeContent = prepareCellContent(item.full_size || item.size || 'N/A', colWidths.size, doc, cellFontSize);

    doc.setFont('helvetica', 'bold');
    const qtyContent = prepareCellContent(String(item.quantity), colWidths.qty, doc, cellFontSize);

    // Calculate row height based on tallest cell
    const maxCellHeight = Math.max(
      brandContent.height,
      modelContent.height,
      colorContent.height,
      sizeContent.height,
      qtyContent.height
    );
    const rowHeight = Math.max(0.28, maxCellHeight + 0.13); // Minimum height + padding

    // Check if we need a new page
    if (yPosition + rowHeight > pageHeight - 1.8) {
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

      // Redraw table header on new page
      setColor(colors.dark, 'fill');
      doc.roundedRect(tableX, yPosition - 0.15, contentWidth - 0.3, 0.25, 0.04, 0.04, 'F');

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
    }

    // Alternating row colors for readability
    if (index % 2 === 0) {
      setColor(colors.background, 'fill');
      doc.rect(tableX, yPosition - 0.18, contentWidth - 0.3, rowHeight, 'F');
    }

    // Row border for definition
    setColor(colors.border, 'draw');
    doc.setLineWidth(0.005);
    doc.line(tableX, yPosition + rowHeight - 0.18, tableX + contentWidth - 0.3, yPosition + rowHeight - 0.18);

    // Helper to render multi-line cell content
    const renderCell = (content: CellContent, x: number, fontStyle: string, color: number[], align?: string) => {
      doc.setFont('helvetica', fontStyle);
      setColor(color, 'text');
      doc.setFontSize(cellFontSize);

      const lineHeight = 0.15;
      let lineY = yPosition;

      content.lines.forEach((line, lineIndex) => {
        if (align === 'right') {
          doc.text(line, x, lineY, { align: 'right' });
        } else {
          doc.text(line, x, lineY);
        }
        lineY += lineHeight;
      });
    };

    // Render all cells
    let colX = tableX + 0.12;
    renderCell(brandContent, colX, 'bold', colors.dark);

    colX += colWidths.brand;
    renderCell(modelContent, colX, 'normal', colors.text);

    colX += colWidths.model;
    renderCell(colorContent, colX, 'normal', colors.text);

    colX += colWidths.color;
    renderCell(sizeContent, colX, 'normal', colors.text);

    colX += colWidths.size;
    renderCell(qtyContent, colX + colWidths.qty - 0.12, 'bold', colors.accent, 'right');

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
