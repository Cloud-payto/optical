import { vendorsData, calculateCost, sortVendors, filterByPriceRange } from '../shared/vendors-data.js';

let currentVendors = [...vendorsData];
let customDiscounts = {};
let myVendorIds = new Set([1, 4, 5, 13, 19, 20]); // Example "my vendors"
let selectedVendors = new Set();
let currentRetailPrice = 250;
let priceChart = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  updateCalculations();
  initializeChart();
});

function updateCalculations() {
  currentRetailPrice = parseFloat(document.getElementById('retailPrice').value) || 250;
  applyFilters();
  updateComparison();
  updateSummary();
}

function applyFilters() {
  const showOnlyMyVendors = document.getElementById('myVendors').checked;
  const freeShippingOnly = document.getElementById('freeShipping').checked;
  const net30Only = document.getElementById('net30').checked;
  const minOrderFilter = document.getElementById('minOrderFilter').value;
  const minPrice = parseFloat(document.getElementById('minPrice').value);
  const maxPrice = parseFloat(document.getElementById('maxPrice').value);
  
  let filteredVendors = [...vendorsData];
  
  if (showOnlyMyVendors) {
    filteredVendors = filteredVendors.filter(vendor => myVendorIds.has(vendor.id));
  }
  
  if (freeShippingOnly) {
    filteredVendors = filteredVendors.filter(vendor => vendor.freeShipping);
  }
  
  if (net30Only) {
    filteredVendors = filteredVendors.filter(vendor => vendor.paymentTerms === 'NET 30');
  }
  
  if (minOrderFilter) {
    const maxOrder = parseInt(minOrderFilter);
    filteredVendors = filteredVendors.filter(vendor => vendor.minOrder <= maxOrder);
  }
  
  if (minPrice || maxPrice) {
    filteredVendors = filterByPriceRange(filteredVendors, currentRetailPrice, minPrice, maxPrice, customDiscounts);
  }
  
  currentVendors = filteredVendors;
  renderVendorList();
}

function renderVendorList() {
  const container = document.getElementById('vendorList');
  const sortedVendors = sortVendors(currentVendors, 'cost', currentRetailPrice, customDiscounts);
  
  container.innerHTML = sortedVendors.map(vendor => {
    const effectiveDiscount = customDiscounts[vendor.id] ?? vendor.discount;
    const cost = calculateCost(currentRetailPrice, vendor.discount, customDiscounts[vendor.id]);
    const isSelected = selectedVendors.has(vendor.id);
    const isMyVendor = myVendorIds.has(vendor.id);
    
    return `
      <div class="vendor-item ${isSelected ? 'selected' : ''} ${isMyVendor ? 'my-vendor' : ''}" 
           onclick="toggleVendorSelection(${vendor.id})">
        <div>
          <div class="vendor-name">${vendor.name}</div>
          <div class="vendor-discount">${effectiveDiscount}% discount</div>
        </div>
        <div class="vendor-cost">$${cost.toFixed(2)}</div>
      </div>
    `;
  }).join('');
}

function toggleVendorSelection(vendorId) {
  if (selectedVendors.has(vendorId)) {
    selectedVendors.delete(vendorId);
  } else {
    if (selectedVendors.size >= 8) {
      alert('You can compare up to 8 vendors at a time');
      return;
    }
    selectedVendors.add(vendorId);
  }
  
  renderVendorList();
  updateComparison();
  updateChart();
  updateSummary();
}

function updateComparison() {
  const tableBody = document.getElementById('comparisonTableBody');
  
  if (selectedVendors.size === 0) {
    tableBody.innerHTML = `
      <tr class="empty-state">
        <td colspan="8">
          <div class="empty-message">
            <div class="empty-icon">📊</div>
            <p>Select vendors from the sidebar to compare pricing</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  const compareVendors = currentVendors.filter(v => selectedVendors.has(v.id));
  const sortedVendors = sortVendors(compareVendors, 'cost', currentRetailPrice, customDiscounts);
  
  // Find best cost for highlighting
  const costs = sortedVendors.map(vendor => calculateCost(currentRetailPrice, vendor.discount, customDiscounts[vendor.id]));
  const bestCost = Math.min(...costs);
  
  tableBody.innerHTML = sortedVendors.map(vendor => {
    const effectiveDiscount = customDiscounts[vendor.id] ?? vendor.discount;
    const cost = calculateCost(currentRetailPrice, vendor.discount, customDiscounts[vendor.id]);
    const savings = currentRetailPrice - cost;
    const isBestCost = cost === bestCost;
    const hasCustomDiscount = customDiscounts[vendor.id] !== undefined;
    
    return `
      <tr class="${isBestCost ? 'cost-highlight' : ''} vendor-row-enter">
        <td>
          <strong>${vendor.name}</strong>
          ${myVendorIds.has(vendor.id) ? '<span class="badge badge-info">My Vendor</span>' : ''}
          ${hasCustomDiscount ? '<span class="custom-rate-indicator">Custom</span>' : ''}
        </td>
        <td>${effectiveDiscount}%</td>
        <td><strong>$${cost.toFixed(2)}</strong></td>
        <td>$${savings.toFixed(2)}</td>
        <td>$${vendor.minOrder}</td>
        <td>${vendor.paymentTerms}</td>
        <td>${vendor.freeShipping ? '<span class="badge badge-success">Free</span>' : 'Paid'}</td>
        <td>
          <div class="vendor-actions">
            <button class="btn btn-secondary btn-small" onclick="showCustomDiscount(${vendor.id})">Custom %</button>
            <button class="remove-btn" onclick="removeFromComparison(${vendor.id})">Remove</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function removeFromComparison(vendorId) {
  selectedVendors.delete(vendorId);
  renderVendorList();
  updateComparison();
  updateChart();
  updateSummary();
}

function clearAllComparison() {
  selectedVendors.clear();
  renderVendorList();
  updateComparison();
  updateChart();
  updateSummary();
}

function updateSummary() {
  const cards = document.querySelectorAll('.summary-card .summary-value');
  
  if (selectedVendors.size === 0) {
    cards.forEach(card => card.textContent = '-');
    return;
  }
  
  const compareVendors = currentVendors.filter(v => selectedVendors.has(v.id));
  const costs = compareVendors.map(vendor => calculateCost(currentRetailPrice, vendor.discount, customDiscounts[vendor.id]));
  
  const bestCost = Math.min(...costs);
  const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
  const maxSavings = Math.max(...costs.map(cost => currentRetailPrice - cost));
  
  cards[0].textContent = `$${bestCost.toFixed(2)}`;
  cards[1].textContent = `$${avgCost.toFixed(2)}`;
  cards[2].textContent = `$${maxSavings.toFixed(2)}`;
  cards[3].textContent = selectedVendors.size;
}

function initializeChart() {
  const ctx = document.getElementById('priceChart').getContext('2d');
  priceChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Your Cost',
        data: [],
        backgroundColor: 'rgba(76, 175, 80, 0.8)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Cost: $${context.parsed.y.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '$' + value;
            }
          }
        }
      }
    }
  });
}

function updateChart() {
  if (!priceChart) return;
  
  const chartType = document.getElementById('chartType').value;
  const compareVendors = currentVendors.filter(v => selectedVendors.has(v.id));
  const sortedVendors = sortVendors(compareVendors, 'cost', currentRetailPrice, customDiscounts);
  
  const labels = sortedVendors.map(v => v.name);
  const costs = sortedVendors.map(v => calculateCost(currentRetailPrice, v.discount, customDiscounts[v.id]));
  const savings = sortedVendors.map(v => currentRetailPrice - calculateCost(currentRetailPrice, v.discount, customDiscounts[v.id]));
  
  // Update chart type if changed
  if (priceChart.config.type !== chartType) {
    priceChart.destroy();
    const ctx = document.getElementById('priceChart').getContext('2d');
    
    let chartConfig = {
      type: chartType,
      data: {
        labels: labels,
        datasets: [{
          label: 'Your Cost',
          data: costs,
          backgroundColor: 'rgba(76, 175, 80, 0.8)',
          borderColor: 'rgba(76, 175, 80, 1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: chartType === 'radar'
          }
        },
        scales: chartType === 'radar' ? {} : {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '$' + value;
              }
            }
          }
        }
      }
    };
    
    if (chartType === 'radar') {
      chartConfig.data.datasets[0].fill = true;
      chartConfig.data.datasets[0].backgroundColor = 'rgba(76, 175, 80, 0.2)';
      chartConfig.options.scales = {
        r: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '$' + value;
            }
          }
        }
      };
    }
    
    priceChart = new Chart(ctx, chartConfig);
  } else {
    // Update existing chart data
    priceChart.data.labels = labels;
    priceChart.data.datasets[0].data = costs;
    priceChart.update();
  }
}

function showCustomDiscount(vendorId) {
  const vendor = currentVendors.find(v => v.id === vendorId);
  const modal = document.getElementById('discountModal');
  const vendorName = document.getElementById('customVendorName');
  const discountInput = document.getElementById('customDiscount');
  const notesInput = document.getElementById('discountNotes');
  
  vendorName.textContent = vendor.name;
  discountInput.value = customDiscounts[vendor.id] || vendor.discount;
  notesInput.value = '';
  
  modal.classList.add('active');
  modal.dataset.vendorId = vendor.id;
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
    renderVendorList();
    updateComparison();
    updateChart();
    updateSummary();
  } else {
    alert('Please enter a discount between 0 and 100');
  }
}

function resetToDefault() {
  const modal = document.getElementById('discountModal');
  const vendorId = parseInt(modal.dataset.vendorId);
  const vendor = currentVendors.find(v => v.id === vendorId);
  
  delete customDiscounts[vendorId];
  document.getElementById('customDiscount').value = vendor.discount;
  closeDiscountModal();
  renderVendorList();
  updateComparison();
  updateChart();
  updateSummary();
}

function exportComparison() {
  const compareVendors = currentVendors.filter(v => selectedVendors.has(v.id));
  const sortedVendors = sortVendors(compareVendors, 'cost', currentRetailPrice, customDiscounts);
  
  let csvContent = "Vendor,Discount %,Your Cost,Savings,Min Order,Payment Terms,Free Shipping\n";
  
  sortedVendors.forEach(vendor => {
    const effectiveDiscount = customDiscounts[vendor.id] ?? vendor.discount;
    const cost = calculateCost(currentRetailPrice, vendor.discount, customDiscounts[vendor.id]);
    const savings = currentRetailPrice - cost;
    
    csvContent += `"${vendor.name}",${effectiveDiscount}%,$${cost.toFixed(2)},$${savings.toFixed(2)},$${vendor.minOrder},${vendor.paymentTerms},${vendor.freeShipping ? 'Yes' : 'No'}\n`;
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vendor-comparison-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Global functions
window.updateCalculations = updateCalculations;
window.applyFilters = applyFilters;
window.toggleVendorSelection = toggleVendorSelection;
window.removeFromComparison = removeFromComparison;
window.clearAllComparison = clearAllComparison;
window.updateChart = updateChart;
window.showCustomDiscount = showCustomDiscount;
window.closeDiscountModal = closeDiscountModal;
window.saveCustomDiscount = saveCustomDiscount;
window.resetToDefault = resetToDefault;
window.exportComparison = exportComparison;