const { supabase, vendorOperations } = require('../lib/supabase');

/**
 * Vendor Detection Service
 *
 * Implements a three-tier hierarchical matching system:
 * - Tier 1: Domain matching (95% confidence) - SHORT CIRCUITS on match
 * - Tier 2: Strong body signatures (80-90% confidence)
 * - Tier 3: Weak patterns (50-70% confidence) - requires multiple matches
 *
 * Returns vendor with confidence >= 70%, otherwise returns "unknown"
 */

class VendorDetectionService {
  constructor() {
    this.vendorsCache = null;
    this.cacheTimestamp = null;
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Load vendors and their email patterns from database
   * Uses caching to reduce database calls
   */
  async loadVendors() {
    const now = Date.now();

    // Return cached vendors if still fresh
    if (this.vendorsCache && this.cacheTimestamp && (now - this.cacheTimestamp < this.CACHE_TTL)) {
      console.log('📋 Using cached vendor patterns');
      return this.vendorsCache;
    }

    console.log('🔄 Loading vendor patterns from database...');

    try {
      const { data: vendors, error } = await supabase
        .from('vendors')
        .select('id, name, code, email_patterns')
        .eq('is_active', true);

      if (error) throw error;

      // Filter vendors that have email_patterns configured
      const vendorsWithPatterns = (vendors || []).filter(v => v.email_patterns);

      console.log(`✅ Loaded ${vendorsWithPatterns.length} vendors with email patterns`);

      this.vendorsCache = vendorsWithPatterns;
      this.cacheTimestamp = now;

      return vendorsWithPatterns;
    } catch (error) {
      console.error('❌ Error loading vendors:', error);
      throw new Error('Failed to load vendor patterns from database');
    }
  }

  /**
   * Extract domain from email address
   * e.g., "noreply@safilo.com" -> "safilo.com"
   */
  extractDomain(email) {
    if (!email || typeof email !== 'string') return null;

    const match = email.match(/@([^>]+)/);
    return match ? match[1].toLowerCase().trim() : null;
  }

  /**
   * Normalize text for matching (lowercase, remove extra whitespace)
   */
  normalizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  /**
   * Extract ALL email addresses from email body and find the most likely vendor
   * Handles multiple forwarding layers and prioritizes vendor domains
   */
  extractOriginalSender(emailBody, vendors) {
    if (!emailBody || typeof emailBody !== 'string') return null;

    console.log('  🔍 Checking for forwarded email patterns...');

    // Extract ALL email addresses from the entire email body
    const emailPattern = /([a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi;
    const allEmails = emailBody.match(emailPattern) || [];

    if (allEmails.length === 0) {
      console.log('  ❌ No email addresses found in body');
      return null;
    }

    console.log(`  📧 Found ${allEmails.length} email addresses in body`);

    // Deduplicate emails (case-insensitive)
    const uniqueEmails = [...new Set(allEmails.map(e => e.toLowerCase()))];

    // Filter out personal/non-vendor emails
    const personalDomains = [
      'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
      'icloud.com', 'aol.com', 'live.com', 'me.com',
      'yesnickvision.com', 'tatumeyecare.com', 'pveyecare.com',
      'mohaveeyecenter.com', 'opticalshop.com', 'myshop.com',
      '@system.local'
    ];

    const filteredEmails = uniqueEmails.filter(email => {
      const domain = this.extractDomain(email);
      return domain && !personalDomains.some(pd => domain.includes(pd));
    });

    console.log(`  📧 After filtering personal emails: ${filteredEmails.length} candidates`);
    if (filteredEmails.length > 0) {
      console.log(`     Candidates: ${filteredEmails.join(', ')}`);
    }

    // Strategy 1: Check if any email matches a known vendor domain
    if (vendors && filteredEmails.length > 0) {
      for (const email of filteredEmails) {
        const domain = this.extractDomain(email);

        for (const vendor of vendors) {
          const vendorDomains = vendor.email_patterns?.tier1?.domains || [];
          const matchedDomain = vendorDomains.find(vd =>
            domain.toLowerCase().includes(vd.toLowerCase())
          );

          if (matchedDomain) {
            console.log(`  ✅ Found vendor email: ${email} (matches ${vendor.name})`);
            return email;
          }
        }
      }
    }

    // Strategy 2: Return first filtered email if no vendor match
    if (filteredEmails.length > 0) {
      console.log(`  ⚠️  Using first filtered email: ${filteredEmails[0]} (no vendor domain match)`);
      return filteredEmails[0];
    }

    console.log('  ❌ No suitable email found after filtering');
    return null;
  }

  /**
   * Tier 1: Domain Matching
   * Highest confidence (95%), short-circuits if matched
   */
  checkDomainMatch(emailFrom, vendor) {
    const domain = this.extractDomain(emailFrom);
    if (!domain) return null;

    const patterns = vendor.email_patterns?.tier1;
    if (!patterns || !patterns.domains) return null;

    console.log(`  🔍 Checking domain: ${domain} against ${vendor.name}`);

    // Check if any of the vendor's domains match
    const matchedDomain = patterns.domains.find(vendorDomain =>
      domain.includes(vendorDomain.toLowerCase())
    );

    if (matchedDomain) {
      console.log(`  ✅ Domain match found: ${matchedDomain}`);
      return {
        vendor: vendor.code,
        vendorId: vendor.id,
        vendorName: vendor.name,
        confidence: patterns.weight || 95,
        method: 'domain',
        signals: {
          domain: true,
          matchedDomain: matchedDomain,
          bodySignatures: [],
          subjectKeywords: []
        }
      };
    }

    return null;
  }

  /**
   * Tier 2: Strong Body Signatures
   * High confidence (80-90%), checks unique company identifiers
   */
  checkBodySignatures(emailBody, vendor) {
    const patterns = vendor.email_patterns?.tier2;
    if (!patterns || !patterns.body_signatures) return null;

    const normalizedBody = this.normalizeText(emailBody);
    const matchedSignatures = [];

    console.log(`  🔍 Checking body signatures for ${vendor.name}`);

    for (const signature of patterns.body_signatures) {
      const normalizedSignature = this.normalizeText(signature);
      if (normalizedBody.includes(normalizedSignature)) {
        matchedSignatures.push(signature);
        console.log(`    ✅ Signature match: "${signature}"`);
      }
    }

    if (matchedSignatures.length > 0) {
      return {
        vendor: vendor.code,
        vendorId: vendor.id,
        vendorName: vendor.name,
        confidence: patterns.weight || 85,
        method: 'body_signature',
        signals: {
          domain: false,
          bodySignatures: matchedSignatures,
          subjectKeywords: []
        }
      };
    }

    return null;
  }

  /**
   * Tier 3: Weak Patterns
   * Lower confidence (50-70%), requires multiple matches to reach threshold
   */
  checkWeakPatterns(emailSubject, emailBody, vendor) {
    const patterns = vendor.email_patterns?.tier3;
    if (!patterns) return null;

    const normalizedSubject = this.normalizeText(emailSubject || '');
    const normalizedBody = this.normalizeText(emailBody || '');

    let matchCount = 0;
    const matchedSubjectKeywords = [];
    const matchedBodyKeywords = [];

    console.log(`  🔍 Checking weak patterns for ${vendor.name}`);

    // Check subject keywords
    if (patterns.subject_keywords) {
      for (const keyword of patterns.subject_keywords) {
        const normalizedKeyword = this.normalizeText(keyword);
        if (normalizedSubject.includes(normalizedKeyword)) {
          matchCount++;
          matchedSubjectKeywords.push(keyword);
          console.log(`    ✅ Subject keyword match: "${keyword}"`);
        }
      }
    }

    // Check body keywords
    if (patterns.body_keywords) {
      for (const keyword of patterns.body_keywords) {
        const normalizedKeyword = this.normalizeText(keyword);
        if (normalizedBody.includes(normalizedKeyword)) {
          matchCount++;
          matchedBodyKeywords.push(keyword);
          console.log(`    ✅ Body keyword match: "${keyword}"`);
        }
      }
    }

    const requiredMatches = patterns.required_matches || 2;
    console.log(`    Match count: ${matchCount}/${requiredMatches}`);

    if (matchCount >= requiredMatches) {
      return {
        vendor: vendor.code,
        vendorId: vendor.id,
        vendorName: vendor.name,
        confidence: patterns.weight || 60,
        method: 'weak_patterns',
        signals: {
          domain: false,
          bodySignatures: [],
          subjectKeywords: matchedSubjectKeywords,
          bodyKeywords: matchedBodyKeywords,
          matchCount
        }
      };
    }

    return null;
  }

  /**
   * Main detection method
   * Processes email through hierarchical tiers
   */
  async detectVendor(emailData) {
    const { from, subject, html, plainText } = emailData;
    const startTime = Date.now();

    console.log('\n🔍 VENDOR DETECTION START');
    console.log(`  From: ${from}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Has HTML: ${!!html}`);
    console.log(`  Has Plain Text: ${!!plainText}`);

    // Validate input
    if (!from) {
      console.log('❌ Missing "from" field');
      return {
        success: false,
        vendor: 'unknown',
        confidence: 0,
        needsManualReview: true,
        message: 'Missing required field: from',
        executionTime: Date.now() - startTime
      };
    }

    // Load vendors
    const vendors = await this.loadVendors();

    if (!vendors || vendors.length === 0) {
      console.log('⚠️  No active vendors with email patterns found');
      return {
        success: false,
        vendor: 'unknown',
        confidence: 0,
        needsManualReview: true,
        message: 'No vendor patterns configured',
        executionTime: Date.now() - startTime
      };
    }

    // Prepare email body (prefer plainText, fallback to html)
    const emailBody = plainText || html || '';

    // Try to extract original sender from forwarded email
    let actualSender = from;
    const originalSender = this.extractOriginalSender(emailBody, vendors);
    if (originalSender) {
      console.log(`\n📧 FORWARDED EMAIL DETECTED`);
      console.log(`  Outer sender: ${from}`);
      console.log(`  Original sender: ${originalSender}`);
      actualSender = originalSender; // Use original sender for detection
    }

    // Store all vendor scores for debugging
    const allScores = [];

    // TIER 1: Domain Matching (SHORT CIRCUITS)
    console.log('\n📊 TIER 1: Domain Matching');
    console.log(`  Using sender: ${actualSender}`);
    for (const vendor of vendors) {
      const result = this.checkDomainMatch(actualSender, vendor);
      if (result) {
        const executionTime = Date.now() - startTime;
        console.log(`\n✅ DOMAIN MATCH FOUND: ${result.vendorName}`);
        console.log(`  Confidence: ${result.confidence}%`);
        console.log(`  Execution time: ${executionTime}ms`);

        // Add forwarding info to signals if applicable
        if (originalSender) {
          result.signals.forwarded = true;
          result.signals.outerSender = from;
          result.signals.originalSender = originalSender;
        }

        return {
          success: true,
          ...result,
          executionTime
        };
      }
    }
    console.log('  ❌ No domain matches found');

    // TIER 2: Body Signatures
    console.log('\n📊 TIER 2: Body Signatures');
    for (const vendor of vendors) {
      const result = this.checkBodySignatures(emailBody, vendor);
      if (result) {
        allScores.push(result);
      }
    }

    // Return highest confidence from Tier 2 if above threshold
    const tier2Match = allScores.find(r => r.confidence >= 70);
    if (tier2Match) {
      const executionTime = Date.now() - startTime;
      console.log(`\n✅ BODY SIGNATURE MATCH: ${tier2Match.vendorName}`);
      console.log(`  Confidence: ${tier2Match.confidence}%`);
      console.log(`  Execution time: ${executionTime}ms`);

      return {
        success: true,
        ...tier2Match,
        executionTime
      };
    }
    console.log('  ❌ No strong body signature matches above threshold');

    // TIER 3: Weak Patterns
    console.log('\n📊 TIER 3: Weak Patterns');
    for (const vendor of vendors) {
      const result = this.checkWeakPatterns(subject, emailBody, vendor);
      if (result) {
        allScores.push(result);
      }
    }

    // Find best match from all tiers
    const bestMatch = allScores.reduce((best, current) => {
      return current.confidence > (best?.confidence || 0) ? current : best;
    }, null);

    const executionTime = Date.now() - startTime;

    // Return best match if above threshold
    if (bestMatch && bestMatch.confidence >= 70) {
      console.log(`\n✅ MATCH FOUND: ${bestMatch.vendorName}`);
      console.log(`  Method: ${bestMatch.method}`);
      console.log(`  Confidence: ${bestMatch.confidence}%`);
      console.log(`  Execution time: ${executionTime}ms`);

      return {
        success: true,
        ...bestMatch,
        executionTime
      };
    }

    // No match found or below threshold
    console.log('\n❌ NO MATCH FOUND');
    console.log(`  Best score: ${bestMatch?.confidence || 0}%`);
    console.log(`  Execution time: ${executionTime}ms`);

    return {
      success: false,
      vendor: 'unknown',
      confidence: bestMatch?.confidence || 0,
      needsManualReview: true,
      message: 'No vendor matched with sufficient confidence',
      debug: {
        allScores: allScores.map(s => ({
          vendor: s.vendorName,
          confidence: s.confidence,
          method: s.method
        }))
      },
      executionTime
    };
  }

  /**
   * Clear vendor cache (useful for testing or after pattern updates)
   */
  clearCache() {
    this.vendorsCache = null;
    this.cacheTimestamp = null;
    console.log('🗑️  Vendor cache cleared');
  }
}

// Export singleton instance
module.exports = new VendorDetectionService();
