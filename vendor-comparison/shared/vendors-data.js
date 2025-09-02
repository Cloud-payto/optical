// Sample vendor data for demonstration
export const vendorsData = [
  { id: 1, name: "Luxottica", discount: 45, minOrder: 500, paymentTerms: "NET 30", freeShipping: true, contact: { rep: "John Smith", phone: "555-0101", email: "john@luxottica.com" }},
  { id: 2, name: "Safilo", discount: 42, minOrder: 300, paymentTerms: "NET 30", freeShipping: false, contact: { rep: "Jane Doe", phone: "555-0102", email: "jane@safilo.com" }},
  { id: 3, name: "Marchon", discount: 40, minOrder: 400, paymentTerms: "NET 45", freeShipping: true, contact: { rep: "Mike Johnson", phone: "555-0103", email: "mike@marchon.com" }},
  { id: 4, name: "Essilor", discount: 38, minOrder: 250, paymentTerms: "NET 30", freeShipping: true, contact: { rep: "Sarah Williams", phone: "555-0104", email: "sarah@essilor.com" }},
  { id: 5, name: "VSP", discount: 43, minOrder: 350, paymentTerms: "NET 30", freeShipping: false, contact: { rep: "Tom Brown", phone: "555-0105", email: "tom@vsp.com" }},
  { id: 6, name: "Zeiss", discount: 35, minOrder: 600, paymentTerms: "NET 60", freeShipping: true, contact: { rep: "Emily Davis", phone: "555-0106", email: "emily@zeiss.com" }},
  { id: 7, name: "Hoya", discount: 37, minOrder: 400, paymentTerms: "NET 30", freeShipping: false, contact: { rep: "David Lee", phone: "555-0107", email: "david@hoya.com" }},
  { id: 8, name: "Oakley", discount: 33, minOrder: 800, paymentTerms: "NET 45", freeShipping: true, contact: { rep: "Chris Martin", phone: "555-0108", email: "chris@oakley.com" }},
  { id: 9, name: "Ray-Ban", discount: 32, minOrder: 750, paymentTerms: "NET 30", freeShipping: true, contact: { rep: "Lisa Garcia", phone: "555-0109", email: "lisa@rayban.com" }},
  { id: 10, name: "Maui Jim", discount: 30, minOrder: 500, paymentTerms: "NET 30", freeShipping: false, contact: { rep: "Robert Taylor", phone: "555-0110", email: "robert@mauijim.com" }},
  { id: 11, name: "Costa", discount: 34, minOrder: 450, paymentTerms: "NET 30", freeShipping: true, contact: { rep: "Jennifer White", phone: "555-0111", email: "jennifer@costa.com" }},
  { id: 12, name: "Silhouette", discount: 36, minOrder: 550, paymentTerms: "NET 45", freeShipping: false, contact: { rep: "Kevin Anderson", phone: "555-0112", email: "kevin@silhouette.com" }},
  { id: 13, name: "Persol", discount: 39, minOrder: 400, paymentTerms: "NET 30", freeShipping: true, contact: { rep: "Amanda Thomas", phone: "555-0113", email: "amanda@persol.com" }},
  { id: 14, name: "Coach", discount: 41, minOrder: 600, paymentTerms: "NET 60", freeShipping: true, contact: { rep: "Brian Wilson", phone: "555-0114", email: "brian@coach.com" }},
  { id: 15, name: "Gucci", discount: 28, minOrder: 1000, paymentTerms: "NET 30", freeShipping: false, contact: { rep: "Michelle Clark", phone: "555-0115", email: "michelle@gucci.com" }},
  { id: 16, name: "Prada", discount: 29, minOrder: 900, paymentTerms: "NET 45", freeShipping: false, contact: { rep: "Steven Martinez", phone: "555-0116", email: "steven@prada.com" }},
  { id: 17, name: "Versace", discount: 27, minOrder: 1100, paymentTerms: "NET 30", freeShipping: true, contact: { rep: "Nancy Rodriguez", phone: "555-0117", email: "nancy@versace.com" }},
  { id: 18, name: "Tom Ford", discount: 25, minOrder: 1200, paymentTerms: "NET 60", freeShipping: false, contact: { rep: "Daniel Lopez", phone: "555-0118", email: "daniel@tomford.com" }},
  { id: 19, name: "Warby Parker", discount: 50, minOrder: 200, paymentTerms: "NET 30", freeShipping: true, contact: { rep: "Patricia Hill", phone: "555-0119", email: "patricia@warbyparker.com" }},
  { id: 20, name: "Flexon", discount: 44, minOrder: 350, paymentTerms: "NET 30", freeShipping: true, contact: { rep: "Mark Scott", phone: "555-0120", email: "mark@flexon.com" }},
  { id: 21, name: "Nike Vision", discount: 35, minOrder: 700, paymentTerms: "NET 45", freeShipping: false, contact: { rep: "Karen Green", phone: "555-0121", email: "karen@nikevision.com" }},
  { id: 22, name: "Adidas", discount: 36, minOrder: 650, paymentTerms: "NET 30", freeShipping: true, contact: { rep: "James Baker", phone: "555-0122", email: "james@adidas.com" }},
  { id: 23, name: "Carrera", discount: 38, minOrder: 450, paymentTerms: "NET 30", freeShipping: false, contact: { rep: "Betty Adams", phone: "555-0123", email: "betty@carrera.com" }},
  { id: 24, name: "Dior", discount: 26, minOrder: 1300, paymentTerms: "NET 60", freeShipping: true, contact: { rep: "Paul Wright", phone: "555-0124", email: "paul@dior.com" }},
  { id: 25, name: "Calvin Klein", discount: 40, minOrder: 500, paymentTerms: "NET 30", freeShipping: true, contact: { rep: "Linda Mitchell", phone: "555-0125", email: "linda@calvinklein.com" }}
];

// Function to calculate cost based on retail price and discount
export function calculateCost(retailPrice, discount, customDiscount = null) {
  const effectiveDiscount = customDiscount !== null ? customDiscount : discount;
  return retailPrice * (1 - effectiveDiscount / 100);
}

// Function to sort vendors
export function sortVendors(vendors, sortBy, retailPrice, customDiscounts = {}) {
  return [...vendors].sort((a, b) => {
    switch (sortBy) {
      case 'cost':
        const costA = calculateCost(retailPrice, a.discount, customDiscounts[a.id]);
        const costB = calculateCost(retailPrice, b.discount, customDiscounts[b.id]);
        return costA - costB;
      case 'discount':
        const discountA = customDiscounts[a.id] ?? a.discount;
        const discountB = customDiscounts[b.id] ?? b.discount;
        return discountB - discountA;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });
}

// Function to filter vendors by price range
export function filterByPriceRange(vendors, retailPrice, minCost, maxCost, customDiscounts = {}) {
  return vendors.filter(vendor => {
    const cost = calculateCost(retailPrice, vendor.discount, customDiscounts[vendor.id]);
    return (!minCost || cost >= minCost) && (!maxCost || cost <= maxCost);
  });
}