# File Refactoring Plan

## Problem

**Inventory.tsx:** 2,978 lines, 166KB, 27 useState hooks
**supabase.js:** 2,000+ lines, 71KB

These files are too large, making them:
- Hard to understand
- Difficult to maintain
- Slow to load in IDE
- Prone to merge conflicts
- Hard to test

---

## Goal

Split into smaller, focused modules that are:
- Easy to understand (< 300 lines per file)
- Single responsibility
- Easy to test
- Fast to load

---

## Refactoring Strategy for Inventory.tsx

### Current Structure (2,978 lines):
```
Inventory.tsx
├── Imports (9 lines)
├── Helper functions (20 lines)
├── State (27 useState hooks - 40 lines!)
├── Data fetching (200 lines)
├── Event handlers (500 lines)
├── Orders Tab rendering (800 lines)
├── Inventory Tab rendering (800 lines)
├── Archive Tab rendering (600 lines)
└── Modals & UI (200 lines)
```

### New Structure (7 files, ~400 lines each):
```
src/features/inventory/
├── InventoryPage.tsx (300 lines)
│   ├── Main layout
│   ├── Tab switching
│   ├── Search bar
│   └── Forwarding email display
│
├── hooks/
│   ├── useInventoryData.ts (200 lines)
│   │   ├── Data fetching
│   │   ├── Loading/error states
│   │   └── Data refresh
│   │
│   ├── useInventoryState.ts (150 lines)
│   │   ├── All useState hooks
│   │   └── State management logic
│   │
│   └── useInventoryActions.ts (300 lines)
│       ├── Delete handlers
│       ├── Archive handlers
│       ├── Confirm handlers
│       └── Toast notifications
│
├── components/
│   ├── OrdersTab.tsx (400 lines)
│   │   ├── Pending orders view
│   │   ├── Confirmed orders view
│   │   └── Order actions
│   │
│   ├── InventoryTab.tsx (400 lines)
│   │   ├── Pending inventory view
│   │   ├── Current inventory view
│   │   ├── Sold inventory view
│   │   └── Inventory actions
│   │
│   ├── ArchiveTab.tsx (400 lines)
│   │   ├── By vendor view
│   │   ├── By brand view
│   │   └── Archive actions
│   │
│   ├── OrderCard.tsx (150 lines)
│   │   └── Single order display
│   │
│   ├── InventoryCard.tsx (150 lines)
│   │   └── Single inventory item display
│   │
│   └── SearchBar.tsx (100 lines)
│       └── Search & filter UI
│
├── utils/
│   ├── vendorHelpers.ts (50 lines)
│   │   └── extractVendorFromEmail, etc.
│   │
│   └── dataTransforms.ts (100 lines)
│       └── Data filtering, grouping, sorting
│
└── types.ts (100 lines)
    └── TypeScript interfaces
```

---

## Refactoring Strategy for supabase.js

### Current Structure (2,000+ lines):
```
server/lib/supabase.js
├── Supabase client init (20 lines)
├── Email operations (300 lines)
├── Inventory operations (600 lines)
├── Order operations (400 lines)
├── Vendor operations (300 lines)
├── Brand operations (200 lines)
├── Stats operations (200 lines)
└── Helper functions (100 lines)
```

### New Structure (8 files, ~250 lines each):
```
server/lib/
├── supabase.js (100 lines)
│   ├── Client initialization
│   ├── Error handler
│   └── Re-exports from operations
│
├── database/
│   ├── emailOperations.js (300 lines)
│   │   ├── saveEmail
│   │   ├── getEmailsByAccount
│   │   ├── updateEmailWithParsedData
│   │   └── deleteEmail
│   │
│   ├── inventoryOperations.js (600 lines)
│   │   ├── getInventoryByAccount
│   │   ├── bulkInsert
│   │   ├── updateInventoryItem
│   │   ├── deleteInventoryItem
│   │   ├── archiveInventoryItem
│   │   └── markItemAsSold
│   │
│   ├── orderOperations.js (400 lines)
│   │   ├── createOrder
│   │   ├── getOrdersByAccount
│   │   ├── updateOrder
│   │   ├── confirmPendingOrder
│   │   └── deleteOrder
│   │
│   ├── vendorOperations.js (300 lines)
│   │   ├── getVendorByDomain
│   │   ├── getAllVendors
│   │   ├── createVendor
│   │   └── updateVendor
│   │
│   ├── brandOperations.js (200 lines)
│   │   ├── getBrandsByVendor
│   │   ├── createBrand
│   │   └── updateBrand
│   │
│   ├── statsOperations.js (200 lines)
│   │   ├── getDashboardStats
│   │   ├── getInventoryByVendor
│   │   └── getTopBrands
│   │
│   └── catalogOperations.js (200 lines)
│       ├── checkCatalog
│       ├── saveToCatalog
│       └── updateCatalogItem
│
└── utils/
    ├── queryBuilder.js (100 lines)
    └── validators.js (100 lines)
```

---

## Migration Plan

### Phase 1: Create New Structure (No Breaking Changes)
1. Create new directories
2. Extract hooks from Inventory.tsx
3. Extract components from Inventory.tsx
4. Keep old file working

### Phase 2: Update Inventory.tsx to Use New Structure
1. Import new hooks
2. Import new components
3. Remove extracted code
4. Test thoroughly

### Phase 3: Cleanup
1. Delete old commented code
2. Update imports in other files
3. Run tests
4. Commit

---

## Benefits After Refactoring

### Developer Experience:
- ✅ Faster IDE loading
- ✅ Easier to find code
- ✅ Better autocomplete
- ✅ Clearer git diffs

### Code Quality:
- ✅ Single responsibility principle
- ✅ Easier to test individual pieces
- ✅ Reduced coupling
- ✅ Better type safety

### Maintenance:
- ✅ Easier to add features
- ✅ Less merge conflicts
- ✅ Faster code reviews
- ✅ Simpler debugging

---

## Estimated Time

- **Inventory.tsx refactoring:** 3-4 hours
- **supabase.js refactoring:** 2-3 hours
- **Testing & cleanup:** 1 hour

**Total:** 6-8 hours

---

## Risk Mitigation

### To Avoid Breaking Changes:
1. Create new files alongside old ones
2. Keep old files until new ones are tested
3. Test each module as we extract it
4. Run full test suite after changes

### Rollback Plan:
1. Git commit before starting
2. Test at each step
3. If issues arise, revert to previous commit

---

## Next Steps

1. Create directory structure
2. Start with hooks (easiest to extract)
3. Move to components
4. Update main file
5. Test thoroughly
6. Repeat for supabase.js

---

**Status:** Ready to begin
**Priority:** High (improves maintainability significantly)
**Breaking Changes:** None (we'll preserve all functionality)
