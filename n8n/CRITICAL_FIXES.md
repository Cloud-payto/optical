# Critical Bug Fixes - Quick Reference Guide

**Workflow:** Optical Inventory Software
**Priority:** IMMEDIATE
**Estimated Time:** 1-2 hours

---

## Fix 1: Cache to Catalog Hardcoded Vendor Names (8 nodes)

### Cache to Catalog1 (Safilo)
**Location:** Node → Parameters → Body Parameters → vendorName

**Change:**
```
FROM: "Modern Optical"
TO:   "Safilo"
```

---

### Cache to Catalog2 (Luxottica)
**Change:**
```
FROM: "Modern Optical"
TO:   "Luxottica"
```

---

### Cache to Catalog3 (Etnia Barcelona)
**Change:**
```
FROM: "Modern Optical"
TO:   "Etnia Barcelona"
```

---

### Cache to Catalog4 (Ideal Optics)
**Change:**
```
FROM: "Modern Optical"
TO:   "Ideal Optics"
```

---

### Cache to Catalog5 (L'amy America)
**Change:**
```
FROM: "Modern Optical"
TO:   "L'amyamerica"
```

**Note:** Use "L'amyamerica" (one word, lowercase 'a') to match other nodes

---

### Cache to Catalog6 (Kenmark)
**Change:**
```
FROM: "Modern Optical"
TO:   "kenmark"
```

**Note:** Use lowercase "kenmark" to match other nodes

---

### Cache to Catalog7 (Europa)
**Change:**
```
FROM: "Modern Optical"
TO:   "Europa"
```

---

### Cache to Catalog8 (Marchon)
**Change:**
```
FROM: "Modern Optical"
TO:   "Marchon"
```

---

## Fix 2: Bulk-Add8 Wrong Vendor

### Bulk-Add8 (Marchon)
**Location:** Node → Parameters → Body Parameters → vendor

**Change:**
```
FROM: "kenmark"
TO:   "Marchon"
```

---

## Fix 3: Prepare Email Europa Wrong Check Catalog Reference

### Prepare Email Europa
**Location:** Node → Parameters → JavaScript Code

**Find this line:**
```javascript
const checkCatalogResult = $('Check Catalog').item.json;
```

**Replace with:**
```javascript
const checkCatalogResult = $('Check Catalog7').item.json;
```

---

## Fix 4: Clear Vision Empty Branch

### Option A: Remove Clear Vision from Switch (Recommended)
1. Open Switch node
2. Find Clear Vision rule (output 7)
3. Delete the rule
4. Save

### Option B: Implement Clear Vision Branch
1. Create parse_ClearVision node
2. Create Check Catalog9 node
3. Create Prepare Email Clear Vision node
4. Create Create Email Record9 node
5. Create Bulk-Add9 node
6. Create Cache to Catalog9 node
7. Connect all nodes in sequence
8. Connect Switch output 7 to parse_ClearVision

**Recommendation:** Use Option A unless you have Clear Vision data ready

---

## Fix 5: Delete Dead Node

### Detect Vendor (Code Node)
**Location:** Position (-208, 1568) - disconnected node

**Action:**
1. Find the disconnected "Detect Vendor" code node
2. Right-click → Delete
3. This is NOT the "Detect Vendor (API)" HTTP node - don't delete that one!

---

## Verification Checklist

After making all fixes, verify:

- [ ] Cache to Catalog1 → vendorName = "Safilo"
- [ ] Cache to Catalog2 → vendorName = "Luxottica"
- [ ] Cache to Catalog3 → vendorName = "Etnia Barcelona"
- [ ] Cache to Catalog4 → vendorName = "Ideal Optics"
- [ ] Cache to Catalog5 → vendorName = "L'amyamerica"
- [ ] Cache to Catalog6 → vendorName = "kenmark"
- [ ] Cache to Catalog7 → vendorName = "Europa"
- [ ] Cache to Catalog8 → vendorName = "Marchon"
- [ ] Bulk-Add8 → vendor = "Marchon"
- [ ] Prepare Email Europa → references Check Catalog7
- [ ] Clear Vision branch handled (removed or implemented)
- [ ] Dead "Detect Vendor" code node deleted

---

## Testing After Fixes

Test each vendor with a sample email:

1. **Modern Optical** - Should work (was already correct)
2. **Safilo** - Verify items cached as "Safilo"
3. **Luxottica** - Verify items cached as "Luxottica"
4. **Europa** - Verify uses correct catalog data and caches as "Europa"
5. **Etnia Barcelona** - Verify items cached as "Etnia Barcelona"
6. **Ideal Optics** - Verify items cached as "Ideal Optics"
7. **L'amy America** - Verify items cached as "L'amyamerica"
8. **Kenmark** - Verify items cached as "kenmark"
9. **Marchon** - Verify vendor is "Marchon" (not "kenmark") and cached correctly

---

## Expected Results After Fixes

- All vendors will cache items with correct vendor name
- Marchon orders will have correct vendor
- Europa will use its own catalog data (not Modern Optical's)
- No errors from Clear Vision branch
- Workflow canvas is cleaner (no dead node)

---

## Backup Recommendation

Before making changes:
1. Export current workflow to file
2. Save as `n8n_workflow_BACKUP_2025-12-08.json`
3. Make fixes
4. Export fixed workflow as `n8n_workflow_FIXED.json`
5. Compare files to verify all changes

---

## Next Steps After Critical Fixes

Once critical bugs are fixed, consider:

1. **Rename nodes** for clarity (see WORKFLOW_ANALYSIS.md section 3.2)
2. **Add error handling** to HTTP nodes (see WORKFLOW_ANALYSIS.md section 3.3)
3. **Add retry logic** to prevent transient failures
4. **Add logging** for better observability
5. **Refactor to sub-workflows** to eliminate duplication (see WORKFLOW_ANALYSIS.md section 3.1)
