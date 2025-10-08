require('dotenv').config();
const { supabase } = require('../lib/supabase');

/**
 * Seed Email Patterns for Vendor Detection
 *
 * This script populates the email_patterns JSONB column in the vendors table
 * with real patterns extracted from actual vendor emails.
 *
 * Pattern Structure:
 * {
 *   tier1: { domains: [], weight: 95 },
 *   tier2: { body_signatures: [], weight: 85 },
 *   tier3: { subject_keywords: [], body_keywords: [], weight: 60, required_matches: 2 }
 * }
 */

const vendorPatterns = {
  safilo: {
    tier1: {
      domains: ['safilo.com', 'mysafilo.com'],
      weight: 95
    },
    tier2: {
      body_signatures: [
        'safilo usa, inc',
        'safilo usa inc',
        'safilo.com',
        'mysafilo.com'
      ],
      weight: 85
    },
    tier3: {
      subject_keywords: ['safilo', 'mysafilo'],
      body_keywords: ['safilo', 'order has been received'],
      weight: 60,
      required_matches: 2
    }
  },

  luxottica: {
    tier1: {
      domains: ['luxottica.com', 'us.luxottica.com'],
      weight: 95
    },
    tier2: {
      body_signatures: [
        'my.luxottica.com',
        'luxottica',
        'cart number',
        'customer reference'
      ],
      weight: 85
    },
    tier3: {
      subject_keywords: ['luxottica', 'cart number'],
      body_keywords: ['luxottica', 'customer code', 'agent reference'],
      weight: 60,
      required_matches: 2
    }
  },

  modern_optical: {
    tier1: {
      domains: ['modernoptical.com'],
      weight: 95
    },
    tier2: {
      body_signatures: [
        'custsvc@modernoptical.com',
        'modernoptical.com',
        'modern optical'
      ],
      weight: 85
    },
    tier3: {
      subject_keywords: ['modern optical', 'receipt for order number'],
      body_keywords: ['custsvc@modernoptical.com', 'order number', 'placed by rep'],
      weight: 60,
      required_matches: 2
    }
  },

  etnia_barcelona: {
    tier1: {
      domains: ['etniabarcelona.com', 'etnia.es'],
      weight: 95
    },
    tier2: {
      body_signatures: [
        'etnia barcelona llc',
        'etnia eyewear culture',
        'etniabarcelona.com',
        'extranet-etniabarcelona.com',
        'etnia barcelona'
      ],
      weight: 85
    },
    tier3: {
      subject_keywords: ['etnia', 'order'],
      body_keywords: ['etnia barcelona', 'etnia eyewear', 'trusting in etnia'],
      weight: 60,
      required_matches: 2
    }
  },

  europa: {
    tier1: {
      domains: ['europaeye.com'],
      weight: 95
    },
    tier2: {
      body_signatures: [
        'europaeye.com',
        'europa',
        'europa sales representative'
      ],
      weight: 85
    },
    tier3: {
      subject_keywords: ['europa', 'customer receipt', 'receipt for order'],
      body_keywords: ['europaeye.com', 'order placed by rep', 'europa'],
      weight: 60,
      required_matches: 2
    }
  }
};

async function seedVendorPatterns() {
  console.log('🌱 Starting vendor pattern seeding...\n');

  try {
    // Get all active vendors
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, name, code')
      .eq('is_active', true);

    if (vendorsError) {
      throw new Error(`Failed to fetch vendors: ${vendorsError.message}`);
    }

    console.log(`📋 Found ${vendors.length} active vendors\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    // Update each vendor with its patterns
    for (const vendor of vendors) {
      const patterns = vendorPatterns[vendor.code];

      if (!patterns) {
        console.log(`⏭️  Skipping ${vendor.name} (${vendor.code}) - no patterns defined`);
        skippedCount++;
        continue;
      }

      console.log(`📝 Updating ${vendor.name} (${vendor.code})...`);
      console.log(`   Tier 1 domains: ${patterns.tier1.domains.length}`);
      console.log(`   Tier 2 signatures: ${patterns.tier2.body_signatures.length}`);
      console.log(`   Tier 3 patterns: ${patterns.tier3.subject_keywords.length + patterns.tier3.body_keywords.length}`);

      const { error: updateError } = await supabase
        .from('vendors')
        .update({ email_patterns: patterns })
        .eq('id', vendor.id);

      if (updateError) {
        console.error(`   ❌ Error updating ${vendor.name}:`, updateError.message);
        continue;
      }

      console.log(`   ✅ Successfully updated ${vendor.name}\n`);
      updatedCount++;
    }

    console.log('\n🎉 Seeding complete!');
    console.log(`   ✅ Updated: ${updatedCount} vendors`);
    console.log(`   ⏭️  Skipped: ${skippedCount} vendors`);

    // Verify the patterns were saved
    console.log('\n🔍 Verifying saved patterns...');
    const { data: verifyVendors, error: verifyError } = await supabase
      .from('vendors')
      .select('id, name, code, email_patterns')
      .eq('is_active', true)
      .not('email_patterns', 'is', null);

    if (verifyError) {
      console.error('⚠️  Could not verify patterns:', verifyError.message);
    } else {
      console.log(`✅ Verified ${verifyVendors.length} vendors have email patterns configured`);

      // Show sample of saved patterns
      if (verifyVendors.length > 0) {
        const sample = verifyVendors[0];
        console.log(`\n📄 Sample pattern (${sample.name}):`);
        console.log(JSON.stringify(sample.email_patterns, null, 2));
      }
    }

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run the seeding script
if (require.main === module) {
  seedVendorPatterns()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedVendorPatterns, vendorPatterns };
