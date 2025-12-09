# N8N Workflow Deployment Checklist
**Date:** 2025-12-09
**File:** `/mnt/c/Users/payto/OneDrive/Desktop/Software/Opti-Profit/Version1/n8n/n8n_workflow_new.json`

## Pre-Deployment Checklist

### 1. Backup Current Workflow
- [ ] Export current workflow from n8n
- [ ] Save as `n8n_workflow_backup_YYYY-MM-DD.json`
- [ ] Store in safe location (external backup)

### 2. Verify API Endpoints
- [ ] `/api/emails/detect-vendor` - Vendor detection working
- [ ] `/api/parse/clean-email` - Email cleaning working
- [ ] `/api/parse/modernoptical` - Modern Optical parser working
- [ ] `/api/parse/safilo` - Safilo parser working
- [ ] `/api/parse/luxottica` - Luxottica parser working
- [ ] `/api/parse/europa` - Europa parser working
- [ ] `/api/parse/etnia` - Etnia Barcelona parser working
- [ ] `/api/parse/idealoptics` - Ideal Optics parser working
- [ ] `/api/parse/lamy` - L'amyamerica parser working
- [ ] `/api/parse/kenmark` - Kenmark parser working
- [ ] `/api/parse/marchon` - Marchon parser working
- [ ] `/api/catalog/check` - Catalog check working
- [ ] `/api/enrich/modernoptical` - Modern Optical enrichment working
- [ ] `/api/enrich/idealoptics` - Ideal Optics enrichment working
- [ ] `/api/emails/create` - Email record creation working
- [ ] `/api/inventory/bulk-add` - Bulk-add working
- [ ] `/api/catalog/cache` - Catalog cache working

### 3. Verify Supabase Connection
- [ ] Supabase credentials valid (ID: TXCUnZqEhts5gkjI)
- [ ] `emails` table exists and accessible
- [ ] Test insert to `emails` table works

### 4. Prepare Test Emails
Collect sample emails for testing:
- [ ] Modern Optical (with enrichment)
- [ ] Safilo (ideally with PDF, but HTML ok for now)
- [ ] Luxottica
- [ ] Europa
- [ ] Etnia Barcelona
- [ ] Ideal Optics (with enrichment)
- [ ] L'amyamerica
- [ ] Kenmark
- [ ] Marchon
- [ ] Unknown vendor (test fallback)
- [ ] Zoho forwarded email
- [ ] Gmail forwarded email
- [ ] Outlook forwarded email

## Deployment Steps

### Step 1: Import New Workflow
1. [ ] Open n8n interface
2. [ ] Click "Add Workflow" or "Import"
3. [ ] Upload `/mnt/c/Users/payto/OneDrive/Desktop/Software/Opti-Profit/Version1/n8n/n8n_workflow_new.json`
4. [ ] Verify all nodes imported correctly
5. [ ] Check that webhook path is: `9f96a3ec-cf85-40f4-9bc9-338424768726`

### Step 2: Verify Node Configuration
Walk through each node:
- [ ] **Webhook** - HTTP Method: POST, Path correct
- [ ] **Extract Account ID** - Code looks correct
- [ ] **Detect Vendor (API)** - URL correct, retry enabled
- [ ] **Clean Email** - URL correct, continue on fail enabled
- [ ] **Format API Response** - Code looks correct
- [ ] **Load Vendor Config** - All 9 vendors present
- [ ] **Validate Vendor Config** - Code looks correct
- [ ] **Route by Vendor Type** - Switch rules correct
- [ ] **Parse Vendor Email** - Dynamic URL correct
- [ ] **Check Catalog** - URL correct, dynamic vendor
- [ ] **Prepare Email Data** - Code correct, DYNAMIC vendors
- [ ] **If cached** - Condition correct
- [ ] **Enrich** - Dynamic URL, continue on fail
- [ ] **Merge Enrichment Results** - Code correct
- [ ] **Create Email Record** - URL correct, parallel execution
- [ ] **Bulk-Add Items** - URL correct, parallel execution
- [ ] **Cache to Catalog** - URL correct, parallel execution
- [ ] **Merge Results** - Code correct
- [ ] **Handle Unknown Vendor** - Supabase config correct

### Step 3: Verify Connections
- [ ] All nodes properly connected
- [ ] No disconnected nodes
- [ ] Parallel connections correct (Create/Bulk-Add/Cache)
- [ ] Unknown vendor path connected to Supabase
- [ ] Enrichment path properly connected

### Step 4: Test in n8n (Manual Execution)
Execute workflow manually with test data:
- [ ] Modern Optical email → Success, enrichment triggered
- [ ] Luxottica email → Success, no enrichment
- [ ] Marchon email → Success, vendor = "Marchon" (not "kenmark")
- [ ] Unknown vendor → Routes to Supabase, logged correctly

### Step 5: Test Webhook
1. [ ] Activate workflow
2. [ ] Note webhook URL
3. [ ] Send POST request with test email
4. [ ] Verify workflow executes
5. [ ] Check database for results

## Testing Checklist

### Functional Tests

#### Modern Optical
- [ ] Email parsed correctly
- [ ] Items extracted
- [ ] Catalog check performed
- [ ] Enrichment triggered (if items need UPC)
- [ ] Email record created with vendor = "Modern Optical"
- [ ] Items added with vendor = "Modern Optical"
- [ ] Cached with vendorName = "Modern Optical" ✅ (Bug fix verified)

#### Safilo
- [ ] Email parsed correctly
- [ ] Items extracted
- [ ] Catalog check performed
- [ ] Email record created with vendor = "Safilo"
- [ ] Items added with vendor = "Safilo"
- [ ] Cached with vendorName = "Safilo" ✅ (Bug fix verified)

#### Luxottica
- [ ] Email parsed correctly
- [ ] Items extracted
- [ ] Catalog check performed
- [ ] Email record created with vendor = "Luxottica"
- [ ] Items added with vendor = "Luxottica"
- [ ] Cached with vendorName = "Luxottica" ✅ (Bug fix verified)

#### Europa
- [ ] Email parsed correctly
- [ ] Items extracted
- [ ] Catalog check performed (single node, no wrong reference)
- [ ] Email record created with vendor = "Europa"
- [ ] Items added with vendor = "Europa"
- [ ] Cached with vendorName = "Europa" ✅ (Bug fix verified)

#### Etnia Barcelona
- [ ] Email parsed correctly
- [ ] Items extracted
- [ ] Catalog check performed
- [ ] Email record created with vendor = "Etnia Barcelona"
- [ ] Items added with vendor = "Etnia Barcelona"
- [ ] Cached with vendorName = "Etnia Barcelona" ✅ (Bug fix verified)

#### Ideal Optics
- [ ] Email parsed correctly
- [ ] Items extracted
- [ ] Catalog check performed
- [ ] Enrichment triggered (if items need UPC)
- [ ] Email record created with vendor = "Ideal Optics"
- [ ] Items added with vendor = "Ideal Optics"
- [ ] Cached with vendorName = "Ideal Optics" ✅ (Bug fix verified)

#### L'amyamerica
- [ ] Email parsed correctly
- [ ] Items extracted
- [ ] Catalog check performed
- [ ] Email record created with vendor = "L'amyamerica"
- [ ] Items added with vendor = "L'amyamerica"
- [ ] Cached with vendorName = "L'amyamerica" ✅ (Bug fix verified)

#### Kenmark
- [ ] Email parsed correctly
- [ ] Items extracted
- [ ] Catalog check performed
- [ ] Email record created with vendor = "kenmark"
- [ ] Items added with vendor = "kenmark"
- [ ] Cached with vendorName = "kenmark" ✅ (Bug fix verified)

#### Marchon
- [ ] Email parsed correctly
- [ ] Items extracted
- [ ] Catalog check performed
- [ ] Email record created with vendor = "Marchon"
- [ ] Items added with vendor = "Marchon" ✅ (Bug fix verified - was "kenmark")
- [ ] Cached with vendorName = "Marchon" ✅ (Bug fix verified)

### Edge Case Tests
- [ ] Unknown vendor → Logs to Supabase
- [ ] Malformed email → Error handled gracefully
- [ ] Zoho forwarded email → Cleaned correctly
- [ ] Gmail forwarded email → Cleaned correctly
- [ ] Outlook forwarded email → Cleaned correctly
- [ ] Email with no account ID → Error logged
- [ ] API timeout → Retries 3 times → Graceful failure

### Performance Tests
- [ ] Single email processes in < 7 seconds
- [ ] Parallel calls work (Create/Bulk-Add/Cache run together)
- [ ] 5 concurrent emails → All process successfully
- [ ] No race conditions or deadlocks

### Bug Verification Tests
- [ ] **Bug #1 Fixed:** All vendors cache with CORRECT vendorName (not "Modern Optical")
- [ ] **Bug #2 Fixed:** Marchon uses vendor = "Marchon" (not "kenmark")
- [ ] **Bug #3 Fixed:** Europa uses single Check Catalog node (no wrong reference)
- [ ] **Bug #4 Fixed:** Clear Vision routes to unknown handler (no empty branch)
- [ ] **Bug #5 Fixed:** No dead nodes in workflow

## Production Deployment

### Pre-Cutover
- [ ] All tests passed
- [ ] Stakeholders notified of deployment window
- [ ] Rollback plan prepared
- [ ] Old workflow still active

### Cutover (15-minute window)
1. [ ] **T-5 min:** Announce maintenance window
2. [ ] **T-0:** Pause old workflow (don't delete yet)
3. [ ] **T+1:** Activate new workflow
4. [ ] **T+2:** Update CloudMailin webhook URL to new workflow
5. [ ] **T+3:** Send test email for Modern Optical
6. [ ] **T+5:** Send test email for Luxottica
7. [ ] **T+7:** Send test email for Marchon
8. [ ] **T+9:** Verify all test emails processed correctly
9. [ ] **T+12:** Check database for correct vendor names
10. [ ] **T+15:** Declare success, end maintenance window

### Post-Cutover Monitoring (First 24 Hours)
- [ ] Monitor workflow executions every hour
- [ ] Check for any failures
- [ ] Verify all vendors processing
- [ ] Check Supabase for unknown vendor logs
- [ ] Verify no data loss
- [ ] Confirm performance within expectations

### Week 1 Monitoring
- [ ] Daily check of workflow metrics
- [ ] Daily check of error logs
- [ ] Verify all vendors still working
- [ ] Collect performance data
- [ ] Address any issues promptly

## Rollback Procedure

### If Critical Issues Occur:
1. [ ] Immediately pause new workflow
2. [ ] Re-activate old workflow
3. [ ] Update CloudMailin webhook URL back to old workflow
4. [ ] Verify old workflow processing correctly
5. [ ] Investigate issues in new workflow
6. [ ] Fix and re-test before attempting deployment again

### Rollback Triggers:
- Any data loss detected
- Critical errors > 10%
- Any vendor completely broken
- Processing time > 20 seconds average
- Customer complaints about missing data

## Post-Deployment Tasks

### Week 1:
- [ ] Archive old workflow (don't delete yet)
- [ ] Document any issues encountered
- [ ] Update runbook if needed
- [ ] Collect performance metrics
- [ ] Survey users for feedback

### Week 2-4:
- [ ] Monitor stability
- [ ] Plan Phase 2 enhancements (move config to Supabase)
- [ ] Consider adding PDF parsing for Safilo
- [ ] Plan error logging enhancements

### After 30 Days of Stable Operation:
- [ ] Delete old workflow
- [ ] Clean up test data
- [ ] Final performance report
- [ ] Celebrate success! 🎉

## Success Criteria

The deployment is successful if:
- ✅ All 9 vendors process correctly
- ✅ All 5 critical bugs are fixed
- ✅ No data loss occurs
- ✅ Performance is equal or better than old workflow
- ✅ No increase in error rate
- ✅ Parallel processing works correctly
- ✅ Enrichment works for Modern Optical and Ideal Optics
- ✅ Unknown vendors route to Supabase correctly

## Notes

### Important File Locations:
- **New Workflow:** `/mnt/c/Users/payto/OneDrive/Desktop/Software/Opti-Profit/Version1/n8n/n8n_workflow_new.json`
- **Summary:** `/mnt/c/Users/payto/OneDrive/Desktop/Software/Opti-Profit/Version1/n8n/REFACTORED_WORKFLOW_SUMMARY.md`
- **Comparison:** `/mnt/c/Users/payto/OneDrive/Desktop/Software/Opti-Profit/Version1/n8n/WORKFLOW_COMPARISON.md`
- **This Checklist:** `/mnt/c/Users/payto/OneDrive/Desktop/Software/Opti-Profit/Version1/n8n/DEPLOYMENT_CHECKLIST.md`

### Support Contacts:
- N8N Issues: [Your support channel]
- API Issues: [Backend team]
- Database Issues: [Database team]

### Known Limitations:
- PDF parsing for Safilo not implemented yet (uses HTML parsing)
- Vendor config is inline (will move to Supabase in Phase 2)
- No comprehensive error logging yet (will add in Phase 2)
- No metrics tracking yet (will add in Phase 2)

---

**Created:** 2025-12-09
**Last Updated:** 2025-12-09
**Version:** 1.0
