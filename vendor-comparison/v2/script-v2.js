import { vendorsData, calculateCost, sortVendors } from '../shared/vendors-data.js';

let currentVendors = [...vendorsData];
let customDiscounts = {};
let myVendorIds = new Set([1, 4, 5, 13, 19, 20]); // Example "my vendors"
let currentRetailPrice = 250;
let currentView = 'grid';
let currentQuickViewVendor = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('gridView').classList.add('active');
  updateCalculations();
});

function updateCalculations() {
  currentRetailPrice = parseFloat(document.getElementById('retailPrice').value) || 250;
  renderVendors();
  updateBestDealBanner();
}

function renderVendors() {
  const container = document.getElementById('vendorsGrid');
  const sortBy = document.getElementById('sortBy').value;
  const showOnlyMyVendors = document.getElementById('myVendors').checked;
  
  let filteredVendors = currentVendors;
  if (showOnlyMyVendors) {
    filteredVendors = currentVendors.filter(vendor => myVendorIds.has(vendor.id));
  }
  
  const sortedVendors = sortVendors(filteredVendors, sortBy, currentRetailPrice, customDiscounts);
  
  // Find best price for highlighting
  const costs = sortedVendors.map(vendor => calculateCost(currentRetailPrice, vendor.discount, customDiscounts[vendor.id]));
  const bestCost = Math.min(...costs);
  
  // Update container class for view type
  container.className = currentView === 'grid' ? 'vendors-grid' : 'vendors-list';
  
  container.innerHTML = sortedVendors.map(vendor => {
    const effectiveDiscount = customDiscounts[vendor.id] ?? vendor.discount;
    const cost = calculateCost(currentRetailPrice, vendor.discount, customDiscounts[vendor.id]);
    const savings = currentRetailPrice - cost;
    const isBestPrice = cost === bestCost;
    const isMyVendor = myVendorIds.has(vendor.id);
    const hasCustomDiscount = customDiscounts[vendor.id] !== undefined;
    
    return `
      <div class="vendor-card ${isBestPrice ? 'best-price' : ''} ${isMyVendor ? 'my-vendor' : ''} ${currentView === 'list' ? 'list-view' : ''}">
        <div class="vendor-header">
          <div>
            <div class="vendor-name">${vendor.name}</div>
            <div class="vendor-badges">
              ${vendor.freeShipping ? '<span class="badge badge-shipping">Free Shipping</span>' : ''}
              <span class="badge badge-terms">${vendor.paymentTerms}</span>
              ${hasCustomDiscount ? '<span class="custom-discount-indicator">Custom Rate</span>' : ''}
            </div>
          </div>
        </div>
        
        <div class="pricing-section">
          <div class="price-row">
            <span class="price-label">Discount:</span>
            <span class="price-value">${effectiveDiscount}%</span>
          </div>
          <div class="price-row">
            <span class="price-label">Your Cost:</span>
            <span class="price-value cost-value">$${cost.toFixed(2)}</span>
          </div>
          <div class="price-row">
            <span class="price-label">You Save:</span>
            <span class="price-value savings-value">$${savings.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="order-info">
          <div class="info-item">
            <div class="info-label">Min Order</div>
            <div class="info-value">$${vendor.minOrder}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Payment</div>
            <div class="info-value">${vendor.paymentTerms}</div>
          </div>
        </div>
        
        <div class="card-actions">
          <button class="btn btn-secondary btn-card" onclick="showQuickView(${vendor.id})">Quick View</button>
          <button class="btn btn-primary btn-card" onclick="showCustomDiscount(${vendor.id})">Custom Rate</button>
        </div>
      </div>
    `;
  }).join('');
}

function updateBestDealBanner() {
  const sortBy = document.getElementById('sortBy').value;
  const showOnlyMyVendors = document.getElementById('myVendors').checked;
  
  let filteredVendors = currentVendors;
  if (showOnlyMyVendors) {
    filteredVendors = currentVendors.filter(vendor => myVendorIds.has(vendor.id));
  }
  
  const sortedVendors = sortVendors(filteredVendors, 'cost', currentRetailPrice, customDiscounts);
  const bestVendor = sortedVendors[0];
  const bestCost = calculateCost(currentRetailPrice, bestVendor.discount, customDiscounts[bestVendor.id]);
  
  document.getElementById('bestDealVendor').textContent = bestVendor.name;
  document.getElementById('bestDealPrice').textContent = bestCost.toFixed(2);
}

function sortVendors() {
  renderVendors();
  updateBestDealBanner();
}

function filterVendors() {
  renderVendors();
  updateBestDealBanner();
}

function switchView(view) {
  currentView = view;
  
  // Update button states
  document.getElementById('gridView').classList.toggle('active', view === 'grid');
  document.getElementById('listView').classList.toggle('active', view === 'list');
  
  renderVendors();
}

function showQuickView(vendorId) {
  const vendor = currentVendors.find(v => v.id === vendorId);
  currentQuickViewVendor = vendor;
  const modal = document.getElementById('quickViewModal');
  const modalName = document.getElementById('quickViewVendorName');
  const modalContent = document.getElementById('quickViewContent');
  
  modalName.textContent = vendor.name;
  
  const effectiveDiscount = customDiscounts[vendor.id] ?? vendor.discount;
  const cost = calculateCost(currentRetailPrice, vendor.discount, customDiscounts[vendor.id]);
  const savings = currentRetailPrice - cost;
  const isMyVendor = myVendorIds.has(vendor.id);
  
  modalContent.innerHTML = `
    <div class="quick-view-pricing">
      <div class="pricing-card">
        <div class="pricing-value">${effectiveDiscount}%</div>
        <div class="pricing-label">Your Discount</div>
      </div>
      <div class="pricing-card">
        <div class="pricing-value">$${cost.toFixed(2)}</div>
        <div class="pricing-label">Your Cost</div>
      </div>
      <div class="pricing-card">
        <div class="pricing-value">$${savings.toFixed(2)}</div>
        <div class="pricing-label">You Save</div>
      </div>
      <div class="pricing-card">
        <div class="pricing-value">$${vendor.minOrder}</div>
        <div class="pricing-label">Min Order</div>
      </div>
    </div>
    
    <div style="display: flex; gap: 15px; margin: 20px 0;">
      ${vendor.freeShipping ? '<span class="badge badge-success">Free Shipping</span>' : '<span class="badge badge-info">Paid Shipping</span>'}
      ${isMyVendor ? '<span class="badge badge-success">My Vendor</span>' : ''}
      ${customDiscounts[vendor.id] ? '<span class="badge" style="background: #ff9800; color: white;">Custom Discount</span>' : ''}
    </div>
    
    <div class="contact-info">
      <h4>Contact Information</h4>
      <div class="contact-row">
        <span>Rep Name:</span>
        <span><strong>${vendor.contact.rep}</strong></span>
      </div>
      <div class="contact-row">
        <span>Phone:</span>
        <span>${vendor.contact.phone}</span>
      </div>
      <div class="contact-row">
        <span>Email:</span>
        <span>${vendor.contact.email}</span>
      </div>
      <div class="contact-row">
        <span>Payment Terms:</span>
        <span>${vendor.paymentTerms}</span>
      </div>
    </div>
  `;
  
  modal.classList.add('active');
}

function closeQuickView() {
  document.getElementById('quickViewModal').classList.remove('active');
  currentQuickViewVendor = null;
}

function showCustomDiscount(vendorId = null) {
  const vendor = vendorId ? currentVendors.find(v => v.id === vendorId) : currentQuickViewVendor;
  if (!vendor) return;
  
  const modal = document.getElementById('discountModal');
  const vendorName = document.getElementById('customVendorName');
  const discountInput = document.getElementById('customDiscount');
  
  vendorName.textContent = vendor.name;
  discountInput.value = customDiscounts[vendor.id] || vendor.discount;
  
  modal.classList.add('active');
  modal.dataset.vendorId = vendor.id;
  
  // Close quick view modal if it's open
  closeQuickView();
}

function closeDiscountModal() {
  document.getElementById('discountModal').classList.remove('active');
}

function saveCustomDiscount() {
  const modal = document.getElementById('discountModal');
  const vendorId = parseInt(modal.dataset.vendorId);
  const newDiscount = parseFloat(document.getElementById('customDiscount').value);
  
  if (newDiscount >= 0 && newDiscount <= 100) {
    customDiscounts[vendorId] = newDiscount;
    closeDiscountModal();
    renderVendors();
    updateBestDealBanner();
  } else {
    alert('Please enter a discount between 0 and 100');
  }
}

function resetDiscount() {
  const modal = document.getElementById('discountModal');
  const vendorId = parseInt(modal.dataset.vendorId);
  const vendor = currentVendors.find(v => v.id === vendorId);
  
  delete customDiscounts[vendorId];
  document.getElementById('customDiscount').value = vendor.discount;
  closeDiscountModal();
  renderVendors();
  updateBestDealBanner();
}

function contactVendor() {
  if (!currentQuickViewVendor) return;
  
  const vendor = currentQuickViewVendor;
  const subject = encodeURIComponent(`Inquiry about frame pricing - ${vendor.name}`);
  const body = encodeURIComponent(`Hello ${vendor.contact.rep},\n\nI'm interested in learning more about your frame pricing and would like to discuss potential partnership opportunities.\n\nBest regards`);
  
  window.open(`mailto:${vendor.contact.email}?subject=${subject}&body=${body}`);
}

// Global functions
window.updateCalculations = updateCalculations;
window.sortVendors = sortVendors;
window.filterVendors = filterVendors;
window.switchView = switchView;
window.showQuickView = showQuickView;
window.closeQuickView = closeQuickView;
window.showCustomDiscount = showCustomDiscount;
window.closeDiscountModal = closeDiscountModal;
window.saveCustomDiscount = saveCustomDiscount;
window.resetDiscount = resetDiscount;
window.contactVendor = contactVendor;