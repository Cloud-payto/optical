require('dotenv').config();
const { supabase } = require('../lib/supabase');

/**
 * Vendor Email Patterns for Detection
 *
 * This module manages email_patterns JSONB column in the vendors table.
 * Patterns are synced on server startup (idempotent - only updates if changed).
 *
 * Pattern Structure:
 * {
 *   tier1: { domains: [], weight: 95 },           // Domain matching (highest priority)
 *   tier2: { body_signatures: [], weight: 85 },   // Body content signatures
 *   tier3: { subject_keywords: [], body_keywords: [], weight: 60, required_matches: 2 }
 * }
 *
 * Adding a new vendor:
 * 1. Add patterns here with vendor code as key (match your database vendor.code)
 * 2. Create parser in /parsers/ folder
 * 3. Register parser in /parsers/index.js
 * 4. Patterns auto-sync on next deploy/restart
 */

const vendorPatterns = {
  // Use uppercase codes to match your database
  SAFILO: {
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

  LUX: {
    tier1: {
      domains: ['luxottica.com', 'us.luxottica.com', 'my.luxottica.com'],
      weight: 95
    },
    tier2: {
      body_signatures: [
        'my.luxottica.com',
        'luxottica',
        'cart number',
        'customer reference',
        'luxottica group'
      ],
      weight: 85
    },
    tier3: {
      subject_keywords: ['luxottica', 'cart number', 'order confirmation'],
      body_keywords: ['luxottica', 'customer code', 'agent reference'],
      weight: 60,
      required_matches: 2
    }
  },

  luxottica: {
    tier1: {
      domains: ['luxottica.com', 'us.luxottica.com', 'my.luxottica.com'],
      weight: 95
    },
    tier2: {
      body_signatures: [
        'my.luxottica.com',
        'luxottica',
        'cart number',
        'customer reference',
        'luxottica group'
      ],
      weight: 85
    },
    tier3: {
      subject_keywords: ['luxottica', 'cart number', 'order confirmation'],
      body_keywords: ['luxottica', 'customer code', 'agent reference'],
      weight: 60,
      required_matches: 2
    }
  },

  // Ideal Optics
  IDEAL: {
    tier1: {
      domains: ['i-dealoptics.com', 'idealoptics.com'],
      weight: 95
    },
    tier2: {
      body_signatures: [
        'i-deal optics',
        'ideal optics',
        'i-dealoptics.com'
      ],
      weight: 85
    },
    tier3: {
      subject_keywords: ['ideal optics', 'i-deal', 'order confirmation'],
      body_keywords: ['i-deal optics', 'ideal optics', 'order number'],
      weight: 60,
      required_matches: 2
    }
  },

  idealoptics: {
    tier1: {
      domains: ['i-dealoptics.com', 'idealoptics.com'],
      weight: 95
    },
    tier2: {
      body_signatures: [
        'i-deal optics',
        'ideal optics',
        'i-dealoptics.com'
      ],
      weight: 85
    },
    tier3: {
      subject_keywords: ['ideal optics', 'i-deal', 'order confirmation'],
      body_keywords: ['i-deal optics', 'ideal optics', 'order number'],
      weight: 60,
      required_matches: 2
    }
  },

  // L'amyamerica
  LAMY: {
    tier1: {
      domains: ['lamyamerica.com', 'lamy-america.com'],
      weight: 95
    },
    tier2: {
      body_signatures: [
        "l'amy america",
        'lamy america',
        'lamyamerica.com'
      ],
      weight: 85
    },
    tier3: {
      subject_keywords: ['lamy', "l'amy", 'order confirmation'],
      body_keywords: ['lamy america', "l'amy america", 'order number'],
      weight: 60,
      required_matches: 2
    }
  },

  lamyamerica: {
    tier1: {
      domains: ['lamyamerica.com', 'lamy-america.com'],
      weight: 95
    },
    tier2: {
      body_signatures: [
        "l'amy america",
        'lamy america',
        'lamyamerica.com'
      ],
      weight: 85
    },
    tier3: {
      subject_keywords: ['lamy', "l'amy", 'order confirmation'],
      body_keywords: ['lamy america', "l'amy america", 'order number'],
      weight: 60,
      required_matches: 2
    }
  },

  MODERN: {
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

  ETNIA: {
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

  EUROPA: {
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
  },

  KENMARK: {
    tier1: {
      domains: ['kenmarkeyewear.com'],
      weight: 95
    },
    tier2: {
      body_signatures: [
        'kenmark eyewear',
        'kenmarkeyewear.com',
        'imageserver.jiecosystem.net/image/kenmark/',
        'kenmark'
      ],
      weight: 85
    },
    tier3: {
      subject_keywords: ['kenmark eyewear', 'kenmark', 'receipt for order number'],
      body_keywords: ['kenmark', 'order number', 'placed by rep'],
      weight: 60,
      required_matches: 2
    }
  },

  kenmark: {
    tier1: {
      domains: ['kenmarkeyewear.com'],
      weight: 95
    },
    tier2: {
      body_signatures: [
        'kenmark eyewear',
        'kenmarkeyewear.com',
        'imageserver.jiecosystem.net/image/kenmark/',
        'kenmark'
      ],
      weight: 85
    },
    tier3: {
      subject_keywords: ['kenmark eyewear', 'kenmark', 'receipt for order number'],
      body_keywords: ['kenmark', 'order number', 'placed by rep'],
      weight: 60,
      required_matches: 2
    }
  },

  MARCHON: {
    tier1: {
      domains: ['marchon.com', 'marchoneyewear.com', 'altaireyewear.com'],
      weight: 95
    },
    tier2: {
      body_signatures: [
        'marchon order confirmation',
        'marchon eyewear',
        'marchon',
        '1-800-645-1300'  // Marchon customer service number
      ],
      weight: 85
    },
    tier3: {
      subject_keywords: ['marchon', 'marchon order confirmation'],
      body_keywords: ['marchon', 'order id:', 'sales rep:', 'rep stock order'],
      weight: 60,
      required_matches: 2
    }
  },

  // Lowercase version for case-insensitive matching
  marchon: {
    tier1: {
      domains: ['marchon.com', 'marchoneyewear.com', 'altaireyewear.com'],
      weight: 95
    },
    tier2: {
      body_signatures: [
        'marchon order confirmation',
        'marchon eyewear',
        'marchon',
        '1-800-645-1300'  // Marchon customer service number
      ],
      weight: 85
    },
    tier3: {
      subject_keywords: ['marchon', 'marchon order confirmation'],
      body_keywords: ['marchon', 'order id:', 'sales rep:', 'rep stock order'],
      weight: 60,
      required_matches: 2
    }
  }
};

/**
 * Sync vendor patterns on server startup (idempotent)
 * Only updates vendors whose patterns have changed or are missing
 * Fast - skips vendors that already have correct patterns
 */
async function syncVendorPatterns() {
  console.log('🔄 Syncing vendor email patterns...');

  try {
    // Get all active vendors with their current patterns
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, name, code, email_patterns')
      .eq('is_active', true);

    if (vendorsError) {
      throw new Error(`Failed to fetch vendors: ${vendorsError.message}`);
    }

    let updatedCount = 0;
    let skippedCount = 0;
    let unchangedCount = 0;

    for (const vendor of vendors) {
      const newPatterns = vendorPatterns[vendor.code];

      if (!newPatterns) {
        skippedCount++;
        continue;
      }

      // Check if patterns need updating (compare JSON)
      const currentPatternsJson = JSON.stringify(vendor.email_patterns || {});
      const newPatternsJson = JSON.stringify(newPatterns);

      if (currentPatternsJson === newPatternsJson) {
        unchangedCount++;
        continue;
      }

      // Update patterns
      const { error: updateError } = await supabase
        .from('vendors')
        .update({ email_patterns: newPatterns })
        .eq('id', vendor.id);

      if (updateError) {
        console.error(`  ❌ Failed to update ${vendor.name}:`, updateError.message);
        continue;
      }

      console.log(`  ✅ Updated ${vendor.name} email patterns`);
      updatedCount++;
    }

    console.log(`📧 Vendor patterns sync complete: ${updatedCount} updated, ${unchangedCount} unchanged, ${skippedCount} no patterns defined`);

  } catch (error) {
    console.error('❌ Vendor pattern sync failed:', error.message);
    // Don't throw - allow server to start even if sync fails
  }
}

/**
 * Full seed function (verbose, for manual runs)
 */
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

// Run the seeding script when executed directly
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

module.exports = { seedVendorPatterns, syncVendorPatterns, vendorPatterns };
