// Quick script to check account_vendors table
require('dotenv').config();
const { supabase } = require('./lib/supabase');

async function checkAccountVendors() {
  try {
    console.log('🔍 Checking account_vendors table...\n');

    // Get all account_vendors entries
    const { data, error } = await supabase
      .from('account_vendors')
      .select('*, accounts(name, email), vendors(name)');

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('✓ account_vendors table is EMPTY - no vendors hardcoded!');
      return;
    }

    console.log(`Found ${data.length} account_vendor entries:\n`);

    data.forEach(entry => {
      console.log('━'.repeat(60));
      console.log(`Account: ${entry.accounts?.name} (${entry.accounts?.email})`);
      console.log(`Vendor: ${entry.vendors?.name}`);
      console.log(`Vendor Account #: ${entry.vendor_account_number || 'N/A'}`);
      console.log(`Created: ${entry.created_at}`);
    });

    console.log('\n━'.repeat(60));
    console.log('\n💡 If you see unexpected entries above, delete them from Supabase dashboard:');
    console.log('   https://supabase.com → Your Project → Table Editor → account_vendors');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAccountVendors();
