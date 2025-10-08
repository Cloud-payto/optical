/**
 * Check if vendor patterns are seeded in the database
 */

require('dotenv').config();
const { supabase } = require('../lib/supabase');

async function checkPatterns() {
  console.log('🔍 Checking vendor email patterns in database...\n');

  try {
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('id, name, code, email_patterns, is_active')
      .eq('is_active', true);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!vendors || vendors.length === 0) {
      console.log('❌ No active vendors found in database!');
      return;
    }

    console.log(`📋 Found ${vendors.length} active vendors:\n`);

    let patternsCount = 0;
    let missingCount = 0;

    for (const vendor of vendors) {
      const hasPatterns = vendor.email_patterns &&
                          vendor.email_patterns.tier1 &&
                          vendor.email_patterns.tier1.domains;

      if (hasPatterns) {
        patternsCount++;
        console.log(`✅ ${vendor.name} (${vendor.code})`);
        console.log(`   Domains: ${vendor.email_patterns.tier1.domains.join(', ')}`);
        console.log(`   Tier 2 signatures: ${vendor.email_patterns.tier2?.body_signatures?.length || 0}`);
        console.log('');
      } else {
        missingCount++;
        console.log(`❌ ${vendor.name} (${vendor.code}) - NO PATTERNS CONFIGURED`);
        console.log('');
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 SUMMARY');
    console.log(`${'='.repeat(60)}`);
    console.log(`Total vendors: ${vendors.length}`);
    console.log(`With patterns: ${patternsCount} ✅`);
    console.log(`Missing patterns: ${missingCount} ❌`);

    if (missingCount > 0) {
      console.log(`\n⚠️  ${missingCount} vendor(s) are missing email patterns!`);
      console.log('\n🔧 TO FIX: Run the seeding script:');
      console.log('   node scripts/seedVendorPatterns.js\n');
    } else {
      console.log('\n🎉 All vendors have email patterns configured!\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nMake sure:');
    console.error('  1. You have a .env file with Supabase credentials');
    console.error('  2. The vendors table exists');
    console.error('  3. The email_patterns column exists (JSONB type)\n');
    process.exit(1);
  }
}

checkPatterns();
