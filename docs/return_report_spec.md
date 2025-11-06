# Return Report PDF Specification

## Overview
Simplified return authorization request for vendors containing only essential information.

## PDF Layout

```
╔════════════════════════════════════════════════════════╗
║                                                        ║
║          RETURN AUTHORIZATION REQUEST                  ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  Report #: RR-2025-001                                ║
║  Date: October 25, 2025                               ║
║  Account #: 12345                                     ║
║  Vendor: Safilo Group                                 ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  ITEMS FOR RETURN                                      ║
║                                                        ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │  Brand: COSTA DEL MAR                           │ ║
║  │  Model: Fantail                                  │ ║
║  │  Color: Matte Black                              │ ║
║  │  Size: 59mm                                      │ ║
║  │  Quantity: 1                                     │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │  Brand: COSTA DEL MAR                           │ ║
║  │  Model: Blackfin                                 │ ║
║  │  Color: Gray                                     │ ║
║  │  Size: 62mm                                      │ ║
║  │  Quantity: 2                                     │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │  Brand: MAUI JIM                                │ ║
║  │  Model: Baby Beach                               │ ║
║  │  Color: Tortoise                                 │ ║
║  │  Size: 63mm                                      │ ║
║  │  Quantity: 1                                     │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                        ║
║  Total Items: 4                                        ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  Please provide return authorization and shipping      ║
║  instructions for the above items.                     ║
║                                                        ║
║  Contact: demo@optiprofit.com                          ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

## Data Fields

### Header Section
- **Report Number**: Auto-generated (RR-YYYY-NNN format)
- **Date**: Current date when PDF is generated
- **Account Number**: User's account number with this vendor
- **Vendor Name**: Vendor company name

### Items Section
Each item displays:
- **Brand**: Frame brand name
- **Model**: Frame model name
- **Color**: Frame color
- **Size**: Frame size
- **Quantity**: Number of units to return

### Footer Section
- **Total Items**: Sum of all quantities
- **Contact Email**: User's account email

## Grouping Logic
- Items are grouped by Brand
- Within each brand, items are sorted alphabetically by Model
- If generating "All Vendors" report, create separate PDFs per vendor

## File Naming
- Single vendor: `Return_Report_VendorName_RR-YYYY-NNN.pdf`
- Example: `Return_Report_Safilo_RR-2025-001.pdf`

## Implementation Notes
- Use jsPDF library for generation
- Keep design clean and minimal
- Use standard fonts (Helvetica/Arial)
- Page size: Letter (8.5" x 11")
- Margins: 0.5" all sides
