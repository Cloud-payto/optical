# Data-Demo Attributes Guide

## Overview

For the Driver.js demo to properly highlight elements, you need to add `data-demo` attributes to specific UI components. This guide shows exactly where to add each attribute.

---

## Required Attributes

### 1. **Orders Page** (`/frames/orders`)

#### Pending Orders Tab
**Location:** `/src/features/orders/OrdersPage.tsx` or similar
**Element:** The tab button for "Pending Orders"
```tsx
<button
  data-demo="pending-orders-tab"
  onClick={() => setActiveTab('pending')}
  className="..."
>
  Pending Orders
</button>
```

---

### 2. **Inventory Page** (`/frames/inventory`)

#### Pending Inventory Tab
**Location:** `/src/features/inventory/InventoryPage.tsx` or similar
**Element:** The tab button for "Pending" inventory
```tsx
<button
  data-demo="inventory-pending-tab"
  onClick={() => setActiveTab('pending')}
  className="..."
>
  Pending
</button>
```

---

### 3. **Brands/Vendors Page** (`/brands`)

#### Vendor Card
**Location:** `/src/pages/BrandsCostsPage.tsx` or `/src/components/VendorCard.tsx`
**Element:** The card displaying "Modern Optical" vendor information
```tsx
<div
  data-demo="vendor-card"
  className="vendor-card ..."
>
  <h3>Modern Optical</h3>
  <p>Account: #MO-12345</p>
  {/* ... rest of vendor card content */}
</div>
```

#### Vendor Pricing Section
**Location:** Inside the vendor card or separate pricing component
**Element:** The section showing brand pricing data
```tsx
<div
  data-demo="vendor-pricing"
  className="pricing-section ..."
>
  <div className="brand-pricing">
    <h4>Modern Optics Collection</h4>
    <p>Wholesale: $85</p>
    <p>Your Cost: $55</p>
    <p>MSRP: $150</p>
  </div>
</div>
```

---

### 4. **Calculator Page** (`/calculator`)

#### Company/Vendor Dropdown
**Location:** `/src/pages/CalculatorPage.tsx` or `/src/components/ProfitCalculator.tsx`
**Element:** The dropdown selector for choosing a vendor/company
```tsx
<select
  data-demo="company-dropdown"
  name="company"
  value={selectedCompany}
  onChange={handleCompanyChange}
  className="..."
>
  <option value="">Select Company</option>
  <option value="modern-optical">Modern Optical</option>
  {/* ... more options */}
</select>

{/* OR if using a custom dropdown component: */}
<Dropdown
  data-demo="company-dropdown"
  placeholder="Select Company"
  options={companies}
  onChange={handleCompanyChange}
/>
```

#### Brand Dropdown
**Location:** Same file as company dropdown
**Element:** The dropdown selector for choosing a brand
```tsx
<select
  data-demo="brand-dropdown"
  name="brand"
  value={selectedBrand}
  onChange={handleBrandChange}
  className="..."
>
  <option value="">Select Brand</option>
  <option value="modern-collection">Modern Optics Collection</option>
  {/* ... more options */}
</select>

{/* OR if using a custom dropdown component: */}
<Dropdown
  data-demo="brand-dropdown"
  placeholder="Select Brand"
  options={brands}
  onChange={handleBrandChange}
/>
```

#### Cost Fields Container
**Location:** The section containing auto-populated cost inputs
**Element:** Wrap all the cost input fields (Wholesale Cost, Your Cost, Tariff Tax)
```tsx
<div data-demo="cost-fields" className="cost-inputs-section ...">
  <div className="input-group">
    <label>Wholesale Cost</label>
    <input type="number" value={wholesaleCost} readOnly />
  </div>

  <div className="input-group">
    <label>Your Cost</label>
    <input type="number" value={yourCost} readOnly />
  </div>

  <div className="input-group">
    <label>Tariff Tax</label>
    <input type="number" value={tariffTax} readOnly />
  </div>
</div>
```

#### Retail Price Input
**Location:** The retail price input field
**Element:** The input for entering retail price
```tsx
<input
  data-demo="retail-price"
  type="number"
  name="retailPrice"
  value={retailPrice}
  onChange={handleRetailPriceChange}
  placeholder="Enter retail price"
  className="..."
/>

{/* OR if wrapped in a label/container, apply to the container: */}
<div data-demo="retail-price" className="retail-price-input-group ...">
  <label>Retail Price</label>
  <input
    type="number"
    value={retailPrice}
    onChange={handleRetailPriceChange}
  />
</div>
```

#### Profit Display Section
**Location:** The section showing calculated profit and margin
**Element:** The container displaying profit calculations
```tsx
<div data-demo="profit-display" className="profit-results ...">
  <div className="profit-item">
    <span className="label">Total Profit:</span>
    <span className="value">${profit.toFixed(2)}</span>
  </div>

  <div className="profit-item">
    <span className="label">Profit Margin:</span>
    <span className="value">{margin.toFixed(1)}%</span>
  </div>

  {/* Visual indicator (optional) */}
  <div className={`margin-indicator ${getMarginClass(margin)}`}>
    {margin > 50 ? 'Excellent' : margin > 30 ? 'Good' : 'Low'} Margin
  </div>
</div>
```

---

## Best Practices

### 1. **Placement Guidelines**

- Add attributes to **parent containers** when highlighting a group of elements
- Add to **interactive elements** (buttons, inputs, dropdowns) for specific actions
- Ensure elements are **visible and not hidden** by default

### 2. **Naming Conventions**

- Use kebab-case: `data-demo="my-element-name"`
- Be descriptive: `data-demo="vendor-card"` not `data-demo="card"`
- Use consistent patterns: `*-tab`, `*-dropdown`, `*-display`

### 3. **Testing**

After adding attributes, test that Driver.js can find them:

```javascript
// Browser console test
document.querySelector('[data-demo="pending-orders-tab"]'); // Should return the element
```

### 4. **Dynamic Content**

For content loaded dynamically (e.g., vendor cards fetched from API):

```tsx
{vendors.map(vendor => (
  <div
    key={vendor.id}
    data-demo={vendor.id === 'demo-modern-optical' ? 'vendor-card' : undefined}
    className="..."
  >
    {/* Only add data-demo to the demo vendor */}
  </div>
))}
```

---

## Verification Checklist

Use this checklist to verify all attributes are added:

- [ ] `data-demo="pending-orders-tab"` - Orders page pending tab
- [ ] `data-demo="inventory-pending-tab"` - Inventory pending tab
- [ ] `data-demo="vendor-card"` - Modern Optical vendor card
- [ ] `data-demo="vendor-pricing"` - Brand pricing section
- [ ] `data-demo="company-dropdown"` - Calculator company selector
- [ ] `data-demo="brand-dropdown"` - Calculator brand selector
- [ ] `data-demo="cost-fields"` - Calculator cost inputs section
- [ ] `data-demo="retail-price"` - Calculator retail price input
- [ ] `data-demo="profit-display"` - Calculator profit results

---

## Troubleshooting

### Element Not Found
If Driver.js can't find an element:

1. **Check spelling** - Attribute must match exactly
2. **Verify visibility** - Element must be rendered in DOM
3. **Check timing** - For dynamic content, ensure element exists before demo starts
4. **Inspect element** - Use browser DevTools to confirm attribute is present

### Element Highlighted Incorrectly
If the wrong element is highlighted:

1. **Check uniqueness** - `data-demo` values should be unique
2. **Verify parent/child** - Ensure attribute is on the right element, not nested child
3. **Test selector** - Use `document.querySelector('[data-demo="name"]')` to verify

---

## Example Implementation

Here's a complete example for the Calculator page:

```tsx
// CalculatorPage.tsx

export const CalculatorPage = () => {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [wholesaleCost, setWholesaleCost] = useState(0);
  const [yourCost, setYourCost] = useState(0);
  const [tariffTax, setTariffTax] = useState(0);
  const [retailPrice, setRetailPrice] = useState(0);
  const [profit, setProfit] = useState(0);
  const [margin, setMargin] = useState(0);

  return (
    <div className="calculator-page">
      <h1>Profit Calculator</h1>

      {/* Company Dropdown - Step 7 */}
      <div className="input-group">
        <label>Company/Vendor</label>
        <select
          data-demo="company-dropdown"
          value={selectedCompany}
          onChange={handleCompanyChange}
        >
          <option value="">Select Company</option>
          <option value="modern-optical">Modern Optical</option>
        </select>
      </div>

      {/* Brand Dropdown - Step 8 */}
      <div className="input-group">
        <label>Brand</label>
        <select
          data-demo="brand-dropdown"
          value={selectedBrand}
          onChange={handleBrandChange}
        >
          <option value="">Select Brand</option>
          <option value="modern-collection">Modern Optics Collection</option>
        </select>
      </div>

      {/* Cost Fields - Step 9 */}
      <div data-demo="cost-fields" className="cost-fields-section">
        <div className="input-group">
          <label>Wholesale Cost</label>
          <input type="number" value={wholesaleCost} readOnly />
        </div>
        <div className="input-group">
          <label>Your Cost</label>
          <input type="number" value={yourCost} readOnly />
        </div>
        <div className="input-group">
          <label>Tariff Tax</label>
          <input type="number" value={tariffTax} readOnly />
        </div>
      </div>

      {/* Retail Price - Step 10 */}
      <div data-demo="retail-price" className="input-group">
        <label>Retail Price</label>
        <input
          type="number"
          value={retailPrice}
          onChange={(e) => setRetailPrice(Number(e.target.value))}
        />
      </div>

      {/* Profit Display - Step 11 */}
      <div data-demo="profit-display" className="profit-results">
        <h3>Profit Breakdown</h3>
        <div className="result-row">
          <span>Total Profit:</span>
          <span>${profit.toFixed(2)}</span>
        </div>
        <div className="result-row">
          <span>Profit Margin:</span>
          <span>{margin.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};
```

---

## Next Steps

1. **Add all attributes** using this guide
2. **Test each element** in browser console
3. **Start demo** from Dashboard and verify each step highlights correctly
4. **Adjust positioning** if needed (Driver.js handles this automatically)
5. **Update documentation** if you change any component structures

---

## Support

If you encounter issues:
- Review the Driver.js documentation: https://driverjs.com/docs/
- Check `/src/demo/demoSteps.ts` for step configuration
- Inspect browser console for Driver.js warnings
