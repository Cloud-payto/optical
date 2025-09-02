# Vendor Comparison Tool - 3 Design Variations

This project contains three different design approaches for an optical software vendor comparison page that helps practices compare frame pricing across multiple vendors.

## Features Included

- **Price Calculation**: Input retail price and see calculated costs based on vendor discounts
- **Custom Discounts**: Override standard rates with negotiated pricing
- **Sorting & Filtering**: Multiple ways to organize and filter vendor data
- **Responsive Design**: Works on desktop and mobile devices
- **Vendor Management**: Track "my vendors" vs all available vendors
- **Contact Information**: Access to vendor rep details

## Version Descriptions

### Version 1: Data Table Focus (`/v1/`)
- **Design**: Clean, sortable data table as the primary interface
- **Key Features**:
  - Sticky header with price input
  - Side-by-side comparison (up to 3 vendors)
  - Best price highlighting
  - Quick compare checkboxes
  - Detailed vendor info modals

### Version 2: Card Grid Layout (`/v2/`)
- **Design**: Responsive card grid with visual indicators
- **Key Features**:
  - Card-based vendor display
  - Best deal banner at top
  - Grid/list view toggle
  - Visual badges (free shipping, my vendors)
  - Quick view modals with contact info

### Version 3: Interactive Comparison Tool (`/v3/`)
- **Design**: Split layout with sidebar filters and comparison area
- **Key Features**:
  - Left sidebar with filters and vendor list
  - Dynamic comparison table (up to 8 vendors)
  - Price comparison charts (bar, line, radar)
  - Summary statistics
  - CSV export functionality

## How to Use

1. Open any version by navigating to its `index.html` file
2. Enter a retail frame price (default: $250)
3. Select/filter vendors based on your needs
4. Compare pricing and vendor terms
5. Set custom discount rates for negotiated pricing

## Data Structure

Each vendor includes:
- Name and contact information
- Standard discount percentage
- Minimum order requirements
- Payment terms
- Shipping policies
- Representative details

## Technical Notes

- Pure HTML, CSS, and JavaScript (no build process required)
- Shared data and utilities in `/shared/` folder
- Chart.js integration in Version 3 for visual comparisons
- Responsive design for all screen sizes
- Local data storage for custom discounts (session-based)

## Sample Vendors

Includes 25+ optical vendors with realistic pricing data:
- Luxottica, Safilo, Marchon, Essilor
- Ray-Ban, Oakley, Maui Jim
- Designer brands (Gucci, Prada, Tom Ford)
- Direct-to-consumer (Warby Parker)
- Sports brands (Nike Vision, Adidas)

Each design variation offers a different user experience while maintaining the same core functionality for vendor price comparison.