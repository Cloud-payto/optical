import { vendorsData, calculateCost, sortVendors } from '../shared/vendors-data.js';

let currentVendors = [...vendorsData];
let customDiscounts = {};
let myVendorIds = new Set([1, 4, 5, 13, 19, 20]); // Example "my vendors"
let selectedForComparison = new Set();
let currentRetailPrice = 250;

// Initialize the table
document.addEventListener('DOMContentLoaded', function() {
  updateCalculations();
});

function updateCalculations() {
  currentRetailPrice = parseFloat(document.getElementById('retailPrice').value) || 250;
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById('vendorTableBody');
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
  
  tbody.innerHTML = sortedVendors.map(vendor => {
    const effectiveDiscount = customDiscounts[vendor.id] ?? vendor.discount;
    const cost = calculateCost(currentRetailPrice, vendor.discount, customDiscounts[vendor.id]);
    const savings = currentRetailPrice - cost;
    const isBestPrice = cost === bestCost;
    const isMyVendor = myVendorIds.has(vendor.id);
    
    return `
      <tr class="${isBestPrice ? 'best-price' : ''}">
        <td class="compare-column">
          <input type="checkbox" class="compare-checkbox" ${selectedForComparison.has(vendor.id) ? 'checked' : ''} 
                 onchange="toggleComparison(${vendor.id})">
        </td>
        <td>
          <strong>${vendor.name}</strong>
          ${isMyVendor ? '<span class="badge badge-success">My Vendor</span>' : ''}
          ${customDiscounts[vendor.id] ? '<span class="custom-discount-indicator" title="Custom discount applied"></span>' : ''}
        </td>
        <td>${effectiveDiscount}%</td>
        <td class="cost-cell">$${cost.toFixed(2)}</td>
        <td class="savings-cell">$${savings.toFixed(2)}</td>
        <td>$${vendor.minOrder}</td>
        <td>${vendor.paymentTerms}</td>
        <td>${vendor.freeShipping ? '<span class="badge badge-success">Free</span>' : 'Paid'}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-secondary btn-small" onclick="showVendorDetails(${vendor.id})">Details</button>
            <button class="btn btn-secondary btn-small" onclick="showCustomDiscount(${vendor.id})">Custom %</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  updateComparisonPanel();
}

function sortTable() {
  renderTable();
}

function filterVendors() {
  renderTable();
}

function toggleCompareMode() {
  const compareMode = document.getElementById('compareMode').checked;
  const compareColumn = document.querySelector('.compare-column');
  const compareCheckboxes = document.querySelectorAll('.compare-checkbox');
  const comparisonPanel = document.getElementById('comparisonPanel');
  
  if (compareMode) {
    compareColumn.style.display = 'table-cell';
    compareCheckboxes.forEach(cb => cb.parentElement.style.display = 'table-cell');
    comparisonPanel.classList.add('active');
  } else {
    compareColumn.style.display = 'none';
    compareCheckboxes.forEach(cb => cb.parentElement.style.display = 'none');
    comparisonPanel.classList.remove('active');
    selectedForComparison.clear();
  }
}

function toggleComparison(vendorId) {
  if (selectedForComparison.has(vendorId)) {
    selectedForComparison.delete(vendorId);
  } else {
    if (selectedForComparison.size < 3) {
      selectedForComparison.add(vendorId);
    } else {
      alert('You can compare up to 3 vendors at a time');
      event.target.checked = false;
      return;
    }
  }
  updateComparisonPanel();
}

function updateComparisonPanel() {
  const content = document.getElementById('comparisonContent');
  if (selectedForComparison.size === 0) {
    content.innerHTML = '<p>Select up to 3 vendors to compare</p>';
    return;
  }
  
  const compareVendors = currentVendors.filter(v => selectedForComparison.has(v.id));
  
  content.innerHTML = compareVendors.map(vendor => {
    const effectiveDiscount = customDiscounts[vendor.id] ?? vendor.discount;
    const cost = calculateCost(currentRetailPrice, vendor.discount, customDiscounts[vendor.id]);
    const savings = currentRetailPrice - cost;
    
    return `
      <div class="comparison-item">
        <div class="comparison-vendor-name">${vendor.name}</div>
        <div class="comparison-details">
          <span class="comparison-label">Your Cost:</span>
          <span class="comparison-value">$${cost.toFixed(2)}</span>
          <span class="comparison-label">Discount:</span>
          <span class="comparison-value">${effectiveDiscount}%</span>
          <span class="comparison-label">Savings:</span>
          <span class="comparison-value">$${savings.toFixed(2)}</span>
          <span class="comparison-label">Min Order:</span>
          <span class="comparison-value">$${vendor.minOrder}</span>
        </div>
      </div>
    `;
  }).join('');
}

function clearComparison() {
  selectedForComparison.clear();
  document.querySelectorAll('.compare-checkbox').forEach(cb => cb.checked = false);
  updateComparisonPanel();
}

function showVendorDetails(vendorId) {
  const vendor = currentVendors.find(v => v.id === vendorId);
  const modal = document.getElementById('vendorModal');
  const modalName = document.getElementById('modalVendorName');
  const modalContent = document.getElementById('modalContent');
  
  modalName.textContent = vendor.name;
  
  const effectiveDiscount = customDiscounts[vendor.id] ?? vendor.discount;
  const cost = calculateCost(currentRetailPrice, vendor.discount, customDiscounts[vendor.id]);
  
  modalContent.innerHTML = `
    <div class="vendor-details">
      <div class="detail-section">
        <h4>Pricing Information</h4>
        <div class="detail-row">
          <span class="detail-label">Standard Discount:</span>
          <span class="detail-value">${vendor.discount}%</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Your Discount:</span>
          <span class="detail-value">${effectiveDiscount}%</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Your Cost:</span>
          <span class="detail-value">$${cost.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="detail-section">
        <h4>Order Requirements</h4>
        <div class="detail-row">
          <span class="detail-label">Minimum Order:</span>
          <span class="detail-value">$${vendor.minOrder}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Payment Terms:</span>
          <span class="detail-value">${vendor.paymentTerms}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Free Shipping:</span>
          <span class="detail-value">${vendor.freeShipping ? 'Yes' : 'No'}</span>
        </div>
      </div>
      
      <div class="detail-section">
        <h4>Contact Information</h4>
        <div class="detail-row">
          <span class="detail-label">Rep Name:</span>
          <span class="detail-value">${vendor.contact.rep}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Phone:</span>
          <span class="detail-value">${vendor.contact.phone}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${vendor.contact.email}</span>
        </div>
      </div>
    </div>
  `;
  
  modal.classList.add('active');
}

function closeModal() {
  document.getElementById('vendorModal').classList.remove('active');
}

function showCustomDiscount(vendorId) {
  const vendor = currentVendors.find(v => v.id === vendorId);
  const modal = document.getElementById('discountModal');
  const vendorName = document.getElementById('customVendorName');
  const discountInput = document.getElementById('customDiscount');
  
  vendorName.textContent = vendor.name;
  discountInput.value = customDiscounts[vendorId] || vendor.discount;
  
  modal.classList.add('active');
  modal.dataset.vendorId = vendorId;
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
    renderTable();
  } else {
    alert('Please enter a discount between 0 and 100');
  }
}

// Global functions
window.updateCalculations = updateCalculations;
window.sortTable = sortTable;
window.filterVendors = filterVendors;
window.toggleCompareMode = toggleCompareMode;
window.toggleComparison = toggleComparison;
window.clearComparison = clearComparison;
window.showVendorDetails = showVendorDetails;
window.closeModal = closeModal;
window.showCustomDiscount = showCustomDiscount;
window.closeDiscountModal = closeDiscountModal;
window.saveCustomDiscount = saveCustomDiscount;