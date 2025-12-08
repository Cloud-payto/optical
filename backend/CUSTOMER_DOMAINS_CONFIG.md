# Customer Domains Configuration

## Problem

When emails are forwarded through multiple layers, the vendor detection system needs to filter out **customer/personal domains** to find the actual vendor.

## Current Personal Domain Filters

The following domains are automatically filtered out during forwarded email extraction:

**Personal Email Providers:**
- gmail.com
- yahoo.com
- outlook.com
- hotmail.com
- icloud.com
- aol.com
- live.com
- me.com

**Known Customer Domains:**
- yesnickvision.com
- tatumeyecare.com
- pveyecare.com
- mohaveeyecenter.com
- opticalshop.com
- myshop.com

## How to Add More Customer Domains

Edit [services/vendorDetection.js](server/services/vendorDetection.js:102) in the `extractOriginalSender` method:

```javascript
const personalDomains = [
  // Personal email providers
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
  'icloud.com', 'aol.com', 'live.com', 'me.com',

  // Your customer domains (add more here)
  'yesnickvision.com',
  'tatumeyecare.com',
  'pveyecare.com',
  'mohaveeyecenter.com',
  'opticalshop.com',
  'myshop.com',

  // Add new customer domains below:
  'newcustomer.com',
  'anothercustomer.com',

  '@system.local'
];
```

## When to Add a Domain

Add a customer domain to the filter list when:

✅ It's YOUR customer forwarding a vendor email to you
✅ The domain appears in forwarded emails but is NOT a vendor
✅ You see incorrect detection because a customer email is being matched

## Example

**Email forwarding chain:**
```
From: pmillet@modernoptical.com (YOU)
  ↓
From: Tim@yesnickvision.com (YOUR CUSTOMER)
  ↓
From: noreply@safilo.com (ACTUAL VENDOR) ✅
```

Without filtering `yesnickvision.com`, the system might detect Tim's email instead of Safilo's. By filtering it out, the system correctly identifies `noreply@safilo.com`.

## Alternative: Dynamic Customer Domain Detection

If you have many customers, you could pull customer domains from your database instead of hardcoding them.

**Future enhancement (if needed):**

```javascript
// Load customer domains from database
const { data: customers } = await supabase
  .from('customers')
  .select('email_domain');

const customerDomains = customers.map(c => c.email_domain);
const personalDomains = [
  'gmail.com', 'yahoo.com', ...
  ...customerDomains  // Add all customer domains dynamically
];
```

## Testing

After adding a new customer domain, test with:

```bash
node scripts/testForwardedEmail.js
```

Or make an API call with a forwarded email from that customer.

## Notes

- Domains are matched using `.includes()`, so `example.com` will also filter `mail.example.com`
- No need to restart the server - the change takes effect immediately (no caching on this list)
- Keep the list focused on common forwarders - don't add vendor domains here!
