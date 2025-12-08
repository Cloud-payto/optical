const fs = require('fs');
const path = require('path');

/**
 * Test script to verify Ideal Optics vendor detection
 * This simulates the detection logic from vendorDetection.js
 */

// Read the actual Ideal Optics email HTML
const emailHtml = fs.readFileSync(
  path.join(__dirname, 'email.txt'),
  'utf-8'
);

// Ideal Optics email patterns (from database)
const idealOpticsPatterns = {
  tier1: {
    weight: 95,
    domains: ['i-dealoptics.com']
  },
  tier2: {
    weight: 90,
    body_signatures: [
      'I-Deal Optics',
      'i-deal-optics-logo-mail.png',
      'orders@i-dealoptics.com',
      'weborders@i-dealoptics.com'
    ]
  },
  tier3: {
    weight: 75,
    required_matches: 2,
    subject_keywords: [
      'I-Deal Optics Order Confirmation',
      'I-Deal Optics',
      'Web Order'
    ],
    body_keywords: [
      'Thank You for Your Order',
      'Web Order #',
      'i-dealoptics.com'
    ]
  }
};

// Test data from the actual email
const testEmail = {
  from: 'info@i-dealoptics.com',
  subject: 'I-Deal Optics Order Confirmation',
  html: emailHtml,
  plainText: null
};

console.log('='.repeat(70));
console.log('🧪 IDEAL OPTICS VENDOR DETECTION TEST');
console.log('='.repeat(70));
console.log();

// Utility functions (mirroring vendorDetection.js)
function extractDomain(email) {
  if (!email || typeof email !== 'string') return null;
  const match = email.match(/@([^>]+)/);
  return match ? match[1].toLowerCase().trim() : null;
}

function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

// TIER 1: Domain Matching
console.log('📊 TIER 1: Domain Matching (95% confidence)');
console.log('-'.repeat(70));
const domain = extractDomain(testEmail.from);
console.log(`  From: ${testEmail.from}`);
console.log(`  Extracted domain: ${domain}`);

let tier1Match = false;
for (const vendorDomain of idealOpticsPatterns.tier1.domains) {
  if (domain && domain.includes(vendorDomain.toLowerCase())) {
    console.log(`  ✅ MATCH: Domain "${domain}" contains "${vendorDomain}"`);
    console.log(`  🎯 Confidence: ${idealOpticsPatterns.tier1.weight}%`);
    console.log(`  🚀 SHORT CIRCUIT: Vendor detected immediately!`);
    tier1Match = true;
    break;
  }
}

if (!tier1Match) {
  console.log(`  ❌ No domain match found`);
}
console.log();

// TIER 2: Body Signatures
console.log('📊 TIER 2: Body Signatures (90% confidence)');
console.log('-'.repeat(70));
const normalizedBody = normalizeText(emailHtml);
const matchedSignatures = [];

for (const signature of idealOpticsPatterns.tier2.body_signatures) {
  const normalizedSignature = normalizeText(signature);
  if (normalizedBody.includes(normalizedSignature)) {
    matchedSignatures.push(signature);
    console.log(`  ✅ Signature match: "${signature}"`);
  } else {
    console.log(`  ❌ Not found: "${signature}"`);
  }
}

if (matchedSignatures.length > 0) {
  console.log(`  🎯 Confidence: ${idealOpticsPatterns.tier2.weight}%`);
  console.log(`  📝 Matched ${matchedSignatures.length}/${idealOpticsPatterns.tier2.body_signatures.length} signatures`);
} else {
  console.log(`  ❌ No body signatures matched`);
}
console.log();

// TIER 3: Weak Patterns
console.log('📊 TIER 3: Weak Patterns (75% confidence, requires 2+ matches)');
console.log('-'.repeat(70));
const normalizedSubject = normalizeText(testEmail.subject);
let matchCount = 0;
const matchedSubjectKeywords = [];
const matchedBodyKeywords = [];

// Check subject keywords
console.log('  Subject Keywords:');
for (const keyword of idealOpticsPatterns.tier3.subject_keywords) {
  const normalizedKeyword = normalizeText(keyword);
  if (normalizedSubject.includes(normalizedKeyword)) {
    matchCount++;
    matchedSubjectKeywords.push(keyword);
    console.log(`    ✅ "${keyword}"`);
  } else {
    console.log(`    ❌ "${keyword}"`);
  }
}

// Check body keywords
console.log('  Body Keywords:');
for (const keyword of idealOpticsPatterns.tier3.body_keywords) {
  const normalizedKeyword = normalizeText(keyword);
  if (normalizedBody.includes(normalizedKeyword)) {
    matchCount++;
    matchedBodyKeywords.push(keyword);
    console.log(`    ✅ "${keyword}"`);
  } else {
    console.log(`    ❌ "${keyword}"`);
  }
}

const requiredMatches = idealOpticsPatterns.tier3.required_matches;
console.log(`  📊 Match count: ${matchCount}/${requiredMatches} required`);

if (matchCount >= requiredMatches) {
  console.log(`  🎯 Confidence: ${idealOpticsPatterns.tier3.weight}%`);
  console.log(`  ✅ TIER 3 PASSED`);
} else {
  console.log(`  ❌ TIER 3 FAILED (insufficient matches)`);
}
console.log();

// Final Result
console.log('='.repeat(70));
console.log('📋 FINAL RESULT');
console.log('='.repeat(70));

if (tier1Match) {
  console.log(`✅ VENDOR DETECTED: Ideal Optics`);
  console.log(`   Method: Domain matching (Tier 1)`);
  console.log(`   Confidence: ${idealOpticsPatterns.tier1.weight}%`);
  console.log(`   Domain: ${domain}`);
} else if (matchedSignatures.length > 0) {
  console.log(`✅ VENDOR DETECTED: Ideal Optics`);
  console.log(`   Method: Body signatures (Tier 2)`);
  console.log(`   Confidence: ${idealOpticsPatterns.tier2.weight}%`);
  console.log(`   Matched signatures: ${matchedSignatures.join(', ')}`);
} else if (matchCount >= requiredMatches) {
  console.log(`✅ VENDOR DETECTED: Ideal Optics`);
  console.log(`   Method: Weak patterns (Tier 3)`);
  console.log(`   Confidence: ${idealOpticsPatterns.tier3.weight}%`);
  console.log(`   Subject matches: ${matchedSubjectKeywords.join(', ')}`);
  console.log(`   Body matches: ${matchedBodyKeywords.join(', ')}`);
} else {
  console.log(`❌ VENDOR NOT DETECTED`);
  console.log(`   Reason: No tier passed the threshold`);
}
console.log('='.repeat(70));
console.log();

// Summary
console.log('📊 DETECTION SUMMARY');
console.log('-'.repeat(70));
console.log(`  Tier 1 (Domain): ${tier1Match ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`  Tier 2 (Signatures): ${matchedSignatures.length > 0 ? '✅ PASSED' : '❌ FAILED'} (${matchedSignatures.length}/${idealOpticsPatterns.tier2.body_signatures.length} matches)`);
console.log(`  Tier 3 (Weak Patterns): ${matchCount >= requiredMatches ? '✅ PASSED' : '❌ FAILED'} (${matchCount}/${requiredMatches} matches)`);
console.log('='.repeat(70));
console.log();

console.log('💡 Next Steps:');
console.log('   1. Test the actual /api/emails/detect-vendor endpoint');
console.log('   2. Clear vendor cache if needed: vendorDetectionService.clearCache()');
console.log('   3. Monitor detection logs in production');
console.log();
